define(function (require) { 

    var exports = {};

(function () {

    var Session = require('./backgroundSession').Session;
    var URI = require('./frameworks/uri').URI;
    var affiliateHeaderValue = require('./localConfig').AFFILIATE_REQUEST_HEADER_VALUE;
    var instanceIdHeaderName = require('./localConfig').INSTANCE_ID_HEADER_NAME;
/*
'google': 'g_p', 'g_s'
'yahoo': 'h_p', 'h_s'
'bing': 'b_p', 'b_s'
'about': 'a_p', 'a_s', 'x_s'
'ask': 's_p', 's_s'
'yellowpages': 'y_p', 'y_s'
'whitepages':  'w_p', 'w_s'
'mywebsearch': 'm_p', 'm_s'
'facebook': 'f_p'

'uknown' 'e_p'
*/

    exports.serpInjector = {
        config: {},
        serp_engine_suffix: '_s',
        engineCodes: {
            'google': 'g',
            'yahoo': 'h',
            'bing': 'b',
            'about': 'a',
            'ask': 's',
            'yellowpages': 'y',
            'whitepages':  'w',
            'mywebsearch': 'm',
            'facebook': 'f'
        },

        loadFromCache: function (script_url) {
            return salsita.localStorage.getItem(script_url);
        },

        saveConfig: function (configData) {
            this.config = configData;
        },

        saveScriptText: function (engineNum, scriptText) {
            var serpConfig = this.config.e;
            if (serpConfig) {
                var engine = serpConfig[engineNum];
                if (engine) {
                    engine['script_text'] = scriptText;
                } else {
                    //there is no engine with this num
                }
                salsita.localStorage.addLocalStorageReadyFn(function (storage) {
                    storage.setItem(engine.u, scriptText);
                });
            }
        },

        getAndUpdateEngine: function (url, serpConfig, tabId) {
            engine = this.checkEngineTargets(url, serpConfig);
            if (engine) {
                engine.name = this.getEngineName(url);
                if (tabId) {
                    Session.setTabInfoProperty(tabId, 'engineObj', engine);
                }
            }
            return engine;
        },

        selectEngine: function (url, tabId) {
            var engine;
            var serpConfig = this.config.e;
            if (!serpConfig) {
                return null;
            }

            if (!serpConfig.target) {
                for (var i in serpConfig) {
                    if (serpConfig.hasOwnProperty(i)) {
                        engine = this.getAndUpdateEngine(url, serpConfig[i], tabId);
                        if (engine) {
                            return engine;
                        }
                    }
                }
            } else {
                return this.getAndUpdateEngine(url, serpConfig, tabId);
            }
        },

        getEngineName: function (url) {
            if (this.isGoogleSearchRequest(url)) {
                return 'google';
            } else if (this.isYahooSearchRequest(url)) {
                return 'yahoo';
            } else if (this.isBingSearchRequest(url)) {
                return 'bing';
            } else if (this.isAboutSearchRequest(url)) {
                return 'about';
            } else if (this.isAskSearchRequest(url)) {
                return 'ask';
            } else if (this.isYellowpagesSearchRequest(url)) {
                return 'yellowpages';
            } else if (this.isWhitepagesSearchRequest(url)) {
                return 'whitepages';
            } else if (this.isMywebsearchSearchRequest(url)) {
                return 'mywebsearch';
            } else if (this.isFacebookSearchRequest(url)) {
                return 'facebook';
            }
        },

        checkEngineTargets: function (url, engine) {
            var trg,
                domain = URI.parse(url).host;

            for (var j = 0, len = engine.t.length; j < len; j++) {
                trg = engine.t[j];
                if (!this.inDomainExclusions(url) && ((trg.t === 'PAGE' && url === trg.v) || trg.t === 'DOMAIN' && domain.match(trg.v))) {
                    return engine;
                }
            }
        },

        inDomainExclusions: function (url) {
            //FIXME Strange method. Investigate where it is using and how we can refactoring it
            var domain = URI.parse(url).host.replace(/^www\./, '');
            var exclusionRegEx;
            var exclusions = {
                'google.com': ['calendar']
            };

            if (exclusions[domain]) {
                for (var i = 0; i <= exclusions[domain].length; i++) {
                    exclusionRegEx = new RegExp(domain + '/' + exclusions[domain][i], 'i');
                    if (exclusionRegEx.test(url)) {
                        return true;
                    }
                }
            }

            return false;
        },

        getEngineParams: function (engine) {
            //FIXME README this code was changed on 6 May 2015
            //QA needs to check if something was broken. This function is using only to insert js ('injectJS' method)
            //var engineData = engine; 
            var engineData = {};
            if (Session.SERPAdsDeliveryPoint) {
                engineData.delivPoint = Session.SERPAdsDeliveryPoint;
            }
            engineData.suggConfig = Session.suggestionModule.getConfig();
            return engineData;
        },

        /***************************************Common functions*************************************************/

        processMainFrameForSearchEngines: function (details) {
            var urlResult = parseURL(details.url);
            var notAllowed = urlResult && urlResult.searchObject && urlResult.searchObject["tbm"] === "isch"
            if (details.type !== 'main_frame' || this.isFakeGoogleMainFrame(details.url) || notAllowed) {
                return;
            }

            this.clearSerpPageData(details.tabId);

            var engine = this.getTabEngine(details.tabId, details.url);
            if (!engine) {
                return;
            }
            
            
            this.setOriginalAdsVisibility(details.tabId, engine, false);

            if (this.isGoogleEngine(engine)
                || this.isBingEngine(engine)
                || this.isYahooEngine(engine)
                || this.isFacebookEngine(engine)
                || (this.isAskEngine(engine) && this.isAskSearchRequest(details.url))
                || (this.isAboutEngine(engine) && this.isAboutSearchRequest(details.url))
                || (this.isWhitepagesEngine(engine) && this.isWhitepagesSearchRequest(details.url))
                || (this.isYellowpagesEngine(engine) && this.isYellowpagesSearchRequest(details.url))
                || (this.isMywebsearchEngine(engine) && this.isMywebsearchSearchRequest(details.url)) 
            ) {
                this.registerSearchRequest(details);
            }
            
            function parseURL(url) {
                var parser = document.createElement("a"), searchObject = {}, queries, split, i;
                parser.href = url;
                queries = parser.search.replace(/^\?/, "").split("&");
                for (i = 0; i < queries.length; i++) {
                    split = queries[i].split("=");
                    searchObject[split[0]] = split[1];
                }
                return {
                    protocol: parser.protocol,
                    host: parser.host,
                    hostname: parser.hostname,
                    port: parser.port,
                    pathname: parser.pathname,
                    search: parser.search,
                    searchObject: searchObject,
                    hash: parser.hash
                };
            }
        },

        registerSearchRequest: function (details) {
            var engine = this.getTabEngine(details.tabId, details.url);
            var keyword = this.getQueryFromSerpUrl(details.url, engine);
            if (keyword && keyword !== 'undefined') {
                //Session.setTabInfoProperty(details.tabId, 'serpAdRequestStarted', true);

                Session.serpInjector.insertJsIfReady(details.tabId, details.url);
                //Session.setTabInfoProperty(details.tabId, 'serpAdRequestStarted', false);
/*
                this.requestAdData(keyword, details.url, details.tabId, function (data) {
                    if (data === '[]') {
                        var engine = Session.serpInjector.getTabEngine(details.tabId, details.url);
                        Session.serpInjector.setOriginalAdsVisibility(details.tabId, engine, true);
                    }

                    Session.setTabInfoProperty(details.tabId, 'serpPagePreloadData', {
                        keyword: keyword,
                        data: data
                    });

                    Session.serpInjector.insertJsIfReady(details.tabId, details.url);
                    Session.setTabInfoProperty(details.tabId, 'serpAdRequestStarted', false);
                },
                function () {
                    Session.setTabInfoProperty(details.tabId, 'serpAdRequestStarted', false);
                });
                */
            }
        },

        insertJsIfReady: function (tabId, url) {
            
            var wasJsAlsoInserted = Session.getTabInfoProperty(tabId, 'serpJsInserted');
            if (wasJsAlsoInserted) {
                return;
            }

            var engine = this.getTabEngine(tabId, url);
            if (!engine) {
                return;
            }
            
            

            var preloadData = {}//Session.getTabInfoProperty(tabId, 'serpPagePreloadData');
            var wasPageStartLoading = Session.getTabInfoProperty(tabId, 'serpPageStartLoading');

            this.setOriginalAdsVisibility(tabId, engine, preloadData && preloadData.data === '[]');

            if (preloadData && wasPageStartLoading) {
                if (preloadData === 'noPreload') {
                    preloadData = {data: '"noPreload"', keyword: ''};
                }
                this.injectJS(tabId, engine, preloadData.data, preloadData.keyword);
            }
        },

        requestAdData: function (keyword, pageUrl, tabId, callback, errorCallback) {
            var requestUrl = this.makeRequestUrl(Session.computerId, keyword, pageUrl, tabId);
            if (requestUrl) {
                $.ajax({
                    url: requestUrl,
                    dataType: 'text',
                    success: callback,
                    error: errorCallback
                });
            }
        },

        makeRequestUrl: function (computerId, keyword, pageUrl, tabId) {
            if (!Session.SERPAdsDeliveryPoint) {
                return '';
            }

            //var p = URI.parse(pageUrl);

            var requestUrl = Session.SERPAdsDeliveryPoint + "?" +
                "adtype=text" +
                "&method=js" +
                "&advert=1" +
                //"&referer=" + encodeURIComponent(p.scheme +"://"+ p.host+"/") +
                "&referer=" + encodeURIComponent(pageUrl) +
                "&ta_affiliateid=" + affiliateHeaderValue +
                "&ta_insid=" + computerId +
                "&pv=" + Session.extVersion +
                "&ts=" + new Date().getTime() +
                "&tz=" + new Date().toString().match(/([A-Z]+[\+-][0-9]+)/)[1] +
                "&kw=" + encodeURIComponent(keyword) +
                "&rv=" + 2 +
                "&e=" + this.getEngineIdentityParam(tabId, pageUrl);
                /*
                if (Session.channelVersion) {
                    requestUrl += '&cv=' + Session.channelVersion
                }
                if (Session.distributedProductId) {
                    requestUrl += '&pr=' + Session.distributedProductId
                }
                if (Session.productVersion) {
                    requestUrl += '&dv=' + Session.productVersion
                }
                */
            return requestUrl;
        },

        getEngineIdentityParam: function (tabId, pageUrl) {
            var engine = this.getTabEngine(tabId, pageUrl);
            var result = engine && engine.name ? this.engineCodes[engine.name] : 'e';
            return result + this.serp_engine_suffix;
        },

        injectJS: function (tabId, engine, data, keyword) {
            if (!engine) {
                return;
            }
            var self = this;
            var text = data ? "var engineData=" + data + "; var engineKeyword='" + keyword + "';" : '';
            var engineParams = Session.serpInjector.getEngineParams(engine);

            text += 'if(typeof(Engine) == "undefined"){'
                 + 'var instanceID= "' + Session.computerId
                 + '"; var pdVersion = "' + Session.extVersion
/*
                 + '"; var channelVersion = "' + Session.channelVersion
                 + '"; var distributedProductId = "' + Session.distributedProductId
                 + '"; var productVersion = "' + Session.productVersion
*/
                 + '"; var affiliateID = "' + affiliateHeaderValue
                 + '"; var engineParams = ' + JSON.stringify(engineParams) + ';'
                 + engine.script_text
                 +'; if(typeof(Engine) != "undefined"){'
                 +'; Engine.init("' + Session.computerId + '", "' + affiliateHeaderValue + '", ' + JSON.stringify(engineParams) + ');Engine.start();}'
                 +'}';

            text = "(function(){" + text + " return 'ok';})();";
            
            chrome.tabs.get(tabId, function(tab) {
                //CHECK IF EXIST TAB
                if (!chrome.runtime.lastError) {
                    chrome.tabs.executeScript(tabId, {code: text, runAt: 'document_end'}, function (result) {
                        if (result && result[0] === 'ok') {
                            Session.setTabInfoProperty(tabId, 'serpJsReallyInserted', true);
                        }
                    });
                }
            });

            Session.setTabInfoProperty(tabId, 'serpJsInserted', true);
            
            this.setOriginalAdsVisibility(tabId, engine, false);
        },

        setOriginalAdsVisibility: function (tabId, engine, visible) {
            var self = this;

            //FIXME separate this method into 2
            if (!engine) {
                return;
            }

            chrome.tabs.get(tabId, function(tab) {
                //CHECK IF EXIST TAB
                if (!chrome.runtime.lastError) {
                    if(typeof(tab) != 'undefined') {
                        //Fix error in console 'chrome.tabs.insertCSS';
                        if(self.isMainPageYahoo(tab.url)) {
                            return;
                        }

                        try {
                            
                            if (visible) {
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{visibility:visible!important; }', runAt: 'document_start'});
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{visibility:visible!important; }', runAt: 'document_end'});
                            }else{
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{visibility:hidden!important; }', runAt: 'document_start'});
                                //self.showOriginalAdsAfterTimeIfJsWasNotInserted(tabId, engine);
                            }
                            
                        }catch(err) { }
                    }
                }
            });
        },

        setOriginalAdsDisplay: function(tabId, engine, display) {
            //FIXME separate this method into 2

            chrome.tabs.get(tabId, function(tab) {
                //CHECK IF EXIST TAB
                if(!chrome.runtime.lastError) {
                    if(typeof(tab) != 'undefined') {
                        try {
                            
                            if (display) {
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{display:block; }', runAt: 'document_start'});
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{display:block; }', runAt: 'document_end'});
                            } else {
                                chrome.tabs.insertCSS(tabId, {code: engine.s + '{display:none; }', runAt: 'document_start'});
                            }
                            
                        }catch(err) { }
                    }
                }
            });
        },
/*
        showOriginalAdsAfterTimeIfJsWasNotInserted: function (tabId, engine) {
            var serpInjector = this;
            var timeoutId = setTimeout(function () {
                var jsReallyInserted = serpInjector.isFacebookEngine(engine) ? true : Session.getTabInfoProperty(tabId, 'serpJsReallyInserted');
                var wasAdRequestStarted = Session.getTabInfoProperty(tabId, 'serpAdRequestStarted');
                var lastTimeoutId = Session.getTabInfoProperty(tabId, 'serpLastJsCheckTimeout');
                var isItLastTimeout = lastTimeoutId === timeoutId;
                var wasPageStartLoading = Session.getTabInfoProperty(tabId, 'serpPageStartLoading');
    
                if (!jsReallyInserted && !wasAdRequestStarted && isItLastTimeout) {
                    
                    serpInjector.setOriginalAdsVisibility(tabId, engine, true);
                    if (wasPageStartLoading) {
                        serpInjector.setOriginalAdsDisplay(tabId, engine, true);
                    }
                }
            }, this.getInsertionCheckTime(engine));
            Session.setTabInfoProperty(tabId, 'serpLastJsCheckTimeout', timeoutId);
        },
*/
        getInsertionCheckTime: function (engine) {
            return this.isWhitepagesEngine(engine) ? 8000 : 3000;
        },

        clearSerpPageData: function (tabId) {
            Session.setTabInfoProperty(tabId, 'serpPagePreloadData', false);
            Session.setTabInfoProperty(tabId, 'serpPageStartLoading', false);
            Session.setTabInfoProperty(tabId, 'googleInstantPageStartLoading', false);
            Session.setTabInfoProperty(tabId, 'serpAdRequestStarted', false);
            Session.setTabInfoProperty(tabId, 'serpJsInserted', false);
            Session.setTabInfoProperty(tabId, 'serpJsReallyInserted', false);
            Session.setTabInfoProperty(tabId, 'serpLastJsCheckTimeout', 0);
            Session.setTabInfoProperty(tabId, 'engineObj', false);
        },

        getQueryFromSerpUrl: function (url, engine) {
            //FIXME refactoring this method
            var keyword = '';
            if (this.isYahooEngine(engine)) {
                var match = url.match(/[\#|\?|\&]p=([^&]*)/);
                if (match && match[1]) {
                    keyword = match[1];
                }
            } else if (this.isWhitepagesEngine(engine)) {
                var match = url.match(/[\#|\?|\&]key=([^&]*)/g);
                if (match != null) {
                    var matchPart = match[match.length - 1];
                    match = matchPart.match(/key=(.*)/);
                    keyword = match[1];
                } else {
                    var match = url.match(/business\/\w\w\/[\w-]*\/([\w-]*).*/);
                    if (match[1]) {
                        keyword =  match[1].replace(/-/g, ' ');
                    }

                }
            } else if (this.isYellowpagesEngine(engine)) {
                var match = url.match(/[\#|\?|\&]search_terms=([^&]*)/);
                if (match && match[1]) {
                    keyword = match[1];
                }
            } else if (this.isMywebsearchEngine(engine)) {
                var match = url.match(/[\#|\?|\&]searchfor=([^&]*)/);
                if (match && match[1]) {
                    keyword = match[1];
                }
            } else {
                var match = url.match(/[\#|\?|\&]q=([^&]*)/g);
                if (match != null) {
                    var matchPart = match[match.length - 1];
                    match = matchPart.match(/q=(.*)/);
                    keyword = match[1];
                }
            }

            return keyword.toLowerCase();
        },

        getTabEngine: function (tabId, url) {
            var engine;
            if (!this.inDomainExclusions(url)) {
                engine = Session.getTabInfoProperty(tabId, 'engineObj');
                if (!engine) {
                    engine = this.selectEngine(url, tabId);
                }
                return engine;
            }
        },

        chooseActiveTab: function (tabs) {
            var tab, engine, tabId;
            for(var i = 0, max = tabs.length; i < max; i++){
                tab = tabs[i];
                tabId = tab.id;
                engine = this.getTabEngine(tabId, tab.url);
                if (!engine) {
                    continue;  // tab skipped
                }
                if (!Session.getTabInfoProperty(tabId, 'serpPageStartLoading')) {
                    return tab;
                }
            }
            return null;
        },

        /***************************************Google functions*************************************************/
        processAjaxRequestForGoogle: function (details) {
            if (details.type === 'xmlhttprequest' && this.isGoogleSearchRequest(details.url)) {
                var engine = this.getTabEngine(details.tabId, details.url);
                var wasJsAlsoInserted = Session.getTabInfoProperty(details.tabId, 'serpJsInserted');
                var wasAdRequestStarted = Session.getTabInfoProperty(details.tabId, 'serpAdRequestStarted');

                if (engine && !wasJsAlsoInserted && !wasAdRequestStarted) {
                    
                    this.setOriginalAdsVisibility(details.tabId, engine, false);
                    this.registerSearchRequest(details);
                }
            }
        },

        isGooglePage: function (url) {
            return /:\/\/.*google\..*\/.*/.test(url) && !this.inDomainExclusions(url);
        },

        isGoogleSearchRequest: function (url) {
            return /:\/\/.*google\..*\/.*[\#|\?|\&]q=(.*?)&?/.test(url) && !this.inDomainExclusions(url);
        },

        isGoogleMainPage: function (url) {
            var searchDomain =  /:\/\/(www\.)?google\..*\//.test(url);
            return searchDomain && !this.isGoogleSearchRequest(url);
        },

        isGoogleEngine: function (engine) {
            return engine.name === 'google';
        },

        isFakeGoogleMainFrame: function (url) {
            return /:\/\/.*google\..*\/?url/.test(url);
        },

        isMainPageYahoo: function (url) {
            return url.indexOf('://us.yahoo.com/?fr=fpc-comodo') >= 0;
        },

        isInstantSearchRequest: function (url) {
            return /:\/\/.*google\..*\/s\?.*[\#|\?|\&]q=(.*?)&/.test(url) && !this.inDomainExclusions(url);
        },

        isInstantGoogleStartUrl: function (url) {
            return url.indexOf('://www.google.com/webhp?sourceid=chrome-instant') !== -1 && !this.inDomainExclusions(url);
        },

        processInstantSearchRequestForGoogle: function (details) {
            if (details.type === 'xmlhttprequest' && this.isInstantSearchRequest(details.url)) {
                var engine = this.getTabEngine(details.tabId, details.url);
                var wasJsAlsoInserted = Session.getTabInfoProperty(details.tabId, 'serpJsInserted');
                var wasInstantQueryAlsoEntered = Session.getTabInfoProperty(details.tabId, 'googleInstantQueryEntered');
                if (engine && !wasJsAlsoInserted && !wasInstantQueryAlsoEntered) {
                    
                    this.setOriginalAdsVisibility(details.tabId, engine, false);
                    this.registerInstantSearchRequest(details, engine);
            }
            }
        },

        registerInstantSearchRequest: function (details, engine) {
            var keyword = this.getQueryFromSerpUrl(details.url, engine);
            if (keyword && keyword !== 'undefined') {
                Session.setTabInfoProperty(details.tabId, 'googleInstantAdRequestRecieving', keyword);
                Session.setTabInfoProperty(details.tabId, 'googleInstantPreloadData', false);
                
                Session.serpInjector.insertJsIfInstantPageReady(details.tabId, details.url);
                /*
                this.requestAdData(keyword, details.url, details.tabId, function (data) {
                    var currentKeyword = Session.getTabInfoProperty(details.tabId, 'googleInstantAdRequestRecieving');
                    if (keyword === currentKeyword) {
                        Session.setTabInfoProperty(details.tabId, 'googleInstantPreloadData', {
                            keyword: keyword,
                            data: data
                        });
                        Session.serpInjector.insertJsIfInstantPageReady(details.tabId, details.url);
                    }
                },
                function () {
                    Session.setTabInfoProperty(details.tabId, 'serpAdRequestStarted', false);
                });
                */
            }
        },

        insertJsIfInstantPageReady: function (tabId, url) {
            var wasJsAlsoInserted = Session.getTabInfoProperty(tabId, 'serpJsInserted');
            var wasAdRequestStarted = Session.getTabInfoProperty(tabId, 'serpAdRequestStarted');
            var engine = this.getTabEngine(tabId, url);
            if (engine && !wasJsAlsoInserted && !wasAdRequestStarted) {
                var preloadData = Session.getTabInfoProperty(tabId, 'googleInstantPreloadData');
                var wasPageStartLoading = Session.getTabInfoProperty(tabId, 'googleInstantPageStartLoading');

                Session.serpInjector.setOriginalAdsVisibility(tabId, engine, preloadData && preloadData.data === '[]');
                if (preloadData && wasPageStartLoading) {
                    if (preloadData === 'noPreload') {
                        preloadData = {};
                    }
                    Session.serpInjector.injectJS(tabId, engine, preloadData.data, preloadData.keyword);
                }
            }
        },

        checkOnGoogleInOpenedTabs: function () {
            //FIXME rename this method
            var self = this;
            chrome.tabs.query({}, function (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    var tab = tabs[i];
                    var details = {
                        tabId: tab.id,
                        url: tab.url,
                        type: 'main_frame'
                    };
                    self.processMainFrameForSearchEngines(details);
                    Session.setTabInfoProperty(details.tabId, 'serpPageStartLoading', true);
                }
            });
        },

        /***************************************Bing functions*************************************************/
        isBingEngine: function (engine) {
            return engine.name == 'bing';
        },

        isBingSearchRequest: function (url) {
            return /:\/\/.*bing\..*\/.*[\#|\?|\&]q=/.test(url);
        },

        /***************************************Ask functions*************************************************/
        isAskEngine: function (engine) {
            return engine.name == 'ask';
        },

        isAskSearchRequest: function (url) {
            return /^http:\/\/www\.(search\.)?ask\.com\/.*[\#|\?|\&]q=/.test(url);
        },

        /***************************************About functions*************************************************/
        isAboutEngine: function (engine) {
            return engine.name == 'about';
        },

        isAboutSearchRequest: function (url) {
            return /:\/\/.*about\.com\/.*[\#|\?|\&]q=/.test(url);
        },

        /***************************************Whitepages functions*************************************************/
        isWhitepagesEngine: function (engine) {
            return engine.name == 'whitepages';
        },

        isWhitepagesSearchRequest: function (url) {
            return /:\/\/.*whitepages\.com\/.*[\#|\?|\&]key=/.test(url) || /:\/\/.*whitepages\.com\/business\/\w\w\/[\w-]*\/[\w-]*/.test(url);
        },

        /***************************************Yellowpages functions*************************************************/
        isYellowpagesEngine: function (engine) {
            return engine.name == 'yellowpages';
        },

        isYellowpagesSearchRequest: function (url) {
            return /:\/\/.*yellowpages\.com/.test(url);
        },

        /***************************************Mywebsearch functions*************************************************/
        isMywebsearchEngine: function (engine) {
            return engine.name === 'mywebsearch';
        },

        isMywebsearchSearchRequest: function (url) {
            return /:\/\/.*mywebsearch\.com\/mywebsearch\/[\w]+\.jhtml/.test(url);
        },

        /***************************************Facebook functions*************************************************/
        isFacebookEngine: function (engine){
            return engine.name == 'facebook';
        },

        isFacebookSearchRequest: function (url) {
            return /:\/\/.*facebook\.com/.test(url);
        },

        /***************************************Yahoo functions*************************************************/
        isYahooEngine: function (engine) {
            return engine.name == 'yahoo';
        },

        isYahooSearchRequest: function (url) {
            return /:\/\/.*yahoo\..*\/.*[\?|\&]p=/.test(url);
        }

    }

}).call(this);

    return exports;

});
