var wasUpdatedBySetup = true;

require.config({
    baseUrl: '/js'
});

require(['background'], function () {});

// Check whether new version is installed
chrome.runtime.onInstalled.addListener(function (details) {
    var configLoader = require('./configLoader');
    if (details.reason === 'install') {
        //
    } else if (details.reason === 'update') {
        wasUpdatedBySetup = false;
        //var thisVersion = chrome.runtime.getManifest().version;
        configLoader.loadServerConfigData();
    }
});

