define(function (require) { 
    
    var exports = {};
    var Session = require('./backgroundSession').Session;
    var bgUtils = require('./backgroundUtils');
    var URI = require('./frameworks/uri').URI;

    function ThirdPartyAdsModule() {
        var activated = require('./localConfig').THIRD_PARTY_ADS;
        var creativeControlDomain = [];
        var creativeControlFullUrl = [];
        var creativeControlRegExp = [];

        /**
        * public method
        * point of enter from WebRequestInspector
        **/
        this.checkURL = function (details) {
            if(!activated) return false;

            var status = false;
            var referer = bgUtils.getRefererFromRequest(details);

            if(referer && referer.indexOf('adtrustmedia.com/show_content.php') >= 0) {
                if(!checkInSession(details.tabId)) {
                    this.clearTab(details.tabId);
                }

                var tabThirdPartyAds = getFromSession(details.tabId);
                
                tabThirdPartyAds['referer'].push(details.url);
                tabThirdPartyAds['requestId'].push(details.requestId);
                
                setInSession(details.tabId, tabThirdPartyAds);
                
                status = true; 
            }

            if(checkInSession(details.tabId)) {
                var tabThirdPartyAds = getFromSession(details.tabId);

                if(referer && tabThirdPartyAds['referer'].indexOf(referer) >= 0) {
                    tabThirdPartyAds['referer'].push(details.url);
                    tabThirdPartyAds['requestId'].push(details.requestId);

                    setInSession(details.tabId, tabThirdPartyAds);
                    status = true; 
                }

                if(tabThirdPartyAds['requestId'].indexOf(details.requestId) >= 0) {
                    status = true;
                }
            }

            return status;
        };

        /**
        * public method
        * set creative control data from configLoader.js
        **/
        this.setCreativeControl = function (list) {
            if(!activated) return false;

            for(var i = 0; i < list.length; i++) {
                var categoty = list[i];

                //set category
                switch(categoty.t) {
                    case "DOMAIN": 
                        creativeControlDomain = categoty.s;
                        break;

                    case "FULL_URL": 
                        creativeControlFullUrl = categoty.s;
                        break;

                    case "REGEXP": 
                        creativeControlRegExp = categoty.s;
                        break;
                }
            }
        };

        /**
        * public method
        * check url is creative control
        * return boolean
        **/
        this.checkCreativeControl = function(details) {
            if(!activated) return false;

            var url = details.url;
            var status = false;
            var domain = URI.parse(url).host;

            if(domain.indexOf('adtrustmedia.com') >= 0) return false;

            for(var i = 0; i < creativeControlDomain.length; i++) {
                if(domain == creativeControlDomain[i]) {
                    status = true;
                }
            }

            for(var i = 0; i < creativeControlFullUrl.length; i++) {
                if(url == creativeControlFullUrl[i]) {
                    status = true;
                }
            }

            for(var i = 0; i < creativeControlRegExp.length; i++) {
                var regexp = new RegExp(creativeControlRegExp[i], 'img');
                if(regexp.test(url)) {
                    status = true;
                }
            }

            return status;
        };

        /**
        * public method
        * remove all information about thirdPartyAds from tab
        **/
        this.clearTab = function (tabId) {
            if(!activated) return false;
            setInSession(tabId, {'referer': [],'requestId': []});
        };

        /**
        * private method
        * check thirdPartyAds object in Session for tab
        * return boolean
        **/
        function checkInSession(tabId) {
            return (typeof(Session.getTabInfoProperty(tabId, 'thirdPartyAds')) != 'undefined');
        };

        /**
        * private method
        * read thirdPartyAds object from Session for tab
        * return object
        **/
        function getFromSession(tabId) {
            return Session.getTabInfoProperty(tabId, 'thirdPartyAds');
        };

        /**
        * private method
        * write thirdPartyAds object in Session for tab
        * return undefined
        **/
        function setInSession(tabId, info) {
            Session.setTabInfoProperty(tabId, 'thirdPartyAds', info);
        };

    }

    exports = ThirdPartyAdsModule;

return exports;

});
