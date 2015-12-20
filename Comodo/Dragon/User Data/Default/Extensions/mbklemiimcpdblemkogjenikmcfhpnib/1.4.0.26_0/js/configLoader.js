define(function (require) {

    var Session = require('./backgroundSession').Session;
    var IS_CACHED_CONFIG = require('./localConfig').IS_CACHED_CONFIG;
    var userPrefs = require('./userPrefs');
    var bgUtils = require('./backgroundUtils');
    var exports = {
        webRequestInspector: null,
        retargPollInt: null,//interval object which reloads main config

        init: function (webRequestInspector) {
            this.webRequestInspector = webRequestInspector;
            var self = this;

            //if cached config exists then load from cache else load from local files
            var storedConfigAttrs = this.getStoredConfigAttrs('CIAA');
            if (IS_CACHED_CONFIG && storedConfigAttrs && storedConfigAttrs.u) {
                this.loadStoredConfigData();
            } else {
                this.loadLocalConfigData();
            }

            userPrefs.init(bgUtils);
            Session.serpInjector.checkOnGoogleInOpenedTabs();

            this.whenTimeToUpdateConfig(function () {
                self.loadServerConfigData();
            });
        },

        //loads local config files
        loadLocalConfigData: function () {
            this.checkAndUpdateConfig(this.modifyUrlIfLocal('main.json'));
        },

        //loads config files from remote server
        loadServerConfigData: function () {
            this.checkAndUpdateConfig(bgUtils.prepareUrlMainConf(Session.serverConfigURL));
        },

        //loads config files from cache
        loadStoredConfigData: function () {
            Session.CIAAConfigAttrs = this.getPreviousConfigData('CIAA', 'Refetching from cache');
            this.loadSubConfigsFromCache();
            this.setPollingInterval(false);
        },

        //url modifies if url is local
        //"exlst.json" to "chrome-extension://eoelffbnbgaaoppjojnjhgmgcgojhgec/config/exlst.json"
        modifyUrlIfLocal: function (url) {
            if (this.isLocalConfigUrl(url)) {
                //gets url for local config using just filename
                url = chrome.extension.getURL('/config/' + url);
            }
            return url;
        },

        //checks if specified url is for local config
        isLocalConfigUrl: function (url) {
            return !/(http|https):\/\//.test(url);
        },

        //returns data from cache for specified config
        getStoredConfigAttrs: function (configId) {
            var storedCfgAttrs = salsita.localStorage.getItem(configId);
            if (storedCfgAttrs) {
                return JSON.parse(storedCfgAttrs);
            }
            return null;
        },

        getPreviousConfigData: function (configId, text) {
            //FIXME this method needs refactoring since 
            var storedData = this.getStoredConfigAttrs(configId);
            if (storedData) {
                return storedData;
            } else {
                var message = configId + '. Server or configuration error: ' + text;
                throw message;
            }
        },

        isPresentPreviousConfig: function (configId) {
            return this.getStoredConfigAttrs(configId);
        },

        saveXMLconfig: function (data, configId) {
            var value = JSON.stringify(data);
            localStorage.setItem(configId, value);
        },

        removeXMLconfig: function (configId) {
            localStorage.removeItem(configId);
        },

        //makes simple ajax to specified url and executes callback
        getConfigData: function (configUrl, successCallBack, errorCallBack) {
            $.ajax({
              url: this.addHashToUrl(configUrl),
              dataType: "text",
              success: successCallBack,
              error: errorCallBack
            });
        },

        //makes full load of main config with subconfigs or loads main config and check if some subconfigs needs to be loaded
        checkAndUpdateConfig: function (configURL, updateCheck) {
            var self = this;

            var errorCallBack = function (text) {
            // getPreviousConfigData(CIAAConfig, 'CIAA', text);
            // trigger 'change' event immediately if serverConfig changed
            };

            var successCallBack = function (data) {
                var newAttr = JSON.parse(data);

                //for each subconfig it's version will be checked and if it needed last version will be loaded
                var currentAttr = Session.CIAAConfigAttrs;
                Session.CIAAConfigAttrs = newAttr;
                self.saveXMLconfig(newAttr, 'CIAA');
                self.setPollingInterval(!self.isLocalConfigUrl(configURL));
                if (currentAttr.u) {
                    if (self.wasSubConfigUpdated(currentAttr.t, newAttr.t)) {
                        self.loadTrustAdConfig(newAttr.t.u);
                    }
                    if (self.wasSubConfigUpdated(currentAttr.s, newAttr.s)) {
                        self.loadSerpConfig(newAttr.s.u);
                    }
                    if (self.wasSubConfigUpdated(currentAttr.e, newAttr.e)) {
                        self.loadExclusionsAdConfig(newAttr.e.u);
                    }
                    if (self.wasSubConfigUpdated(currentAttr.d, newAttr.d)) {
                        self.loadIFrameCommScr(newAttr.d.u);
                    }

                    if ((self.wasSubConfigUpdated(currentAttr.a, newAttr.a) || !self.isPresentPreviousConfig('CreativeControlConfig')) && newAttr.a) {
                        self.loadCreativeControlConfig(newAttr.a.u);
                    }

                    if (self.wasSubConfigUpdated(currentAttr.m, newAttr.m)) {
                        self.loadSuggestionConfig(newAttr.m.u);
                    }

                    if (self.wasSubConfigSwitchedOff(currentAttr.m, newAttr.m)) {
                        self.switchOffSuggestionConfig();
                    }

                    self.applyRetargMainConfigData(newAttr.b);
                } else {
                    self.loadSubConfigs();
                }
            };

            this.getConfigData(configURL, successCallBack, errorCallBack);

        },

        wasSubConfigUpdated: function (currentC, newC) {
            return (newC && !currentC) || (newC && currentC && currentC.v != newC.v);
        },

        wasSubConfigSwitchedOff: function (currentC, newC) {
            return currentC && !newC;
        },

        //loads all subconfigs from cache
        loadSubConfigsFromCache: function () {
            var attrs = Session.CIAAConfigAttrs;
            this.loadTrustAdConfig();
            this.loadExclusionsAdConfig();
            this.loadCreativeControlConfig();
            this.loadSerpConfig();
            this.loadIFrameCommScr();
            this.applyRetargMainConfigData(attrs.b);
            if (attrs.m) {
                this.loadSuggestionConfig();
            }

            this.setFeaturesState();
        },

        //loads all subconfigs by urls from last loaded main config
        loadSubConfigs: function () {
            var attrs = Session.CIAAConfigAttrs;
            this.loadTrustAdConfig(attrs.t.u);
            this.loadSerpConfig(attrs.s.u);
            this.loadIFrameCommScr(attrs.d.u);

            if (attrs.e) {
                this.loadExclusionsAdConfig(attrs.e.u);
            }

            this.applyRetargMainConfigData(attrs.b);
            if (attrs.m) {
                this.loadSuggestionConfig(attrs.m.u);
            }

            if (attrs.a) {
                this.loadCreativeControlConfig(attrs.a.u);
            }

            this.setFeaturesState();
        },

        //loads TrustAd config. Same structure for methods which loads other configs
        loadTrustAdConfig: function (url) {
            if (url) {
                //url is specified, that means that config should be loaded from remote server or local directory
                var self = this;

                url = this.modifyUrlIfLocal(url);

                var successCallBack = function (data) {
                    var data = JSON.parse(data);
                    self.saveXMLconfig(data, 'TrustAd');
                    self.applyTrustAdConfig(data);
                };

                var errorCallBack = function (text) {
                    var data = self.getPreviousConfigData('TrustAd', text);
                    self.applyTrustAdConfig(data);
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('TrustAd')) {
                //url isn't specified then load from localstorage
                var data = this.getPreviousConfigData('TrustAd', 'trustAd refetched from cache');
                this.applyTrustAdConfig(data);
            }

        },

        //each config has method which applies it's data to plugin precessing
        applyTrustAdConfig: function (data) {
            this.webRequestInspector.setRedirections(data.r);
            bgUtils.checkOptionsPageInOpenedTabs();
        },

        loadExclusionsAdConfig: function (url) {
            if (url) {
                url = this.modifyUrlIfLocal(url);

                var self = this;
                var successCallBack = function (data) {
                    var data = JSON.parse(data);
                    self.saveXMLconfig(data, 'exclusionsConfig');
                    self.applyExclusionsAdConfig(data);
                };
                var errorCallBack = function (text) {
                    var data = self.getPreviousConfigData('exclusionsConfig', text);
                    self.applyExclusionsAdConfig(data);
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('exclusionsConfig')) {
                var data = this.getPreviousConfigData('exclusionsConfig', 'exclusions config refetched from cache');
                this.applyExclusionsAdConfig(data);
            }

        },

        loadCreativeControlConfig: function (url) {
            if (url) {
                url = this.modifyUrlIfLocal(url);

                var self = this;
                var successCallBack = function (data) {
                    var data = JSON.parse(data);
                    self.saveXMLconfig(data, 'CreativeControlConfig');
                    self.applyCreativeControlConfig(data);
                    self.writeIntervalCreativeControl(data.u.a);
                    self.setIntervalCreativeControl();
                };
                var errorCallBack = function (text) {
                    self.writeIntervalCreativeControl('60');
                    self.setIntervalCreativeControl();
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('CreativeControlConfig')) {
                var data = this.getPreviousConfigData('CreativeControlConfig', 'exclusions config refetched from cache');
                this.applyCreativeControlConfig(data);
                this.setIntervalCreativeControl(data);
            }
        },

        applyExclusionsAdConfig: function (data) {
            this.webRequestInspector.setExclusions(data);
        },

        applyCreativeControlConfig: function (data) {
            Session.thirdPartyAdsModule.setCreativeControl(data.r)
        },

        writeIntervalCreativeControl: function(interval) {
            salsita.localStorage.setItem('creativeUpdateTime', Date.now() + (interval > 0 ? interval : 360) * 60 * 1000);
        },

        setIntervalCreativeControl: function(data) {
            var updateTime = salsita.localStorage.getItem('creativeUpdateTime');
            clearTimeout(this.intervalCreativeControl);

            if(!isNaN(updateTime)) {
                var self = this;
                var diffTime = updateTime - Date.now();
                if(diffTime < 0){
                    if(!!Session.CIAAConfigAttrs.a && !!Session.CIAAConfigAttrs.a.u) {
                        this.loadCreativeControlConfig(Session.CIAAConfigAttrs.a.u);
                    }
                }else {
                    this.intervalCreativeControl = setTimeout(function() {
                        if(!!Session.CIAAConfigAttrs.a && !!Session.CIAAConfigAttrs.a.u) {
                            self.loadCreativeControlConfig(Session.CIAAConfigAttrs.a.u);
                        }
                    }, diffTime);
                }
            }
        },

        loadSerpConfig: function (url) {
            if (url) {
                url = this.modifyUrlIfLocal(url);

                var self = this;

                var successCallBack = function (data) {
                    var data = JSON.parse(data);
                    self.saveXMLconfig(data, 'serpConfig');
                    self.applySerpConfig(data, true);
                };
                var errorCallBack = function (text) {
                    var data = self.getPreviousConfigData('serpConfig', text);
                    self.applySerpConfig(data);
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('serpConfig')) {
                var data = this.getPreviousConfigData('serpConfig', 'SERP config refetched from cache');
                this.applySerpConfig(data);
            }
        },

        applySerpConfig: function (data, forceLoad) {
            Session.serpInjector.saveConfig(data);
            this.loadSerpScripts(data, forceLoad);
        },

        //loads all serp scripts. if "forceload" is true then scripts will be loaded even if they are in localstorage
        loadSerpScripts: function (configData, forceLoad){
            var self = this;

            Session.SERPAdsDeliveryPoint = configData.l;

            for (var i = 0; i < configData.e.length; i++) {
                var scriptUrl = this.modifyUrlIfLocal(configData.e[i].u);
                var cached_text = Session.serpInjector.loadFromCache(scriptUrl);
                if (cached_text && !forceLoad) {
                    Session.serpInjector.saveScriptText(i, cached_text);
                } else {
                    this.ajaxSerpScript(scriptUrl, i, configData);
                }
            }
        },

        //makes simple ajax and prepares script text for next use
        ajaxSerpScript: function (scriptUrl, i, configData) {
            var self = this;
            $.ajax({
              url: this.addHashToUrl(scriptUrl),
              dataType: "text",
              success: function (data) {
                    Session.serpInjector.saveScriptText(i, data);
                }
            });
        },

        loadSuggestionConfig: function (url) {
            if (url) {
                url = this.modifyUrlIfLocal(url);

                var self = this;
                var successCallBack = function (data) {
                    if (self.isLocalConfigUrl(url)) {
                        if (self.serverSuggestionLoaded) {
                            return;
                        }
                    } else {
                        self.serverSuggestionLoaded = true;
                    }

                    var data = JSON.parse(data);
                    self.saveXMLconfig(data, 'suggestionConfig');
                    self.applySuggestionConfig(data);
                };
                var errorCallBack = function (text) {
                    var data = self.getPreviousConfigData('suggestionConfig', text);
                    self.applySuggestionConfig(data);
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('suggestionConfig')) {
                var data = this.getPreviousConfigData('suggestionConfig', 'suggestion config refetched from cache');
                this.applySuggestionConfig(data);
            }
        },

        applySuggestionConfig: function (data) {
            Session.suggestionModule.setConfig(data);
        },

        //FIXME remove this method
        switchOffSuggestionConfig: function () {
            Session.suggestionModule.setConfig({});
            this.removeXMLconfig('suggestionConfig');
            this.serverSuggestionLoaded = true;
        },

        applyRetargMainConfigData: function (data) {
            if (data) {
                this.loadRetargetingDomainsConfig(data.l);
                this.setRetargPollInt(data.a, data.l);
            } else {
                Session.retargetingModule.off();
                this.denyRetargPollInt();
            }
        },

        loadRetargetingDomainsConfig: function (url) {
            if (url) {

                url = this.modifyUrlIfLocal(url);

                var self = this;
                var intID = self.retargPollInt;

                var successCallBack = function (data) {
                    var data = JSON.parse(data);
                    var b = Session.CIAAConfigAttrs.b;
                    //loaded data must be getted from saved currently retarg url
                    if (b && url === b.l) {
                        self.saveXMLconfig(data, 'retargDomains');
                        self.applyRetargDomains(data, true);
                    }
                };
                var errorCallBack = function (text) {
                    var data = self.getPreviousConfigData('retargDomains', text);
                    self.applyRetargDomains(data);
                };

                this.getConfigData(url, successCallBack, errorCallBack);

            } else if (this.isPresentPreviousConfig('retargDomains')) {
                var data = this.getPreviousConfigData('retargDomains', 'retargDomains config refetched from cache');
                this.applyRetargDomains(data);
            }
        },

        applyRetargDomains: function (data) {
            var retargettingAttrs = Session.CIAAConfigAttrs.b; 
            Session.retargetingModule.setConfig({
                status: retargettingAttrs.s,
                remarketing: {
                    url: retargettingAttrs.r,
                    domains: data.r
                },
                conversion: {
                    url: retargettingAttrs.c,
                    domains: data.c
                },
                analytics: {
                    url: retargettingAttrs.u
                }
            });
        },

        //starts interval which loads webRetargetingDomains and applies it
        setRetargPollInt: function (intervalSec, url) {
            var currentUpdateInfo = Session.CIAAConfigAttrs.u;

            // <polling_interval> is in minutes:
            var msecs = parseInt(intervalSec) * 1000 * 60;

            if (this.retargPollInt) {
                window.clearInterval(this.retargPollInt);
            }

            var self = this;
            this.retargPollInt = window.setInterval(function () {
                self.loadRetargetingDomainsConfig(url);
            }, msecs);
        },

        //if retergeting was used in previous config but not used in current then this method switches off this feature
        denyRetargPollInt: function () {
            if (this.retargPollInt) {
                window.clearInterval(this.retargPollInt);
            }
        },

        // Initialize the pollingInterval timer.
        setPollingInterval: function (saveTimestamp) {
            var currentUpdateInfo = Session.CIAAConfigAttrs.u;

            // <polling_interval> is in seconds:
            var timeout = parseInt(currentUpdateInfo.p) * 1000;

            if (saveTimestamp) {
                this.saveNextTimeToUpdate(timeout);
            }

            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }

            var self = this;
            this.pollingInterval = window.setInterval(function () {
                if (saveTimestamp) {
                    self.saveNextTimeToUpdate(timeout);
                }
                self.loadServerConfigData();
            }, timeout);
        },

        //
        // Features disabling functionality
        //
        setFeaturesState: function () {
        // All features enabled by default:
            Session.featuresState = {
                background_color: true,
                search_item_icons: true,
                pop_up: true,
                dropdown_menu: true,
                current_site_icons: true,
                search_box: true,
                adtrustmedia_toolbar: false
            };

            // Get the comma-separated list of disabled features from the main config
            var disabledList = Session.CIAAConfigAttrs.f;
            if (disabledList) {
                disabledList = disabledList.split(',');
                // and override the key in the featuresState hash accordingly
                for (var i = 0; i < disabledList.length; i++) {
                    Session.featuresState[disabledList[i]] = false;
                }
            }

            Session.featuresState['adtrustmedia_toolbar'] = false;
        },

        //loads script for future injection on page. Will be used for communication between iframes
        loadIFrameCommScr: function (url) {
            var text, xhr;
            if (url) {
                url = this.modifyUrlIfLocal(url);

                xhr = new XMLHttpRequest();
                xhr.open("GET", this.addHashToUrl(url), false);
                xhr.send();

                text = xhr.responseText;

                salsita.localStorage.setItem('IFrameCommScr', text);
            }else{
                text = salsita.localStorage.getItem('IFrameCommScr');
            }

            Session.iFrameCommScrText = text;
        },

        addHashToUrl: function (url) {
            return url + (url.indexOf('?') > 0 ? '&' : '?') + 'ts=' + Date.now();
        },

        //executes callback when it is time to update main config from server
        //made to prevent multiple requests to server at browser start
        whenTimeToUpdateConfig: function (callback) {
            var updateTime = salsita.localStorage.getItem('atm_configUpdateTime');
            var currentTime = Date.now();
            //if update timestamp was not set or it was passed in past
            if (!updateTime || updateTime <= currentTime) {
                setTimeout(function () {
                    callback();
                }, 200);
            //if update time in future
            } else {
                var timeDiff = updateTime - currentTime;
                setTimeout(function () {
                    callback();
                }, timeDiff);
            }

        },

        saveNextTimeToUpdate: function (delay) {
            var timestamp = Date.now() + delay;
            salsita.localStorage.setItem('atm_configUpdateTime', timestamp);
        }

    }

return exports;

});
