define(function(require) { 

    var exports = {};

(function() {

    var Session = require('./backgroundSession').Session;
    var userPrefs = require('./userPrefs');
    var bgUtils = require('./backgroundUtils');

    // Available background request handlers:
    //
    // + RegisterForUpdates
    // + GetMainConfiguration
    // + Navigate
    // + GetMenuView
    // + StoreToolbarIcons
    // + GetToolbarIcons
    // + StorePopupData
    // + GetPopupData
    // + InjectScripts
    // + GetFeaturesState
    // + GetInstanceId
    // + HashChange
    //
    // See messaging.js for more details.
    //
    
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

    exports.handlers = {

        handleContentLoaded: function (args, sender, sendResponse) {
            var SI = Session.serpInjector;

            chrome.tabs.query({active: true}, function (tabs) {
                var tab = tabs.length > 1 ? SI.chooseActiveTab(tabs) : tabs[0];
                if (!tab) {
                    return;
                }

                var tabId = tab.id;
                var engine = SI.getTabEngine(tabId, tab.url);

                if (!engine) {
                    return;
                }

                if (SI.isGoogleEngine(engine)) {
                    var urlResult = parseURL(tab.url);
                    if (urlResult && urlResult.searchObject && urlResult.searchObject["tbm"] === "isch") {
                        // we are in image search page
                        return
                    }
                    SI.setOriginalAdsVisibility(tabId, engine, false);
                    SI.setOriginalAdsDisplay(tabId, engine, true);
                }

                if (SI.isGoogleMainPage(args.url)) {
                    //Google main page must have JS inserted but without preloaded data
                    Session.setTabInfoProperty(tabId, 'serpPagePreloadData', 'noPreload');
                    SI.setOriginalAdsDisplay(tabId, engine, true);
                }

                
                if (SI.isYahooEngine(engine) || SI.isBingEngine(engine) || SI.isAskEngine(engine)) {
                    //In case if preloading was not started for some reason on search page
                    var wasAdRequestStarted = Session.getTabInfoProperty(tabId, 'serpAdRequestStarted');
                    var preloadData = Session.getTabInfoProperty(tabId, 'serpPagePreloadData');
                    if (!preloadData && !wasAdRequestStarted) {
                        Session.setTabInfoProperty(tabId, 'serpPagePreloadData', 'noPreload');
                    }
                } else {
                    if (!SI.isGoogleEngine(engine) && !SI.isAboutEngine(engine) && !SI.isWhitepagesEngine(engine) && !SI.isYellowpagesEngine(engine) && !SI.isMywebsearchEngine(engine)) {
                        //all engines from serp_injection.JSON
                        //which don't need any preload data
                        //such as facebook or other external scrtips
                        Session.setTabInfoProperty(tabId, 'serpPagePreloadData', 'noPreload');
                    }
                }

                Session.setTabInfoProperty(tabId, 'serpPageStartLoading', true);
                SI.insertJsIfReady(tabId, tab.url);

                //Processing for page loading after Google instant search
                if (SI.isInstantGoogleStartUrl(args.url)) {
                    Session.setTabInfoProperty(tabId, 'googleInstantPageStartLoading', true);
                    SI.insertJsIfInstantPageReady(tabId, tab.url);
                }
            });

        },

        handleGoogleJsInserted: function (args, sender, sendResponse) {
            //FIXME  uses only in serp-google - v1.7.0.10 - 2014-06-04 
            sendResponse({});
        },

        handleRegisterForUpdates: function (args, sender, sendResponse) {
            //FIXME Not used : RegisterForUpdates
            Session.setTabInfoProperty(sender.tab.id, 'sendSearchUpdates', true);
            sendResponse({});
        },

        handleNavigate: function (args, sender, sendResponse) {
            //FIXME Not used : Navigate cmd
            // Chrome-only code:
            if (args.newTab) {
                // create new tab
                chrome.tabs.create({
                    url: args.url,
                    active: args.active
                });
            } else {
                // navigate in current tab
                chrome.tabs.update(null, {
                    url: args.url
                });
            }

            sendResponse({});
        },

        handleStoreToolbarIcons: function(args, sender, sendResponse) {
            //FIXME Not used : StoreToolbarIcons cmd
            // remove previous icons associated with this tab, if any:
            Session.removeTabInfoProperty(sender.tab.id, 'toolbarIcons');

            // store icons, if any:
            if (args.length) {
                Session.setTabInfoProperty(sender.tab.id, 'toolbarIcons', args);
            }

            if (typeof(chrome) !== "undefined") {
                // TODO: Chrome-code only:
                var iconPath;
                if (Session.featuresState['adtrustmedia_toolbar']) {
                    iconPath = Session.featuresState['current_site_icons'] && Session.serverConfiguration.se_icons && args.length ? '../images/action_clr.png' : '../images/action_bw.png';
                } else {
                    iconPath = '../images/action_none.png';
                    chrome.browserAction.setTitle({ title: '' }); // fixing 31811409 bug
                }
                chrome.browserAction.setIcon({
                    path: iconPath,
                    tabId: sender.tab.id
                });
            }

            sendResponse({});
        },

        // called from actionPopup.js
        handleGetToolbarIcons: function (args, sender, sendResponse) {
            //FIXME Not used : GetToolbarIcons cmd
            sendResponse(Session.getTabInfoProperty(Session.currentTabId, 'toolbarIcons') || []);
        },

        handleStorePopupData: function (args, sender, sendResponse) {
            //FIXME Not used : StorePopupData cmd
            Session.setPopupData(args);

            sendResponse({});
        },

        handleGetPopupData: function (args, sender, sendResponse) {
            sendResponse(Session.getPopupData());
        },

        // needed by Features disabling functionality
        handleGetFeaturesState: function (args, sender, sendResponse) {
            //FIXME Not used : GetFeaturesState cmd
            sendResponse(Session.featuresState);
        },

        // needed by X-TA-InstID header functionality
        handleGetInstanceId: function (args, sender, sendResponse) {
            sendResponse(Session.instanceId);
        },

        handleGetIFrameCommScrText: function (args, sender, sendResponse) {
            sendResponse(Session.iFrameCommScrText);
        },

        handleSetCtaLinr: function (args, sender, sendResponse) {
            if (sender.tab) {
                Session.setTabInfoProperty(sender.tab.id, 'cta_linr', args);
            }
        },

        handleGetUserPrefs: function (args, sender, sendResponse) {
            //FIXME not used GetUserPrefs cmd
            sendResponse(Session.userPrefs);
        },

        //hendlers for Popup and Options page
        handleGetTabData: function (args, sender, sendResponse) {
            userPrefs.syncCookieBlockingAccordingToBrowser();

            var objReturnValue = {};
            objReturnValue['sessionCount'] = Session.totalBlockCounter ;
            objReturnValue['pluginState'] = userPrefs.getPluginState();
            objReturnValue['isWhitelisted'] = Session.getTabInfoProperty(args.tabId, 'whitelisted');
            objReturnValue['threatCount'] = Session.getTabInfoProperty( args.tabId, 'threatCount');

            var catsStatsRaw = Session.getTabInfoProperty( args.tabId, 'threatCatsStats');
            if (!catsStatsRaw) {
                catsStatsRaw = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
            }

            var adNetworkEnum = Session.getTabInfoProperty( args.tabId, 'adNetworkEnum');
            if (!adNetworkEnum) {
                adNetworkEnum = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
            }

            var catStates = Session.getTabInfoProperty( args.tabId, 'catStatesOnPageStart');
            if (!catStates) {
                catStates = userPrefs.getThreatCategoriesStates();
            }

            var catsStats = {};
            for (i in catsStatsRaw) {
                catsStats[i] = {
                    count: catsStatsRaw[i],
                    blocked: catStates[i],
                    adNetworkEnum: adNetworkEnum[i]
                }
            }

            objReturnValue['threatCatsStats'] = catsStats;

            sendResponse(objReturnValue);
        },

        handleSetPluginState: function (args, sender, sendResponse){
            userPrefs.setPluginState(args.state);
        },

        handleSetCookieBlockingState: function (args, sender, sendResponse) {
            //FIXME SetCookieBlockingState not uses
            userPrefs.setCookieBlockingState(args.state);
            userPrefs.syncCookieBlockingAccordingToExtension();
            sendResponse({});
        },

        handleSetDoNotTrackState: function (args, sender, sendResponse) {
            //FIXME setDoNotTrackState not uses
            userPrefs.setDoNotTrackState(args.state);
        },

        handleSiteInWhitelist: function (args, sender, sendResponse) {
            if (args.cmd === 'add') {
                if(userPrefs.isSiteWhitelistExist(args.wildcard)) {
                    sendResponse({success: false});
                } else {
                    userPrefs.addSiteToWhitelist(args.wildcard);
                    sendResponse({success: true});
                }
            } else if (args.cmd === 'remove') {
                userPrefs.removeSiteFromWhitelist(args.wildcard);
                sendResponse({success: true});
            }
        },

        handleGetSitesInWhitelist: function (args, sender, sendResponse) {
            var sites = userPrefs.getWildcardsInWhitelist();
            sendResponse(sites);
        },

        handleGetThreatsData: function (args, sender, sendResponse) {
            userPrefs.syncCookieBlockingAccordingToBrowser();
            var response = {
                ctxmenuState: userPrefs.getCtxmenuState(),
                pluginState: userPrefs.getPluginState(),
                cookieBlocking: userPrefs.getCookieBlockingState(),
                doNotTrack: userPrefs.getDoNotTrackState(),
                treats: Session.statsOptions,
                whitelist: userPrefs.getWhitelistedThreats(),
                whitelistCategories: userPrefs.getWhitelistedThreatCategories(),
                sitesWhitelist: userPrefs.getWildcardsInWhitelist(),
                totalBlockCount: Session.totalBlockCounter,
                block: userPrefs.getBlock()
            };
            sendResponse(response);
        },

        handleGetSitesWhitelist: function (args, sender, sendResponse) {
            //FIXME GetSitesWhitelist not used
            var response = {
                    sitesWhitelist: JSON.parse(salsita.localStorage.getItem('userPrefs')).sitesWhitelist
            };
            sendResponse(response);
        },

        handleThreatStateChanged: function (args, sender, sendResponse) {
            //FIXME ThreatStateChanged not used
            if (args.checked) {
                userPrefs.setThreatWhitelisted({h: args.name, c: args.id});
            }else{
                userPrefs.removeThreatFromWhitelist(args.name);
            }
        },

        handleThreatCategoryStateChanged: function (args, sender, sendResponse) {
            if (args.checked) {
                userPrefs.setThreatCategoryWhitelisted(args.catId);
            } else {
                userPrefs.removeThreatCategoryFromWhitelist(args.catId);
            }
        },

        handleSetUserPrefsBlock: function (args, sender, sendResponse){
            var state = args.state ? 'all' : 'except_trustedads';
            userPrefs.setBlock(state);
        },

        handleHashChange: function (args, sender, sendResponse){
            Session.retargetingModule.processUrl(args.u, args.r)
        },

        handleGetSecurityModuleScript: function (args, sender, sendResponse) {
            var scriptText = args.f ? Session.securityModule.getScript(args.u) : Session.securityModule.getScript(sender.tab.url);

            if(scriptText) {
                sendResponse(scriptText);
            }
        },
        
        handleInitTabSecurityModule: function (args, sender, sendResponse) {
            Session.securityModule.sendTab(sender.tab.id);
        },

        handleSetSecurityModule: function (args, sender, sendResponse) {
            var data = args;
            data['tabId'] = sender.tab.id;
            Session.securityModule.setData(data);
        }

    };

}).call(this);

return exports;

});
