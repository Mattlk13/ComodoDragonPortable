define(function (require) { 
    
    var exports = {};
    var Session = require('./backgroundSession').Session;
    var bgUtils = require('./backgroundUtils');
    var URI = require('./frameworks/uri').URI;

    function ThirdPartyAdsModule() {
        var activated = require('./localConfig').THIRD_PARTY_ADS;
        var securityCheckActivated = require('./localConfig').THIRD_PARTY_SECURITY_CHECK;
        var adIframeURL = 's.atmsrv.com/show_content.php';
        var creativeControlDomain = [];
        var creativeControlFullUrl = [];
        var creativeControlRegExp = [];
        var creativeControlCache = {};
        /**
        * public method
        * point of enter from WebRequestInspector
        **/
        this.checkURL = function (details) {
            if (!activated || details.tabId == -1) {
                return false;
            }
             
            var status = false;
            var referer = bgUtils.getRefererFromRequest(details);
            var url = details.url;
            var iframeData;

            //Initialization our iframe
            if(url.indexOf(adIframeURL) >= 0) {
                if (!checkInSession(details.tabId)) {
                    this.clearTab(details.tabId);
                }

                var tabThirdPartyAds = getFromSession(details.tabId);
                var ad_id = bgUtils.getGetParamsFromURL(details.url, 'a');

                iframeData = tabThirdPartyAds['iframe'][url] = {};
                iframeData['url'] = [];
                iframeData['requestId'] = {};

                if(ad_id) {
                    iframeData['ad_id'] = ad_id;
                }

                setInSession(details.tabId, tabThirdPartyAds);
            }

            //Check if request from our iframe
            if(referer && referer.indexOf(adIframeURL) >= 0) {
                var tabThirdPartyAds = getFromSession(details.tabId);
                iframeData = tabThirdPartyAds['iframe'][referer];

                if(iframeData && iframeData['url']) {
                    iframeData['url'].push(details.url);
                    iframeData['requestId'][details.requestId] = referer;
                }

                setInSession(details.tabId, tabThirdPartyAds);

                status = true; 
            }

            //Check if iframe's request from our iframe
            if(checkInSession(details.tabId)) {
                var tabThirdPartyAds = getFromSession(details.tabId);
                var refererFromRequest = getThirdPartyRefererFromRequest(tabThirdPartyAds, details.requestId);

                if(referer) {
                    var iframe = getIframeFromURL(tabThirdPartyAds, referer);
                    
                    if(iframe) {
                        iframeData = tabThirdPartyAds['iframe'][iframe];

                        if(iframeData && iframeData['url']) {
                            iframeData['url'].push(details.url);
                            iframeData['requestId'][details.requestId] = referer;
                        }

                        setInSession(details.tabId, tabThirdPartyAds);
                        status = true;
                    }
                }

                if(refererFromRequest) {
                    status = true;
                }
            }
            
            return status;
        };
        
        /**
        * public method
        * check adtrustmedia domain
        **/
        this.isAdTrustDomain = function(details) {
            var url = details.url;
            var host = URI.parse(url).host;
            return host.indexOf('atmsrv.com') >= 0 || host.indexOf('adtrustmedia.com') >= 0;
        }

        /**
        * public method
        * set creative control data from configLoader.js
        **/
        this.setCreativeControl = function (list) {
            if (!activated) {
                return false;
            }

            for (var i = 0; i < list.length; i++) {
                var categoty = list[i];

                //set category
                switch (categoty.t) {
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
            if (!activated) {
                return false;
            }

            var url = details.url;
            var status = false;
            var domain = URI.parse(url).host;

            if (this.isAdTrustDomain(details)) {
                return false;
            }

            for (var i = 0; i < creativeControlDomain.length; i++) {
                if (domain === creativeControlDomain[i]) {
                    status = true;
                }
            }

            for (var i = 0; i < creativeControlFullUrl.length; i++) {
                if (url == creativeControlFullUrl[i]) {
                    status = true;
                }
            }

            for (var i = 0; i < creativeControlRegExp.length; i++) {
                var regexp = new RegExp(creativeControlRegExp[i], 'img');
                if (regexp.test(url)) {
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
            if(!activated) {
                return false;
            }

            setInSession(tabId, {'iframe': {}});
        };
        
         /*********
         * BLN.php 
         */
        this.sendBlockEvent = function (details) {
            if(!securityCheckActivated) {
                return false;
            }

            var url = 'http://ads.adtrustmedia.com/bln.php?';
            var detailUrl = details.url;

            url += 'c=' + Session.computerId;
            url += '&af=' + Session.affiliateId;
            
            url += '&ad=' + getAdId(details);
            url += '&pv=' + Session.extVersion;
            url += '&r=' + encodeURIComponent(bgUtils.getRefererFromRequest(details));
            url += '&u=' +  window.btoa(detailUrl);
            url += '&cv=' + Session.channelVersion; 
            url += '&pr=' + Session.distributedProductId;
            url += '&dv=' + Session.productVersion;

            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'text'
            });
        }
        
            // image/* (all URLs having 'image' Media Type and all sub types)
            // video/* (all URLs having 'video' Media Type and all sub types)
            // application/x-shockwave-flash (all URLs having 'application' as Media Type and 'x-shockwave-flash' as sub type)
        this.isAcceptableContenttype = function(details) {
            var type = bgUtils.getContentTypeFromHeadres(details);
            return type.indexOf('image/') === 0 || type.indexOf('video/') === 0 || type === 'application/x-shockwave-flash';
        }

        this.sendCheckEvent = function (details) {
            if(!securityCheckActivated) {
                return false;
            }

            if (!creativeControlCache[details.url] && this.isAcceptableContenttype(details)) {
                if (details.tabId > -1) {
                    var self = this
                    chrome.tabs.get(details.tabId, function(tab) {
                        self.sendBLCData(details, tab.url);
                    });
                }
            }
        }

        /*********
         * BLC.php 
         */
        this.sendBLCData = function(details, referer) {
             if(!securityCheckActivated) {
                return false;
            }

            var url = 'http://ads.adtrustmedia.com/blc.php?';
            var detailUrl = details.url;
            var tabThirdPartyAds = getFromSession(details.tabId);
            var iframeRef = getThirdPartyRefererFromRequest(tabThirdPartyAds, details.requestId);
            creativeControlCache[details.url] = true;

            url += 'c=' + Session.computerId;
            url += '&af=' + Session.affiliateId;
            url += '&ad=' + getAdId(details);
            url += '&pv=' + Session.extVersion;
            url += '&r=' + encodeURIComponent(referer);
            url += '&s=' +  window.btoa(iframeRef);
            url += '&u=' +  window.btoa(detailUrl);
            url += '&cv=' + Session.channelVersion;
            url += '&pr=' + Session.distributedProductId;
            url += '&dv=' + Session.productVersion;

            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'text'
            });
        }

        /**
        * private method
        * check if url existence in thirdPartyAds object in Session for tab
        * return boolean
        **/
        function getIframeFromURL(tabThirdPartyAds, referer) {
            for(iframe in tabThirdPartyAds['iframe']) {
                if(tabThirdPartyAds['iframe'][iframe]['url'].indexOf(referer) >= 0) {
                    return iframe;
                } 
            }

            return false;
        };

        /**
        * private method
        * get referrer from request id
        * return boolean
        **/
        function getThirdPartyRefererFromRequest(tabThirdPartyAds, requestId) {
            for(iframe in tabThirdPartyAds['iframe']) {
                var referer =  tabThirdPartyAds['iframe'][iframe]['requestId'][requestId];

                if(referer) {
                    return referer;
                }
            }

            return '';
        };

        /**
        * private method
        * get ad_id for request
        * return boolean
        **/
        function getAdId(details) {
            var tabThirdPartyAds = getFromSession(details.tabId);

            for(iframe in tabThirdPartyAds['iframe']) {
                if(tabThirdPartyAds['iframe'][iframe]['url'].indexOf(details.url) >= 0) {
                    if(tabThirdPartyAds['iframe'][iframe]['ad_id']) {
                       return tabThirdPartyAds['iframe'][iframe]['ad_id'];
                    }
                }
            }

            return '';
        };

        /**
        * private method
        * check thirdPartyAds object in Session for tab
        * return boolean
        **/
        function checkInSession(tabId) {
            return typeof(Session.getTabInfoProperty(tabId, 'thirdPartyAds')) !== 'undefined';
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
