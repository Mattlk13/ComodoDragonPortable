define(function (require) {
    var exports = {};

(function() {

    var localConfig = require('./localConfig');
    var cookie_props = localConfig.COOKIE_PROPS;
    var Session = require('./backgroundSession').Session;
    var URI = require('./frameworks/uri').URI;
    var userPrefs = require('./userPrefs');
    var currentFRF_value = localConfig.FIRST_RUN_FLAG;
    var u = {};

    u.checkPluginInstall = function (onInstallCallback, onUpdateCallback, onSetupUpdateCallback) {
        function getVersion() {
            var details = chrome.app.getDetails();
            return details.version;
        }

        var currVersion = getVersion();
        var prevVersion = localStorage['version'];
        if (typeof prevVersion === 'undefined') {
            onInstallCallback();
        } else if (currVersion !== prevVersion) {
            if (wasUpdatedBySetup) {
                onSetupUpdateCallback();
            } else {
                onUpdateCallback();
            }
        }
        localStorage['version'] = currVersion;
    };

    u.isFirstRunFlagChanged = function () {
        var previousFRF_value = salsita.localStorage.getItem('FIRST_RUN_FLAG');
        return currentFRF_value && (!previousFRF_value || previousFRF_value !== currentFRF_value);
    }

    u.checkFirstRunFlag = function () {
        if (u.isFirstRunFlagChanged()) {
            u.clearLocalStorage();
        }
        salsita.localStorage.setItem('FIRST_RUN_FLAG', currentFRF_value);
    }

    u.clearLocalStorage = function () {
        var ls = salsita.localStorage;
        var keys = ls.getKeys();
        for (var key in keys) {
            ls.removeItem(key);
        }
    }

    u.initTabCounters = function (tabId) {
        Session.setTabInfoProperty(tabId, 'threatCatsStats', {1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
        Session.setTabInfoProperty(tabId, 'adNetworkEnum', {1: {}, 2: {}, 3: {}, 4: {}, 5: {}}); //enumeration of detected ad networks
        Session.setTabInfoProperty(tabId, 'threatCount', 0);
        Session.setTabInfoProperty(tabId, 'cookieBlockCount', 0);
        Session.setTabInfoProperty(tabId, 'catStatesOnPageStart', userPrefs.getThreatCategoriesStates());
        u.updateBadgeText(tabId);
    };

    u.countSkippedThreatRequestInTab = function (tabId, threatCatId, details) {
        if (userPrefs.getPluginState()) {
            u.incTabThreatCount(tabId);
            u.registerInThreatCatsStats(tabId, threatCatId);
            u.registerInAdNetworkEnum(tabId, threatCatId, details.url);
        } else {
            u.setTabAsNotScanned(tabId);
        }
        u.updateBadgeText(tabId);
    };

    u.countBlockedThreatRequestInTab = function (tabId, threatCatId, details) {
        Session.inscreaseTotalBlockCounter();
        u.countSkippedThreatRequestInTab(tabId, threatCatId, details);
    };

    u.incTabThreatCount = function (tabId) {
        var count = Session.getTabInfoProperty(tabId, 'threatCount');
        count = count > 0 ? count : 0;
        Session.setTabInfoProperty(tabId, 'threatCount', count + 1);
    }

    u.setTabAsNotScanned = function (tabId) {
        Session.setTabInfoProperty(tabId, 'threatCount', -1);
    }

    u.registerInThreatCatsStats = function (tabId, catId) {
        var catsStats = Session.getTabInfoProperty(tabId, 'threatCatsStats');
        if (!catsStats) {
            catsStats = {1: 0, 2: 0, 3: 0, 4: 0, 5:0};
        }
        if (catId in catsStats) {
            catsStats[catId]++;
        } else {
            console.warn('there is no such catId in catsStats');
        }
        Session.setTabInfoProperty( tabId, 'threatCatsStats', catsStats );
    }

    //specified ad network domain will be recorded for popup statisitcs for this tab
    u.registerInAdNetworkEnum = function (tabId, catId, url) {
        var domain, adNetwork
        var adNetworkEnum = Session.getTabInfoProperty(tabId, 'adNetworkEnum');
        if (!adNetworkEnum) {
            adNetworkEnum = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
        }
        if (catId in adNetworkEnum) {
            adNetwork = adNetworkEnum[catId];
            domain = URI.parse(url).host_without_www;
            if (domain in adNetwork) {
                adNetwork[domain].count++;
            } else {
                adNetwork[domain] = {
                    count: 1,
                    domain: domain
                };
            }
        } else {
            console.warn('there is no such catId in adNetworkEnum');
        }
        Session.setTabInfoProperty(tabId, 'adNetworkEnum', adNetworkEnum);
    }

    u.updateBadgeText = function (tabId) {
        var threatCount = Session.getTabInfoProperty( tabId, 'threatCount');
        var count = threatCount > 0 ? threatCount : 0;

        chrome.tabs.get(tabId, function() {
            //CHECK IF EXIST TAB
            if (!chrome.runtime.lastError) {
                chrome.browserAction.setBadgeText({text: count.toString(), tabId: tabId});
                chrome.browserAction.setBadgeBackgroundColor({color: '#1d1d1b'});
            }
        });
    }

    u.initBadgeText = function () {
        chrome.tabs.query({active: true}, function (tabs) {
            u.updateBadgeText(tabs[0].id);
        });
    }

    u.badgeTextOnTabUpdateHandler = function (tabId, changeInfo, tab) {
        if (changeInfo.status === 'loading') {
            u.updateBadgeText(tabId);
        }
    }

    u.badgeTextOnTabHighlightedHandler = function (highlightInfo) {
        u.updateBadgeText(highlightInfo.tabIds[0]);
    }

    u.addDoNotTrackHeaders = function (headers) {
        headers.push({name: 'DNT', value: '1'});
        return headers;
    }

    u.setToStartFromOptionsPage = function () {
        salsita.localStorage.setItem(START_FROM_OPT_PAGE_LS_NAME, JSON.stringify({totalBlockCounter: Session.totalBlockCounter}));
    }

    u.startFromOptionsPage = function (hash) {
        var startData = salsita.localStorage.getItem(START_FROM_OPT_PAGE_LS_NAME);
        startData = JSON.parse(startData);
        Session.totalBlockCounter = startData.totalBlockCounter ? startData.totalBlockCounter : 0;
        hash = hash || '';
        chrome.tabs.create({
            'url':'html/options.html' + hash
        }, function () {
            salsita.localStorage.removeItem(START_FROM_OPT_PAGE_LS_NAME);
        });
    }

    u.checkOptionsPageInOpenedTabs = function () {
        var self = this;
        chrome.tabs.query({}, function (tabs) {
            var tab;
            var extentionUrl = chrome.extension.getURL('html/options.html');
            for (var i = 0, len = tabs.length; i < len; i++) {
                tab = tabs[i];
                if (tab.url === extentionUrl) {
                    chrome.tabs.reload(tab.id);
                }
            }
        });
    }

    //fix if cookie was cleared and user goes to https://adtrustmedia.com/prefs.html
    u.checkForCookiePage = function (details) {
        if (details.url === cookie_props.path) {
            chrome.cookies.get({url: cookie_props.path, name: cookie_props.name}, function (cookie) {
                if (!cookie) {
                    userPrefs.updateCookie();
                }
            });
        }
    }

    //one unified form for comparised URLs (to remove differences in few URL forms)
    //url - URL or domain only
    u.urlToNormalForm = function (url) {
        if (!url) {
            return url;
        }
        var result = url.toLowerCase();
        result = result.replace(/www\./, '');
        return result;
    }

    u.prepareUrlMainConf = function (url) {
        return url + '?f=pbase&o=json&d=&'+ this.getAdditinalParams() +  '&cv=' + Session.channelVersion + '&pr=' + Session.distributedProductId + '&dv=' + Session.productVersion + '&a=' + u.getVerMainConf();
    }

    u.getAdditinalParams = function (url) {
        return 'b=' + Session.affiliateId + '&c=' + Session.computerId + '&v=' + Session.extVersion ;
    }

    u.getVerMainConf = function() {
       return salsita.localStorage.hasValue('CIAA') ? JSON.parse(salsita.localStorage.getItem('CIAA')).u.v : ''; 
    }

    u.getExtVersion = function () {
        var version = '0';
        try {
            version = chrome.runtime.getManifest().version;
        } catch (e) {
            //empty catch
        }
        return version;
    }

    u.getComputerId = function () {
        var computerId;

        if(salsita.localStorage.hasValue('COMPUTER_ID')) {
           computerId = salsita.localStorage.getItem('COMPUTER_ID');
        } else {
            computerId = localConfig.COMPUTER_ID_HEADER_VALUE;
            salsita.localStorage.setItem('COMPUTER_ID', computerId);
        }

        return computerId
    }

    u.getProductId = function () {
        var productId;

        if(salsita.localStorage.hasValue('PRODUCT_ID')) {
            productId = salsita.localStorage.getItem('PRODUCT_ID');
        } else {
            productId = localConfig.PRODUCT_ID;
            salsita.localStorage.setItem('PRODUCT_ID', productId);
        }

        return productId
    }

    u.getRefererFromRequest = function (request) {
        var referer = null;
        var headers = request['requestHeaders'];
        var i, item;
        if (headers) {
            for (i in headers) {
                item = headers[i];
                if (item['name'].toLowerCase().indexOf('referer') === 0) {
                    referer = item['value'];
                }
            }
        }

        return referer;
    }
    
     u.getContentTypeFromHeadres = function (request) {
        var headers = request['responseHeaders'];
        var i, item;
        if (headers) {
            for (i in headers) {
                item = headers[i];
                if (item['name'].toLowerCase() === 'Content-Type'.toLowerCase()) {
                    return item['value'];
                }
            }
        }

        return '';
    }
    
    u.getValueByNameFromQuery = function (query, name) {
        //sometimes query could be undefined
        if (query) {
            var args = query.split('&');
            var argsParsed = {};
            for (var i = 0; i < args.length; i++) {
                var arg = decodeURIComponent(args[i]);
                if (arg.indexOf('=') == -1) {
                    //argsParsed[arg.trim()] = true;
                } else {
                    var kvp = arg.split('='); 
                    argsParsed[kvp[0].trim()] = kvp[1].trim();
                }
            }
            return argsParsed[name];
        } else {
            return '';
        }
    }

    u.getGetParamsFromURL = function (query, name) {
        if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(query)) {
            return decodeURIComponent(name[1]);
        }else {
            return '';
        }
    }

    exports = u;

}).call(this);

return exports;

});
