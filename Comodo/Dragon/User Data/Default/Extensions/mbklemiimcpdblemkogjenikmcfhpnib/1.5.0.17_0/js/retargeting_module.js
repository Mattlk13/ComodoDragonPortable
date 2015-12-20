define(function (require) { 

    var URI = require('./frameworks/uri').URI;
    var instanceIdHeaderName = require('./localConfig').INSTANCE_ID_HEADER_NAME;
    var computerIdHeaderName = require('./localConfig').COMPUTER_ID_HEADER_NAME;
    var Session = require('./backgroundSession').Session;
    var bgUtils = require('./backgroundUtils');
    //module can be turned off or on
    var enabled = true;

    function RetargetingModule() {
        //by default set to 0, means retargeting system not enabled
        var status = 0;
        var config = {};
        var remarketingData = {};
        var conversionData = {};

        //public method
        //config setter
        this.setConfig = function (configObject) {
            status = configObject.status;

            //if status set to 0, no need to process other params
            if (!status) {
                return;
            }

            //storing also full object
            config = configObject;

            remarketingData = configObject.remarketing;
            conversionData = configObject.conversion;
        };

        this.off = function (){
            status = 0;
        };

        this.enabled = function(){
            enabled = true;
        };

        this.disabled = function(){
            enabled = false;
        };

        //public method
        //point of enter from WebRequestInspector
        this.processRequest = function (details) {
            if (details.type === 'main_frame') {
                var self = this;

                //get all chrome windows
                chrome.windows.getAll(null, function(wins) {
                    for (var j = 0; j < wins.length; ++j) {
                        //get all chrome tabs
                        chrome.tabs.query({'windowId': wins[j].id}, function(tabs) {
                          var tabExist = false;

                          for (var i = 0; i < tabs.length; ++i) {
                                if(tabs[i].id == details.tabId) {
                                    tabExist = true;
                                    break;
                                } 
                          }

                          //launch retargeting request
                          if(tabExist) {
                                var previousUrl = Session.getTabInfoProperty(details.tabId, 'previousUrl');
                                var refererUrl = '';
                                if (bgUtils.urlToNormalForm(previousUrl) !== bgUtils.urlToNormalForm(details.url)) {
                                    refererUrl = self.findRefererUrl(details.requestHeaders);
                                }
                                self.processUrl(details.url, refererUrl);
                          }
                        });
                    }
                });
            }
        };

        this.findRefererUrl = function (headers) {
            if (headers && headers.length) {
                for (var i = 0; i < headers.length; i++) {
                    if (headers[i].name === 'Referer') {
                        return headers[i].value;
                    }
                }
            }
            return '';
        }

        this.processUrl = function(url, refererUrl) {
            var full_path, protocol, domain_w_scheme, path, domain_w_protocol;
            //if enabled module and data received
            //else do nothing
            if (enabled && status !== 0) {
                //send only urls from list
                domain = URI.parse(url).host_without_www;
                protocol = URI.parse(url).scheme;
                path = URI.parse(url).path;
                path = path.slice(-1) === '/' ? path : path + '/';

                full_path = protocol + '://' + domain + (path !== "" ? path : '/');
                domain_w_protocol = protocol + '://' + domain + '/';

                //checking for current domain in lists
                //checking both, domain with protocol only and domain with path, because it can be defined in API as a domain or as a path
                //in case of domain, we must pass all requests on that domain and can't use full_path
                if(status == 1) {
                    if (remarketingData.domains.length && (remarketingData.domains.indexOf(full_path) !== -1 || remarketingData.domains.indexOf(domain_w_protocol) !== -1 )) {
                        send(url, 'remarketing', refererUrl);
                    }

                    //domain can be in both lists
                    if (conversionData.domains.length && (conversionData.domains.indexOf(full_path) !== -1 || conversionData.domains.indexOf(domain_w_protocol) !== -1)) {
                        send(url, 'conversion', refererUrl);
                    }
                }else if (status == 2) { //send all urls to server
                    if (config.analytics.url) {
                        send(url, 'analytics', refererUrl);
                    } else {
                        //force to remarketing
                        send(url, 'remarketing', refererUrl);
                    }
                }
            }

        };

        function _getData(method, urls, user_guid, refererUrl) {
            
            var data = {};
            data.u = urls;
            data.c = user_guid;


            data.r = refererUrl;
            //data.cv = Session.channelVersion;
            //data.pr = Session.distributedProductId;
            //data.dv = Session.productVersion;
            data.af = Session.affiliateId;
            data.pv = Session.extVersion;
            data.ts = new Date().getTime();
            data.tz = new Date().toString().match(/([A-Z]+[\+-][0-9]+)/)[1];

            return data;
        }

        function _getDataOld(url) {
            var data = {};
            data.urls = [encodeURIComponent(url)];
            return data;
        }

        //private method
        function send(url, type, refererUrl) {
            var urlData;
            var method = 'register_url';
            var googlePingReferersCache = Session.webRequestInspector.googlePingReferersCache;

            if (googlePingReferersCache[url]) {
                refererUrl = googlePingReferersCache[url];
                //delete googlePingReferersCache[url];
            } else{
                refererUrl = refererUrl.replace(/\//g, '\\/');
            }
            
            url = url.replace(/\//g, '\\/');

            var data = {};
            if (true !== /val_api.php/i.test(config[type].url)) {
                data = _getData(method, url, Session.computerId, refererUrl);
            } else {
                data = _getDataOld(url);
            };
            urlData = JSON.stringify(data);

        

            $.ajax({
                url: config[type].url,
                type: 'PUT',
                //dataType: 'json',
                beforeSend: function (request) {
                    request.setRequestHeader(instanceIdHeaderName, Session.instanceId);
                    request.setRequestHeader(computerIdHeaderName, Session.computerId);
                },
                data: urlData
            });

        };

    }

return RetargetingModule;

});
