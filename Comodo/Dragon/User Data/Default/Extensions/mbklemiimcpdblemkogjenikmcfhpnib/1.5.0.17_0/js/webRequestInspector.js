define(function (require) { 

    var exports = {};

(function () {

    // Frameworks:
    var Session = require('./backgroundSession').Session;
    var URI = require('./frameworks/uri').URI;
    var messageDispatcher = require('./messaging').MessageDispatcher;
    var bgUtils = require('./backgroundUtils');
    var md5 = require('./frameworks/md5');
    var localConfig = require('./localConfig');
    var adRequestHeaderName = localConfig.AD_REQUEST_HEADER_NAME;
    var affiliateHeaderName = localConfig.AFFILIATE_REQUEST_HEADER_NAME;
    var affiliateHeaderValue = localConfig.AFFILIATE_REQUEST_HEADER_VALUE;
    var instanceIdHeaderName = localConfig.INSTANCE_ID_HEADER_NAME;
    var vendorID = localConfig.VENDOR_ID; // vendor id
    var vendorHeader = localConfig.VENDOR_HEADER_NAME; // name of header
    var hostHeader = localConfig.HOST_HEADER_NAME; // name of header
    var referrerHeader = localConfig.REFERRER_HEADER_NAME; // name of header
    var pageHeader = localConfig.PAGE_ID_HEADER_NAME; //name of header
    var versionHeaderName = localConfig.PD_VERSION_HEADER_NAME; //name of header
    var categoriesWhitelist = localConfig.USERPREFS_CATEGORIES_WHITE_LIST;
    var userPrefs = require('./userPrefs');
    var pixImg =  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAA1JREFUGFdj+P//PwMACPwC/ohfBuAAAAAASUVORK5CYII=';

    //badge text must be 0 at page load start
    bgUtils.initBadgeText();

    WebRequestInspector = function () {
        this._regexReplaceArray = [];
        this._exclusions = {};
        this._headerMap = {}; // mapping: request id --> domain string
        this._redirectHeaderMap = {}; // if redirect is canceled instead of redirected
        this._headerMapSkiped = {};
        this._requestMap = {};
        this._replacedRequests = {};
        this._matchedRequests = {};
        this._gotchaStamp = 0;
        this._redirected = {};
        this._block_arrays = [];
        this._redirect_arrays = [];
    };

    WebRequestInspector.prototype.setExclusions = function (excludeConfigAttrs) {
        this._exclusions = {};
        var hosts = excludeConfigAttrs.h;
        for (var i = 0; i < hosts.length; i++) {
            var host = hosts[i];
            var regExp = host.n;
            if (host.s === 1) {
                regExp = '*.' + regExp;
            }
            regExp = regExp.replace(/^\*\./g, '*');
            regExp = regExp.replace(/\./g, '\\.');
            regExp = regExp.replace(/\*/g, '.*');
            var regExp = new RegExp('^' + regExp + '$');

            this._exclusions[host.n] = {
                hostNameRegExp: regExp,
                subdomains: host.s,
                pages: []
            };
            if (host.p) {
                var pages = host.p;
                var page, rules, r;
                for (var j = 0; j < pages.length; j++) {
                    page = pages[j];
                    rules = [];
                    r =  page.r;
                    for(var k = 0; k < r.length; k++) {
                        rules.push(makeRegExpFromString(r[k]));
                    }

                    this._exclusions[host.n].pages.push({
                        regExp: makeRegExpFromString(page.e),
                        rules: rules
                    });
                }
            }
        }

        function makeRegExpFromString (string) {
            var match = string.match(/\/(.*)\/([i|g|m]*)/);
            var expression = match[1];
            var flags = match[2] ? match[2] : '';
            if (!expression) {
                console.warn('Wrong regular expression in config', string);
            }
            return new RegExp(expression, flags);
        }
    };

    WebRequestInspector.prototype.checkExclusions = function (instance, tabId, resourceUrl) {
        var mainFrameUrl = Session.getTabInfoProperty(tabId, 'url');
        if (!mainFrameUrl) {
            return;
        }
        var mainFrameDomain = URI.parse(mainFrameUrl).host_without_www;
        var mainFramePathNquery = URI.parse(mainFrameUrl).pathNquery;
        mainFramePathNquery = mainFramePathNquery.replace(/^\//, "");
        var exclusionItem = false;
        var isFullDomainInExclusions = mainFrameDomain in instance._exclusions;
        //if full domain was specified in exclusion list
        if (isFullDomainInExclusions) {
            exclusionItem = instance._exclusions[mainFrameDomain];
        //else needed check if main frame domain is subdomain of some excluded host
        } else {
            for (var exclDom in instance._exclusions) {
                var exclItem = instance._exclusions[exclDom];
                //checking for excluded domain presence in url, even it's a subdomain url
                if (exclItem.hostNameRegExp.test(mainFrameDomain)) {
                    exclusionItem = exclItem;
                    break;
                }
            }
        }

        if (exclusionItem) {
            //if no page specified, then exclude all requests on this domain
            if (!exclusionItem.pages.length) {
                return true;
            }

            for (var i = 0; i < exclusionItem.pages.length; i++) {
                var page = exclusionItem.pages[i];
                //if page exclusion is present and it passes current main_frame url
                if (page.regExp.test(mainFramePathNquery)) {
                    for (var j = 0; j < page.rules.length; j++) {
                        var rule = page.rules[j];
                        //checking current request url by page rules
                        if (rule.test(resourceUrl)) {
                            return true;
                        }
                    }
                }
            }
        }

        return false;
    };

    WebRequestInspector.prototype.setRedirections = function (replaceArray) {
        this._block_arrays_Raw = _.filter(replaceArray, function (item) {
            return item.t === WebRequestInspector.STR['block'].FQDN || item.t === WebRequestInspector.STR['block'].FULL_PATH;
        });

        this._redirect_arrays_Raw = _.filter(replaceArray, function (item) {
            return item.t === WebRequestInspector.STR['redirect'].FQDN || item.t === WebRequestInspector.STR['redirect'].FULL_PATH;
        });


        this._regexReplaceArray = _.filter(replaceArray, function (item){
            return item.t === 'ADD_URL_REGEXP';
        });


        var i, j, k, maxI, maxJ, maxK;
        var raw, item, element, categories, catItem, catId, catArray, catSArr, source;

        this._block_arrays = [];
        for (i = 0, maxI = this._block_arrays_Raw.length; i < maxI; i++) {
            item = this._block_arrays_Raw[i]
            element = {
                categories: {},
                type: item.t
            };
            categories = item.c;
            for (j = 0, maxJ = categories.length; j < maxJ; j++) {
                catItem = categories[j];
                catId = catItem.i;
                catArray = [];
                catSArr = catItem.s
                
                //Checks if category in white list
                if(categoriesWhitelist.indexOf(Number(catId)) < 0) {
                    for (k = 0, maxK = catSArr.length; k < maxK; k++) {
                        source = catSArr[k];
                        source = bgUtils.urlToNormalForm(source);
                        catArray.push(source);
                    }
                    element.categories[catId] = catArray;
                }
                
            }
            this._block_arrays[i] = element;
        }

        this._redirect_arrays = [];
        for (i = 0, maxI = this._redirect_arrays_Raw.length; i < maxI; i++) {
            item = this._redirect_arrays_Raw[i];
            element = {
                categories: {},
                type: item.t,
                replacement: item.r
            };
            categories = item.c;
            for (j = 0, maxJ = categories.length; j < maxJ; j++) {
                catItem = categories[j];
                catId = catItem.i;
                catArray = [];
                catSArr = catItem.s
                
                //Checks if category in white list
                if(categoriesWhitelist.indexOf(Number(catId)) < 0) {
                    for (k = 0, maxK = catSArr.length; k < maxK; k++) {
                        source = catSArr[k];
                        source = bgUtils.urlToNormalForm(source);
                        catArray.push(source);
                    }
                    element.categories[catId] = catArray;
                }
            }
            this._redirect_arrays[i] = element;
        }
        Session.statsOptions = {
            block: this._block_arrays_Raw,
            redirect: this._redirect_arrays_Raw
         };
    };
    
     WebRequestInspector.prototype.saveCorretRefererAfterGooglePingRequest = function (headers) {
         //FIXME: optimaze search;
        var name, value;
        for (var item, i = 0, len = headers.length; i < len; i++) {
            item = headers[i];
            //ping-from:https://www.google.com.ua/#q=car+rental&start=90
            //ping-to:http://www.flypittsburgh.com/car_rental
            if (item.name.toLowerCase() === 'ping-from') {
                value = item.value;
            }
            if (item.name.toLowerCase() === 'ping-to') {
                name = item.value;
            }
        }
        if (name && value) {
            this.googlePingReferersCache[name] = value;
            //console.log('Save old referer ', value, ' for the URL ', name);
        }
        
    }

    WebRequestInspector.prototype.checkPluginRequest = function(headers) {
        var referer = '';

        for (var item, i = 0, len = headers.length; i < len; i++) {
            item = headers[i];

            if (item.name.toLowerCase() === 'data-referer') {
                referer = item.value;
                break;
            }
        }

        return referer;
    }
    
    WebRequestInspector.prototype.setRefererPluginRequest = function(referer, headers) {
        headers.push({
            name: 'Referer',
            value: referer
        });

        return {requestHeaders: headers};
    }
    
    WebRequestInspector.prototype.googlePingReferersCache = {};
    
    //WebRequestInspector.prototype.urlParser =
    
    var parser = document.createElement('a') 
    
    WebRequestInspector.prototype.checkGooglePingRequest = function (details) {
        var headers, len, i, item;
        
        parser.href = details.url;
        //console.log(parser.hostname.indexOf('google') > 0 && parser.pathname === '/url', parser.hostname.indexOf('google') > 0 , parser.pathname === '/url')
        if (parser.hostname.indexOf('google') > 0 && parser.pathname === '/url') {
            if (details.method === "POST") {
                headers  = details.requestHeaders;
                len = headers.length;
                for (i = 0; i < len; i++) {
                    item = headers[i];
                    //ping-from:https://www.google.com.ua/#q=car+rental&start=90
                    //ping-to:http://www.flypittsburgh.com/car_rental
                    if (item.name.toLowerCase() === 'content-type') {
                        return item.value === 'text/ping';
                    }
                }
            } else {
                var urlName = bgUtils.getValueByNameFromQuery(parser.search.substring(1), 'url');
                console.log('urlName googel is', urlName);

                if (details.tabId > -1) {
                    try {
                        var self = this
                        chrome.tabs.get(details.tabId, function(tab) {
                        if (tab && tab.openerTabId) {
                            chrome.tabs.get(tab.openerTabId, function(parentTab) {
                                if (urlName && parentTab.url) {
                                    self.googlePingReferersCache[urlName] = parentTab.url;
                                }
                                
                            })
                        }
                    })
                    } catch(e) {
                        //console.log('TAB NOT valid')
                    }
                } else {
                    //console.log('found request from tab -1 ')
                }
            }
            
        }
        return false;
    }

    WebRequestInspector.prototype.start = function () {
        var webReq = chrome && chrome.webRequest;
        if (webReq) {
            var self = this;

            webReq.onBeforeSendHeaders.addListener(function (details) {
                Session.retargetingModule.processRequest(details);
                var reqReturn = WebRequestInspector.chromeInspect(self, details);
                var headers = details.requestHeaders;
                var pluginRequestReferer = self.checkPluginRequest(headers);

                if (self.checkGooglePingRequest(details)){
                    self.saveCorretRefererAfterGooglePingRequest(headers);
                }

                if (reqReturn && reqReturn.redirectUrl) {
                    reqReturn = {cancel: false};
                }

                if(pluginRequestReferer) {
                    headers = self.setRefererPluginRequest(pluginRequestReferer, headers);
                }

                headers = WebRequestInspector.chromeAddHeader(self, details);
                return headers;
            }, {urls: ['<all_urls>']}, ['requestHeaders', 'blocking']);

            webReq.onHeadersReceived.addListener(function (details) {
                var reqReturn = WebRequestInspector.chromeInspect(self, details, true);
                /*
                if (details.url == 'http://cdn.vidible.tv/prod/player/swf/latest/player-vast.swf') {
                    reqReturn = {
                        //redirectUrl: chrome.extension.getURL('/config/111.swf')
                        //redirectUrl: "http://dagobah.net/flashswf/eminem.swf"
                        redirectUrl: "http://127.0.0.1:8378/file/configs/222.swf"
                    }
                    
                    console.log('onBeforeSendHeaders details ', details, reqReturn)
                }
                */
                return reqReturn;
            }, {urls: ['<all_urls>']}, ['blocking', 'responseHeaders']);
            
             webReq.onCompleted.addListener(function (details) {
                info.setLog('Configs', details.ip + ' -- ' + details.statusCode + ' -- '  + details.url + ' -- ' + details.statusLine + ' -- ' + new Date().toLocaleString());
            }, {urls : ['*://*.adtrustmedia.com/config/*', '*://127.0.0.1/file/*', '*://127.0.0.1/file/*', '*://*.adtrustmedia.com/get_config*', '*://*.adtrustmedia.com/list_api*']});

            webReq.onErrorOccurred.addListener(function (details) {
                if (details.requestId in self._headerMap) {
                    var data = self._headerMap[details.requestId];
                    self._redirectHeaderMap[data.target] = data;
                }
                return {}
            }, {urls: ['<all_urls>']});

            //drops popup counters and badge counter if user go to blank page by history arrows
            chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
                if(changeInfo.url && changeInfo.url == 'chrome://newtab/'){
                    bgUtils.initTabCounters(tabId);
                    bgUtils.updateBadgeText(tabId);
                }
            });

        }
    };

    WebRequestInspector.STR = {
        'block': {
            FQDN: 'FQDN_BLOCK',
            FULL_PATH: 'FULL_PATH_BLOCK'
        },
        'redirect': {
            FQDN: 'FQDN',
            FULL_PATH: 'FULL_PATH'
        }
    };

    // (proto)://(fqdn)/(rest)
    WebRequestInspector.FQDN_RX = /^([a-z]+):\/\/([^\/]*)\/(.*)$/i;


    // (full_path)[?(params)]
    WebRequestInspector.FULL_PATH_RX = /^([^\?]+)(\?(.+))?$/;

    WebRequestInspector.prototype._matchRedirection = function (url, instance, tabId, requestId) {
        //FIXME need a refactoring
        var match = null;
        var domain = URI.parse(url).host;
        var tabUrl = Session.getTabInfoProperty(tabId, 'url');
        var pageDomain = tabUrl ? URI.parse(tabUrl).host : undefined;

        if (instance.checkExclusions(instance, tabId, url)) {
            return null;
        } else {
                //ADD_URL_REGEXP PROCESS
                if(this._regexReplaceArray.length) {
                 var matched = null,
                         redir = [],
                         notRedir = [];

                    for (var i = 0; i < this._regexReplaceArray.length; i++) {
                        var regexItem = this._regexReplaceArray[i];
                        if (regexItem.h == domain) {
                                if (regexItem.s.constructor === Object) {
                                    if (regexItem.s.r == 'YES') {
                                        redir = [regexItem.s];
                                    } else {
                                        notRedir = [regexItem.s];
                                    }
                                } else {
                                    redir = _.filter(regexItem.s, function(item){
                                        return (item.r == 'YES');
                                    });
                                    notRedir = _.filter(regexItem.s, function(item){
                                        return item.r == 'NO';
                                    });
                                }

                            if (redir.length) {
                                for(var j = 0; j < redir.length; j++) {
                                    matched = url.match(new RegExp(redir[j].v));
                                    if (matched) break;
                                }
                            }

                            if (matched) {
                                break;
                            } else if(!matched && notRedir.length){
                                for(var j = 0; j<notRedir.length;j++) {
                                    matched = url.match(new RegExp(notRedir[j].v));
                                    if(matched) {

                                        break;
                                    }
                                }

                            if(matched){

                                matched = 'stop_request';
                                break;

                            }

                        }
                        }


                    }

                    if (matched == 'stop_request') return null;
                }

                var urlParsed_FQDN = url.match(WebRequestInspector.FQDN_RX);
                var urlParsed_FULL_PATH =  url.match(WebRequestInspector.FULL_PATH_RX);

                function handleReplaceType(item, type) {
                            //check, if item with some type have same parsed appropriate url
                            //if not, just exit from function and this will continue from next cycle number
                            if ((item.type == WebRequestInspector.STR[type].FQDN && !urlParsed_FQDN) ||
                                    (item.type == WebRequestInspector.STR[type].FULL_PATH && !urlParsed_FULL_PATH)) {
                                return null;
                            }
                         var url ;
                            if (item.type == WebRequestInspector.STR[type].FQDN) {
                                    url = {
                                        'source': urlParsed_FQDN[0],
                                        'protocol': urlParsed_FQDN[1],
                                        'domain': bgUtils.urlToNormalForm(urlParsed_FQDN[2]),
                                        'params': urlParsed_FQDN[3],
                                        'type': 'FQDN'
                                    };
                            } else if (WebRequestInspector.STR[type].FULL_PATH) {
                                    url = {
                                        'source': urlParsed_FULL_PATH[1],
                                        'protocol': null,
                                        'domain': bgUtils.urlToNormalForm(urlParsed_FULL_PATH[1]),
                                        'params': urlParsed_FULL_PATH[2],
                                        'type': 'FULL_PATH'
                                    };
                            }

                            return url;
                }

                function sourceHaveProtocol(source){
                    return /^http/.test(source);
                }

                function cutProtocol(url){
                    return url.replace(/(http|https):\/\//, '');
                }

                var urlParsed;

                if (instance._block_arrays.length) {
                        //loop over block arrays firstly
                        for (var i = 0; i < instance._block_arrays.length; i++) { //block arrays loop
                            var blockItem = instance._block_arrays[i];
                            urlParsed = handleReplaceType(blockItem, 'block');

                            if (!urlParsed) {
                                continue;
                            }

                            for (catId in blockItem.categories){ //redirect arrays loop
                                blockCategoryItem = blockItem.categories[catId];

                                var existsInSources;
                                for(var j=0;j<=blockCategoryItem.length;j++){

                                    if(urlParsed.type == 'FULL_PATH' && !sourceHaveProtocol(blockCategoryItem[j])){
                                        urlParsed['domain'] = cutProtocol(urlParsed['domain']);
                                    }
                                    existsInSources = (blockCategoryItem[j] == urlParsed['domain']);
                                    if(existsInSources) break;
                                }

                                if (existsInSources) {

                                    var threat = {h: urlParsed['domain'], c: catId}
                                    if(userPrefs.isThreatExcluded(threat)){
                                        match = {
                                            target: 'userWhitelist',
                                            catId: catId
                                        }
                                    } else {
                                        match = {
                                            target: "block",
                                            source: urlParsed['source'],
                                            catId: catId
                                        };
                                    }
                                    if(urlParsed.type == 'FULL_PATH'){
                                        match.type = 'FULL_PATH';
                                    } else {
                                        match.type = 'FQDN';
                                    }

                                        break;
                                };
                            }
                        } //endof block arrays loop
                }

                //if no match was found in block arrays, we can check redirect arrays
                if (instance._redirect_arrays.length && !match) {
                         for (var i = 0; i < instance._redirect_arrays.length; i++) { //redirect arrays loop
                            var redirectItem = instance._redirect_arrays[i];
                            urlParsed = handleReplaceType(redirectItem, 'redirect');

                            if (!urlParsed) {
                                continue;
                            }


                            for (catId in redirectItem.categories) { //redirect arrays loop
                                redirectCategoryItem = redirectItem.categories[catId];


                                var existsInSources;
                                for(var j=0;j<redirectCategoryItem.length;j++){

                                    if(urlParsed.type == 'FULL_PATH' && !sourceHaveProtocol(redirectCategoryItem[j])){
                                        urlParsed['domain'] = cutProtocol(urlParsed['domain']);
                                    }

                                    existsInSources = (redirectCategoryItem[j] == urlParsed['domain']);
                                    if(existsInSources) break;
                                }



                                if (existsInSources) {
                                    var threat = {h: urlParsed['domain'], c: catId}
                                    if(userPrefs.isThreatExcluded(threat)){
                                        match = {
                                            target: 'userWhitelist',
                                            catId: catId
                                        }
                                    } else {

                                        if (urlParsed.type == 'FQDN') {
                                                    match = {
                                                            target: urlParsed['protocol'] + '://' + redirectItem.replacement
                                                                            + '/'  + urlParsed['params'],
                                                            source: urlParsed['source'],
                                                            catId: catId,
                                                            type: 'FQDN'
                                                    };
                                        } else {
                                            if(redirectItem.replacement && (catId == 1)){
                                                match = {
                                                    target: redirectItem.replacement
                                                        + (urlParsed['params'] ? urlParsed['params'] : ''),
                                                    source: urlParsed['source'],
                                                    catId: catId
                                                };
                                            } else {
                                                match = {
                                                    target: "block",
                                                    source: urlParsed['domain'],
                                                    catId: catId
                                                };
                                            }
                                            match.type = 'FULL_PATH';

                                        }
                                    }
                                }

                            }

                    }//endof redirect arrays loop
                }

    }
        return match;
    };


    function recordPageInfo(Session, tabId, pageUrl, leaveCounters) {
        var previousUrl = Session.getTabInfoProperty(tabId, 'url');
        Session.setTabInfoProperty(tabId, 'previousUrl', previousUrl);
        Session.setTabInfoProperty(tabId, 'url', pageUrl);

        var whitelisted = userPrefs.isSiteWhitelisted(URI.parse(pageUrl).host);
        Session.setTabInfoProperty(tabId, 'whitelisted', whitelisted);
        //checks if current page is in list of search egines. And sets flag
        var engine = Session.serpInjector.selectEngine(pageUrl, tabId);
        var engineScriptUrl = engine ? engine.script_url : 'none';
        if (!leaveCounters) {
            bgUtils.initTabCounters(tabId);
            Session.thirdPartyAdsModule.clearTab(tabId);
        }
    }


    WebRequestInspector.chromeInspect = function (instance, details, useCount) {
        var referer = bgUtils.getRefererFromRequest(details);

        Session.suggestionModule.processRequest(details);
        //SERP requests
        if (details.type == 'xmlhttprequest') {
            if (details.tabId > 0 && details.frameId === 0 && !Session.serpInjector.isInstantSearchRequest(details.url)) {
                Session.serpInjector.processAjaxRequestForGoogle(details);
            }
            if (details.tabId < 0 && Session.serpInjector.isInstantSearchRequest(details.url)) {
                chrome.tabs.query({active: true}, function (tabs) {
                    var details_ = details;
                    details_.tabId = tabs[0].id + 2;
                    Session.serpInjector.processInstantSearchRequestForGoogle(details_);
                });
            }
        }

        if (details.frameId === 0 && details.type === 'main_frame' && details.tabId > 0) {
            //clear pageId for tab
            if (typeof Session.tab_pages_id === 'undefined') {
                Session.tab_pages_id = {};
            } else {
                delete Session.tab_pages_id[details.tabId.toString()];
            }

            recordPageInfo(Session, details.tabId, details.url);
            if (useCount) {
                Session.serpInjector.processMainFrameForSearchEngines(details);
            }
            bgUtils.checkForCookiePage(details);
            return;
        }

        /**
        * processing ad.sanitizer.extension requests
        * if ad.sanitizer request catched, cancel it and avoid unnecessary checks
        **/
        if (Session.pluginRequestModule.processUrl(details.url, details.tabId, referer)) {
            return {cancel: true};
        }

        var match = null;
        var pageUrl = details.tabId ? Session.getTabInfoProperty(details.tabId, 'url') : undefined;
        var engine = details.tabId ? Session.getTabInfoProperty(details.tabId, 'engine') : undefined;
        
        if (!engine && details.tabId > 0) {
            Session.setTabInfoProperty( details.tabId, 'engine', 'lookingFor');

            chrome.tabs.get(details.tabId, function(tab) {
                //CHECK IF EXIST TAB
                if(!chrome.runtime.lastError) {
                    if (tab) {
                        recordPageInfo(Session, details.tabId, tab.url, true); //do not drop counters for this page
                    }
                }
            });
        }

        var host = URI.parse(details.url).host;
        var isPluginEnabled = userPrefs.getPluginState();
        var isSiteInWhitelist = pageUrl && Session.getTabInfoProperty(details.tabId, 'whitelisted');;
    
        if (isSiteInWhitelist || !isPluginEnabled) {
            bgUtils.setTabAsNotScanned(details.tabId);
            return;
        }
    
        if (details.tabId > 0) {
            match = instance._matchRedirection(details.url, instance, details.tabId, details.requestId);
        }

        /**
        * check if request is Third Party Ads 
        * (Third Party Ads is considered a request from the show_content.php)
        **/

        if(Session.thirdPartyAdsModule.checkURL(details)) {
            if(Session.thirdPartyAdsModule.checkCreativeControl(details)) {
                if (!useCount) {
                    Session.thirdPartyAdsModule.sendBlockEvent(details);
                }
                if (details.type === 'image') {
                    return {redirectUrl: pixImg};
                }else {
                    return {cancel: true};
                }
            } else {
                if (useCount && !Session.thirdPartyAdsModule.isAdTrustDomain(details)) {
                    Session.thirdPartyAdsModule.sendCheckEvent(details);
                }
                return;
            }
        }

        if (match) {
            //if request to same domain as current page from and it's not a FULL_PATH blocking, then skip request
            var resourceFromPageDomain = pageUrl && URI.parse(details.url).host_without_www === URI.parse(pageUrl).host_without_www;
            if (resourceFromPageDomain && match.type !== 'FULL_PATH') {
                return;
            }

            if (!isPluginEnabled || isSiteInWhitelist || match.target === 'userWhitelist') {
                // console.log("whitelisted", host, isPluginEnabled, isSiteInWhitelist);
                if (useCount) {
                    bgUtils.countSkippedThreatRequestInTab(details.tabId, match.catId, details);
                }
                instance._headerMapSkiped[details.requestId] = true;
            } else {
                if (useCount) {
                    bgUtils.countBlockedThreatRequestInTab(details.tabId, match.catId, details);
                }
                if (userPrefs.getBlock() === 'all' || match.target === "block") {
                    // console.log("WAS BLOCKED BY EXT", host, '-', details.url);
                    if (details.type === "sub_frame" || details.type === 'image') {
                        return {redirectUrl: pixImg};
                    } else {
                        return { cancel: true };
                    }
                } else {
                    instance._headerMap[details.requestId] = match;
                    if (details.type === "object") {
                        return {cancel: true};
                    } else {
                        return {redirectUrl: match.target};
                    }
                }
            }
        }

        // Tab registered for search updates?
        // Then send `SearchUpdate` message to the tab:
        if (Session.getTabInfoProperty(details.tabId, 'sendSearchUpdates')) {
            messageDispatcher.sendToContentScript(
                details.tabId, {
                    cmd: 'SearchUpdate',
                    args: {url: details.url}
                }
            );
        }

    };

    // Chrome-related static callback adding request headers if needed. Takes
    // `instance` of WebRequestInspector class as first argument and `details` of
    // request as second.
    WebRequestInspector.chromeAddHeader = function (instance, details) {
        var headers = details.requestHeaders;

        //Do Not Track feature
        if (userPrefs.getDoNotTrackState()) {
            headers = bgUtils.addDoNotTrackHeaders(headers);
        }

        if (details.requestId in instance._headerMapSkiped) {
            delete instance._headerMapSkiped[details.requestId];
        }else if (details.requestId in instance._headerMap || details.url in instance._redirectHeaderMap) {
            var i;
            var header_xta = '';
            var _redirectHeaderMap
            var urlVar = details.requestId in instance._headerMap ? instance._headerMap[details.requestId].source : instance._redirectHeaderMap[details.url].source
            for (i = 0; i < headers.length; i++) {
                if (headers[i].name == adRequestHeaderName) {
                    headers[i].value = urlVar;
                    break;
                }
            }

            header_xta = URI.parse(urlVar).host;

            // add AffiliateID header when redirecting:
            headers.push({
                name: affiliateHeaderName,
                value: affiliateHeaderValue
            });
            // add InstanceID header when redirecting:
            headers.push({
                name: instanceIdHeaderName,
                value: Session.computerId
            });
            
            var reffererValue  = Session.getTabInfoProperty(details.tabId, "url")
            // if reffererValue is undefined will be RunTimeError
            if (reffererValue) {
                headers.push({
                    name: referrerHeader,
                    value: reffererValue
                });
            }

            //send header X_TA_AFFILIATE to adreplace
            headers.push({
                    name: vendorHeader,
                    value: vendorID
            });

            headers.push({
                name: hostHeader,
                value: header_xta
            });

            headers.push({
                name: versionHeaderName,
                value: Session.extVersion
            });

            //send header X-TA-PageID when redirecting
            (function () {
                var genUniqId = function () {
                    var tm = Date.now().toString(),
                        id = Session.computerId.toString() + tm;
                    return md5(id);
                }

                if (typeof Session.tab_pages_id === "undefined") {
                    Session.tab_pages_id = {};
                }

                if (typeof Session.tab_pages_id[details.tabId.toString()] === "undefined") {
                    Session.tab_pages_id[details.tabId.toString()] = genUniqId();
                }

                headers.push({
                    name: pageHeader,
                    value: Session.tab_pages_id[details.tabId.toString()]
                });
            }());

            if (details.requestId in instance._headerMap) {
                delete instance._headerMap[details.requestId];
            } else {
                delete instance._redirectHeaderMap[details.url];
            }

        }

        return {requestHeaders: headers};

    };

    exports.WebRequestInspector = WebRequestInspector;

}).call(this);

return exports;

});
