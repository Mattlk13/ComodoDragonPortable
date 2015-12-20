define(function (require) { 

    var exports = {};
    var blockAllAtStart = require('./localConfig').BLOCK_ALL_AT_START;
    var cookie_props = require('./localConfig').COOKIE_PROPS;
    var URI = require('./frameworks/uri').URI;
    var debug = require('./localConfig').USERPREFS_DEBUG_MODE;
    var categoriesWhitelist = require('./localConfig').USERPREFS_CATEGORIES_WHITE_LIST;
    var STORAGE_ITEM_NAME = 'userPrefs';

    function stripWWW (host) {
        return host.replace(/^www\./, '');
    }

    function wildcardToRegExp(wildcard){
        if (wildcard.indexOf('*.') === 0) {
            wildcard = wildcard.replace('*.', '*');
        }
        var pattern = wildcard.replace(/\./g, '\\.');
        pattern = pattern.replace(/\?/g, '.');
        pattern = pattern.replace(/\*/g, '.*');
        pattern = '^(www\.)?'+pattern+'$';

        return pattern;
    }

    exports = {

        data: {
            block: 'except_trustedads',
            ba: 'in',
            pluginState: true,
            cookieBlocking: false,
            sitesWhitelist: {},
            threatsWhitelist: {},
            threatCategoriesWhitelist: categoriesWhitelist,
            ctxmenuState: true,
            doNotTrack: false
        },

        init: function (bgUtils) {

            if (!this.load()) {
                this.save();
            }

            //check for plugin installation (first run)
            var userPrefs = this;
            function onInstallCallback() {
                if (blockAllAtStart) {
                    userPrefs.setBlock('all');
                } else {
                    userPrefs.setBlock('except_trustedads');
                }
            }
            function onUpdateCallback() {
                userPrefs.updateCookie();
            }
            function onSetupUpdateCallback() {
                if (blockAllAtStart) {
                    userPrefs.setBlock('all');
                } else {
                    userPrefs.setBlock('except_trustedads');
                }
            }

            bgUtils.checkPluginInstall(onInstallCallback, onUpdateCallback, onSetupUpdateCallback);

            chrome.cookies.onChanged.addListener(function (changeInfo) {
                var isUserPrefsBlockCookie = (
                    (changeInfo.cookie.domain.replace(/^\./, '') == URI.parse(cookie_props.path).host) &&
                    (changeInfo.cookie.name == cookie_props.name) &&
                    (changeInfo.cause == 'explicit')
                );

                if(isUserPrefsBlockCookie){
                    var state = $.parseJSON(unescape(changeInfo.cookie.value)).block;
                    var ba = $.parseJSON(unescape(changeInfo.cookie.value)).ba;

                    if(typeof(ba) != 'undefined' && userPrefs.data.ba != ba){
                        userPrefs.data.ba = ba;
                        userPrefs.save();
                        userPrefs.updateRetargetingStatus();
                    }

                    if(typeof(state) != 'undefined' && userPrefs.data.block != state){
                        userPrefs.data.block = state;
                        userPrefs.save();
                    }
                }
            });

            this.syncCookieBlockingAccordingToExtension();
        },


        save: function () {
            salsita.localStorage.setItem(STORAGE_ITEM_NAME, JSON.stringify(this.data));
        },


        load: function () {
            var dataJSON = salsita.localStorage.getItem(STORAGE_ITEM_NAME);

            if (dataJSON) {
                data = JSON.parse(dataJSON);
                for (prop in this.data) {
                    if (prop in data) {
                        this.data[prop] = data[prop];
                    }
                }
                if ($.isArray(this.data.sitesWhitelist)) {
                    this.data.sitesWhitelist = this.transfromSitesWhitelist(this.data.sitesWhitelist);
                    this.save();
                }
                return true;
            }
            return false;
        },

        transfromSitesWhitelist: function (wlArray) {
            var wlObject = {};
            for (var i = 0; i < wlArray.length; i++) {
                wlObject[wlArray[i]] = {pattern: wildcardToRegExp(wlArray[i])};
            }
            return wlObject;
        },

        updateCookie: function(){
            var userPrefs = this;
            // this.log('updateCookie', userPrefs.data.block);
            var time = new Date();
            time.setYear(time.getFullYear()+1);
            time = time.getTime()/1000;
            
            chrome.cookies.get({url: cookie_props.path, name:cookie_props.name}, function(cookie){
                var block = userPrefs.data.block;

                if(cookie) {
                    prefs = JSON.parse(decodeURIComponent(cookie.value));
                    prefs['block'] = block;
                }else {
                    prefs = {block: block};
                }

                chrome.cookies.set({
                  url: cookie_props.path,
                  name: cookie_props.name,
                  domain: cookie_props.domain,
                  value:encodeURIComponent(JSON.stringify(prefs)),
                  expirationDate: time
                });
            });
        },

        updateRetargetingStatus: function() {
            var Session = require('./backgroundSession').Session;

            if(this.data.ba == 'in') {
                Session.retargetingModule.enabled();
            }else if(this.data.ba == 'out') {
                Session.retargetingModule.disabled();
            }
        },

        setPluginState: function (state) {
            this.data.pluginState = state;
            this.save();
        },

        setBlock: function (state) {
            this.data.block = state;
            this.updateCookie();
            this.save();
        },

        getBlock: function () {
            return this.data.block;
        },

        getPluginState: function () {
            return this.data.pluginState;
        },

        setCtxmenuState: function (state) {
            this.data.ctxmenuState = state;
            this.save();

        },

        getCtxmenuState: function (state) {
            return this.data.ctxmenuState;
        },

        //for CookieBlocking extension entire state
        setCookieBlockingState: function (state) {
            this.data.cookieBlocking = state;
            this.save();
        },

        getCookieBlockingState: function () {
            return this.data.cookieBlocking;
        },

        //for Browser's CookieBlocking state
        setBrowserCookieBlockingState: function (state) {
            chrome.privacy.websites.thirdPartyCookiesAllowed.set({'value': !state, 'scope': 'regular'});
        },

        getBrowserCookieBlockingState: function (callback) {
            chrome.privacy.websites.thirdPartyCookiesAllowed.get({}, function (details) {
                callback(!details.value);
            });
        },

        //sync of extension's and browser's CookieBlocking states
        syncCookieBlockingAccordingToExtension: function () {
            var extensionCookieBlockingState = this.getCookieBlockingState();
            this.setBrowserCookieBlockingState(extensionCookieBlockingState);
        },

        syncCookieBlockingAccordingToBrowser: function () {
            var self = this;
            this.getBrowserCookieBlockingState(function (browserCookieBlockingState){
                self.setCookieBlockingState(browserCookieBlockingState);
            });
        },

        setDoNotTrackState: function (state) {
            this.data.doNotTrack = state;
            this.save();
        },

        getDoNotTrackState: function () {
            return this.data.doNotTrack;
        },

        addSiteToWhitelist: function (wildcard) {
            if (wildcard && !this.isSiteWhitelistExist(wildcard)) {
                this.data.sitesWhitelist[wildcard] = {pattern: wildcardToRegExp(wildcard)};
                this.save();
                return true;
            }
            return false;
        },

        removeSiteFromWhitelist: function (wildcard) {
            if (wildcard && this.isSiteWhitelistExist(wildcard)) {
                delete this.data.sitesWhitelist[wildcard];
                this.save();
                return true;
            }
            return false;
        },

        getWildcardsInWhitelist: function () {
            return Object.keys(this.data.sitesWhitelist);
        },

        isSiteWhitelistExist: function (wildcard) {
            return wildcard in this.data.sitesWhitelist;
        },

        isSiteWhitelisted: function (host) {
            if (!host) {
                return false;
            }
            for (var i in this.data.sitesWhitelist) {
                var pattern = this.data.sitesWhitelist[i].pattern;
                var r = new RegExp(pattern);
                if (r.test(host)) {
                    return true
                };
            }
            return false;
        },

        isThreatWhitelisted: function (threatHost) {
            return threatHost in this.data.threatsWhitelist;
        },

        isThreatCategoryWhitelisted: function(categoryId){
            return this.data.threatCategoriesWhitelist.indexOf(parseInt(categoryId));
        },

        setThreatWhitelisted: function (threat) {
            if (this.isThreatWhitelisted(threat.h)) {
                return;
            }
            this.data.threatsWhitelist[threat.h] = threat.c;
            this.save();
        },

        setThreatCategoryWhitelisted: function(categoryId){
            if (this.isThreatCategoryWhitelisted(categoryId) === -1) {
                 this.data.threatCategoriesWhitelist.push(parseInt(categoryId));
            }
            this.save();
        },

        removeThreatCategoryFromWhitelist: function (categoryId) {
            var index = this.isThreatCategoryWhitelisted(categoryId);
            if (index !== -1) {
                this.data.threatCategoriesWhitelist.splice(index, 1)
            }
            this.save();
        },

        getWhitelistedThreats: function () {
            return this.data.threatsWhitelist;
        },

        getWhitelistedThreatCategories: function () {
            return this.data.threatCategoriesWhitelist;
        },

        getThreatCategoriesStates: function () {
            var states = {};
            for (var i = 2; i < 5; i++) {
                states[i] = this.isThreatCategoryWhitelisted(i) === -1;
            }
            states[1] = this.getBlock() === 'all';
            states[5] = this.getCookieBlockingState();
            return states;
        },

        isThreatExcluded: function (threat) {
            if (this.isThreatWhitelisted(threat.h)) {
                return true;
            }
            if (this.isThreatCategoryWhitelisted(threat.c) != -1) {
                return true;
            }
            return false;
        },

    }

return exports;

});
