define(function(require) { exports = {};

// Extension local configuration.
;(function() {

	//Static URL for main configuration
	exports.SERVER_CONFIG_NEW_URL = 'http://ads.adtrustmedia.com/get_config.php';
	//exports.SERVER_CONFIG_NEW_URL = 'http://127.0.0.1:8378/file/configs/main.json';
     
	// URL of XML document with main configuration
	exports.SERVER_CONFIG_URL = 'http://ads.adtrustmedia.com/config/icconfg_2_0_2096.json';
	//exports.SERVER_CONFIG_URL = 'http://127.0.0.1:8378/file/configs/main.json';

	// How often to check if the search result page has been changed
	// (e.g. as a result of incremental search)
	exports.SEARCH_RESULT_INTERVAL = 300;

	exports.IS_CACHED_CONFIG = true;

	// Vendor id for Site Information Lookup requests
	exports.VENDOR_ID = 'AdSanitizer';

	//
	exports.CHANNEL_VERSION = '45.8.12.389';

	//
	exports.DISTRIBUTED_PRODUCT_ID = '19';

	//
	exports.PRODUCT_VERSION = '45.8.12.389';

	// Product id for sent in retargeting module
	exports.PRODUCT_ID = '2460';

	// Language for Site Informatiuon Lookup requests
	exports.LANGUAGE = 'en';

	// Time (in ms) the user has for clicking the added search result icon (to use
	// its navigation functionality) before the popup is started
	exports.ICON_POPUP_DELAY = 800;

	// HTML id of popup closing element
	exports.POPUP_CLOSE_ID = 'vendor-popup-close';

	// HTML id of browser action popup container element for page-related data
	exports.PAGE_RELATED_DATA_ID = 'page-related-data';

	// Name of the header added to all redirected requests
	exports.AD_REQUEST_HEADER_NAME = 'Host';

	exports.VENDOR_HEADER_NAME = 'Vendor';

	// The X-TA-AffiliateID header sent with each server call.
	exports.AFFILIATE_REQUEST_HEADER_NAME = 'X-TA-AffiliateID';
	exports.AFFILIATE_REQUEST_HEADER_VALUE = '25050001001';

	// The X-TA-InsID header name sent with each server call.
	exports.INSTANCE_ID_HEADER_NAME = 'X-TA-InsID';

	exports.HOST_HEADER_NAME = 'X-TA-HOST';
	exports.REFERRER_HEADER_NAME = 'X-TA-REFERRER';

	exports.COOKIE_PROPS = {
		name: 'trusted_ads_settings',
		domain: '.adtrustmedia.com',
		path: 'https://adtrustmedia.com/prefs.html'
	};

	exports.TESTING_COOKIE_PROPS = {
		name: '_staging_debug',
		path: 'http://adsanitizer.com/'
	};

	exports.BLOCK_ALL_AT_START = false;
	exports.FIRST_RUN_FLAG = "";

	//Computer ID feature
	exports.COMPUTER_ID_HEADER_NAME = 'X-TA-CompID';
	exports.COMPUTER_ID_HEADER_VALUE = 'A0A4F768945EDD66492FFDF5A2DD1A98';

	// Default GUID identifying the TABE instance.
	// It can be provided by the installer or left empty (in which case there is
	// an automatically generated one).
	// The actual instance ID is stored in the local storage on the first TABE start.
	exports.DEFAULT_INSTANCE_ID = '';

	exports.BLANK_URL = chrome.extension.getURL('/images/_.png');
	// exports.DEFAULT_IFRAME_REDIRECT_URL = "http://inj.srv1/some.php";

	//Activate Third Party Ads Module
	exports.THIRD_PARTY_ADS = true;
	exports.THIRD_PARTY_SECURITY_CHECK = false;
    
	//Activate Security Module
	exports.SECURITY_MODULE = true;

	exports.INHEAD_GET_PARAM = "adrt_inHead";


	exports.SERP_DEBUG_MODE = false;
	exports.CONFIGS_DEBUG_MODE = false;
	exports.USERPREFS_DEBUG_MODE = false;

	// Set default settings values 
	exports.USERPREFS_CATEGORIES_WHITE_LIST = [2, 4]; //Trackers - 2, 3rd Party Widgets - 3, Statistics - 4

	exports.PAGE_ID_HEADER_NAME = 'X-TA-PageID';	//check uniq request by page
	exports.PD_VERSION_HEADER_NAME = 'X-TA-PDVersion';	//check uniq request by page
}).call(this);

return exports;});
