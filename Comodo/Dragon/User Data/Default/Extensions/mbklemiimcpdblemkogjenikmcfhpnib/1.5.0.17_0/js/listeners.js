define(function (require) { 

    var exports = {};

    var Session = require('./backgroundSession').Session;
    var bgUtils = require('./backgroundUtils');

    var Listeners = {
        handle: function () {
            chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                bgUtils.badgeTextOnTabUpdateHandler(tabId, changeInfo, tab);
                Session.suggestionModule.onTabUpdateHandler(changeInfo);
            });

            chrome.tabs.onHighlighted.addListener(function (highlightInfo) {
                bgUtils.badgeTextOnTabHighlightedHandler(highlightInfo);
            });

            chrome.tabs.onActivated.addListener(function (activeInfo) {
                Session.suggestionModule.onTabActivateHandler();
            });
        }

    }

    exports = Listeners;

return exports;

});
