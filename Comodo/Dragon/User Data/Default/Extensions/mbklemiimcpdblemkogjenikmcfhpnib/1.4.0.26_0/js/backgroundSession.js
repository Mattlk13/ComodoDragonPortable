define(function( require) {
    var exports = {};

(function() {
    exports.Session = {

        lastDetails: [],

        // Object representing server configuration, loaded as XML from remote site
        CIAAConfigAttrs: {},

        // Mapping of tabId to tab-related data, which is object with following
        // properties:
        // + sendSearchUpdates: false / true
        // + toolbarIcons: toolbar icon information array
        tabInfo: {},

        replaced: {},

        tabLoaded: {},

        retargetingModule: null,

        SERPAdsDeliveryPoint: null,

        serverConfigURL: "",
        testingMode: false,
        computerId: '',
        extVersion: '',
        affiliateId: '',
        productId: '',
        channelVersion: '',
        distributedProductId: '',
        productVersion: '',

        // Data to be displayed in the info popup. We set it here so that the popup
        // can retrieve it when it is ready.
        popupData: null,
        //FIXME: need to rename this varible
        gPTD: {},  //google preload typing data

        getPopupData: function () {
            return this.popupData;
        },

        setPopupData: function (data) {
            this.popupData = data;
        },

        // get value of tabInfo property
        getTabInfoProperty: function (id, key) {
            //FIXME need refactoring body of this method
            return (this.tabInfo[id] || {})[key];
        },

        // set value of tabInfo property
        setTabInfoProperty: function (id, key, value) {
            var newValue = this.tabInfo[id] || {};
            newValue[key] = value;
            this.tabInfo[id] = newValue;
        },

        // remove tabInfo property
        removeTabInfoProperty: function (id, key) {
            if (this.tabInfo[id]) {
                delete this.tabInfo[id][key];
            }
        },

        getAll: function (id){
            console.log("all", this.tabInfo[id]);
        },

        // Id of currently opened tab
        currentTabId: -1,

        // Tab-related handlers
        installTabHandlers: function () {
            var _this = this;

            // When user switches to a new tab

            // Record id of new tab
            function rememberId(tabId) {
                _this.currentTabId = tabId;
            }

            // When a tab gets closed

            // Remove all background data related to the closed tab
            function removeBackgroundData(tabId) {
                delete _this.tabInfo[tabId];
            }

            chrome.tabs.onActivated.addListener(function (activeInfo) {
                rememberId(activeInfo.tabId);
            });

            chrome.tabs.onRemoved.addListener(function (tabId) {
                removeBackgroundData(tabId);
            });

        },

        // Script injection 'execution system' configured by the model from the remote site.
        scriptInjection: null,

        // Feature enabled/disabled states object
        // featuresState['featureX'] == true means "the featureX is enabled"
        featuresState: {},

        // Unique instance ID from the local storage.
        instanceId: '',

        totalBlockCounter: 0,

        inscreaseTotalBlockCounter: function () {
            this.totalBlockCounter++;
        }
    };

}).call(this);

return exports;

});
