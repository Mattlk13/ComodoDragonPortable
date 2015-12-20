define(function (require) { 
    var  exports = {};

(function () {
    var localConfig = require('./localConfig');
    var configLoader = require('./configLoader');
    var bgUtils = require('./backgroundUtils');
    var listeners = require('./listeners');
    var affiliateHeaderName = localConfig.AFFILIATE_REQUEST_HEADER_NAME;
    var affiliateHeaderValue = localConfig.AFFILIATE_REQUEST_HEADER_VALUE;
    var testingCookieProps = localConfig.TESTING_COOKIE_PROPS;
    var instanceIdHeaderName = localConfig.INSTANCE_ID_HEADER_NAME;
    var defaultInstanceId = localConfig.DEFAULT_INSTANCE_ID;
    var serverConfigURL = localConfig.SERVER_CONFIG_URL;
    var serverConfigNewURL = localConfig.SERVER_CONFIG_NEW_URL;
    var Session = require('./backgroundSession').Session;
    var serpInjector = require('./serpInjector').serpInjector;
    var messageDispatcher = require('./messaging').MessageDispatcher;
    var WebRequestInspector = require('./webRequestInspector').WebRequestInspector;

    //if setup changed First Run Flag value then localstorage must be cleared
    bgUtils.checkFirstRunFlag();

    Session.serverConfigURL = serverConfigNewURL ? serverConfigNewURL : serverConfigURL;
    Session.computerId = bgUtils.getComputerId();
    Session.extVersion = bgUtils.getExtVersion();
    Session.affiliateId = affiliateHeaderValue;
    Session.productId = bgUtils.getProductId();
    Session.channelVersion = localConfig.CHANNEL_VERSION;
    Session.distributedProductId = localConfig.DISTRIBUTED_PRODUCT_ID;
    Session.productVersion = localConfig.PRODUCT_VERSION;
    
    //checking of testing mode cookie
    chrome.cookies.get({url: testingCookieProps.path, name: testingCookieProps.name}, function (cookie) {
        if (cookie) {
            Session.testingMode = true;
            Session.serverConfigURL = cookie.value;
        }
        //MODULES
        var RetargetingModule = require('./retargeting_module');
        var PluginRequestModule = require('./pluginrequest_module');
        var SuggestionModule = require('./suggestion_module');
        var ThirdPartyAdsModule = require('./thirdpartyads_module');
        var webRequestInspector; // web request inspector

        Session.serpInjector = serpInjector;

        // GUID generation adapted from backbone-localstorage -
        // http://documentcloud.github.com/backbone/docs/backbone-localstorage.html
        function S4 () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        
        // instance_id persistence
        var storage = salsita.localStorage;

        Session.instanceId = storage.getItem('instance_id');

        if (typeof(Session.instanceId) === "undefined") {
            // Assuming the first TABE start. We need to generate & store GUID.
            Session.instanceId = defaultInstanceId === '' ? S4() + S4()+ "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4() : defaultInstanceId;
            storage.setItem('instance_id', Session.instanceId);
        }

        // Headers functionality
        $.ajaxSetup({
            'beforeSend': function (xhr) {
                xhr.setRequestHeader(affiliateHeaderName, affiliateHeaderValue);
                xhr.setRequestHeader(instanceIdHeaderName, Session.computerId);
            }
        });

        messageDispatcher.backgroundInstall();

        Session.installTabHandlers();

        Session.retargetingModule = new RetargetingModule(Session.computerId);
        Session.pluginRequestModule = new PluginRequestModule();
        Session.suggestionModule = new SuggestionModule();
        Session.thirdPartyAdsModule = new ThirdPartyAdsModule();

        listeners.handle();

        webRequestInspector = new WebRequestInspector(Session.computerId);
        webRequestInspector.start();

        configLoader.init(webRequestInspector);
    });

}).call(this);

return exports;

});