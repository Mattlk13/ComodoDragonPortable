define(function (require) { 
    
    var userPrefs = require('./userPrefs');
    var URI = require('./frameworks/uri').URI;
    var exports = {

        //will Plugin menu item be shown in context menu
        isOn: false,

        //module init function. Should be run once at plugin start.
        //It adds listeners to listen events: user select another tab or user changes URL in currently opened tab
        //Depends on new URL value in tab menu updates
        //If user disable feature, then listeners are passive
        init: function () {
            var contextMenu = this;
            var activeTabId = 0;

            //update menu when user choose another tab
            chrome.tabs.onActivated.addListener(function (activeInfo) {
                if (userPrefs.getCtxmenuState()) {
                    activeTabId = activeInfo.tabId;
                    contextMenu.updateInSelectedTab();
                }
            });

            //update menu when user change URL in tab
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                if (userPrefs.getCtxmenuState() && changeInfo.status === 'loading' && tabId === activeTabId) {
                    contextMenu.updateInSelectedTab();
                }
            });
        },

        //Shows Plugin item in context menu
        on: function () {
            ctxMenu.create({
                title: 'AdSanitizer',
                type: 'normal',
                contexts: ['page'],
                id: 'ctxmenu'
            });
            ctxMenu.create({
                title: 'Add to Exceptions z',
                type: 'normal',
                contexts: ['page'],
                id: 'ctxmenuSub',
                parentId: 'ctxmenu',
                onclick: function () {}
            });
            this.isOn = true;
        },

        //Removes Plugin item in context menu
        off: function () {
            ctxMenu.removeAll();
            this.isOn = false;
        },

        //Updates menu in currently opened tab 
        updateInSelectedTab: function () {
            var contextMenu = this;
            chrome.tabs.getSelected(null, function (tab) {
                //Check if current site is acceptable for whitelist. If not - menu item removes
                var isUrlAcceptable = contextMenu.isUrlAcceptable(tab.url);
                if (isUrlAcceptable && !contextMenu.isOn){
                    contextMenu.on();
                }else if (!isUrlAcceptable && contextMenu.isOn) {
                    contextMenu.off();
                }
                
                //If URL is good, then update menu
                if (contextMenu.isOn) {
                    var hostName = URI.parse(tab.url).host;
                    contextMenu.updateAccordingSite(hostName);
                }
            });
        },

        //Updates menu depending on currently opened site domain
        updateAccordingSite: function (hostName) {
            var contextMenu = this;
            var isSiteWhitelisted = userPrefs.isSiteWhitelisted(hostName);
            //If it's in whitelist, then set "Remove" item
            if (isSiteWhitelisted) { 
                ctxMenu.update('ctxmenuSub', {
                    title: 'Remove from Exceptions',
                    onclick: function () { 
                        userPrefs.removeSiteFromWhitelist(hostName);
                        contextMenu.updateAccordingSite(hostName);
                    }
                });
            //If it isn't in whitelist, then set "Add" item
            } else {
                ctxMenu.update('ctxmenuSub', {
                    title: 'Add to Exceptions',
                    onclick: function () {
                        userPrefs.addSiteToWhitelist(hostName);
                        contextMenu.updateAccordingSite(hostName);
                    }
                });
            }
        },

        //checks if current site can be added to whitelist
        isUrlAcceptable: function (url) {
            var res = /^chrome/.test(url);
            return !res;
        }
    }

return exports;

});
