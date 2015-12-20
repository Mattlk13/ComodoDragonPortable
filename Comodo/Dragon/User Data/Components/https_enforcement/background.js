
if (chrome.extension.inIncognitoContext) {
    doReplaceRules();
} else {
    chrome.runtime.onInstalled.addListener(doReplaceRules);
}
function doReplaceRules() {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'https' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {  schemes: ['https']},
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
}


chrome.runtime.onMessage.addListener(function(message,sender,sendResponse)
{
	if(message.method == "green")
	{
		genericTabSelected(function (tab)
		{
			tabSelected = tab;
			chrome.pageAction.setIcon({tabId: tabSelected.id, path: 'https_enforced.png'});
			chrome.pageAction.setTitle({tabId: tabSelected.id, title: 'Secure connections enforced'});
		});
		sendResponse("green");
		return true;
	}
	else if(message.method == "gray")
	{
		genericTabSelected(function (tab)
		{
			tabSelected = tab;
			chrome.pageAction.setIcon({tabId: tabSelected.id, path: 'https_enforce.png'});
			chrome.pageAction.setTitle({tabId: tabSelected.id, title: 'Enforce secure connections'});
		});
		sendResponse("gray");
		return true;
	}
});


// Init
var autoBlacklist = typeof(localStorage.autoBlacklist)=='undefined' ? [] : JSON.parse(localStorage.autoBlacklist);
var autoWhitelist = typeof(localStorage.autoWhitelist)=='undefined' ? [] : JSON.parse(localStorage.autoWhitelist);
var domainsDetecting = [];

// Functions
function in_array(needle, haystack) {
	for(key in haystack) 
		if(haystack[key]==needle) 
			return true;
	return false;
}
function domainChange(domain, action) { // 0: remove, 1:, whitelist, 2: blacklist
	if (action == 5)
		action =1;
	if(action<2 && in_array(domain, autoBlacklist)) {
		autoBlacklist.splice(autoBlacklist.indexOf(domain), 1);
		
		var parts = domain.split('.');
		var length = domain.split('.').length;
		var sndleveldomain = parts.slice(-2).join('.');
		if(length == 3)
			autoBlacklist.splice(autoBlacklist.indexOf(sndleveldomain), 1);
		localStorage.autoBlacklist = JSON.stringify(autoBlacklist);

	}
	if(action!=1 && in_array(domain, autoWhitelist)) {
		autoWhitelist.splice(autoWhitelist.indexOf(domain), 1);
		localStorage.autoWhitelist = JSON.stringify(autoWhitelist);
	}
	
	var listID = ['autoWhitelist', 'autoBlacklist'][action-1];
	if(action>0 && !in_array(domain, window[listID])) {
		window[listID].push(domain);
		localStorage[listID] = JSON.stringify(window[listID]);
	}
}

function domainCheck(domain) {
	if(in_array(domain, autoWhitelist)) 
		return true;
	return false;
}

var genericTabSelected = function(callback)
{
	chrome.tabs.getSelected(null, function (tab)
 	{
 		callback(tab);
 	});
};

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	var retval = {};
	if( details.type=='main_frame') {
		var url = (new RegExp('^http://([^/@]+@)?([^/@]+)/(.*)').exec(details.url));
		var domain = url[2];

		var parts = domain.split('.');
		var length = domain.split('.').length;
		var sndleveldomain = parts.slice(-2).join('.');
		
		if(domainCheck(domain))
			retval = { redirectUrl: 'https://' + details.url.substr(7) }; // Redirect the requested domain
		if(length == 3 && domainCheck(sndleveldomain))
			retval = { redirectUrl: 'https://' + details.url.substr(7) }; // Redirect the requested domain
	}
	return retval;
}, {urls:['http://*/*']}, ['blocking']);



chrome.webRequest.onCompleted.addListener(function (details) {

	if( details.type=='main_frame') {
		var url = details.url;
		var url = (new RegExp('^https://([^/@]+@)?([^/@]+)/(.*)').exec(details.url));
		var domain = url[2];
		var parts = domain.split('.');
		var length = domain.split('.').length;
		var sndleveldomain = parts.slice(-2).join('.');
		
		if(domainCheck(domain)){
				setTimeout(function(){chrome.pageAction.setIcon({tabId: details.tabId, path: 'https_enforced.png'})},100);
				setTimeout(function(){chrome.pageAction.setTitle({tabId: details.tabId, title: 'Secure connections enforced'})},100);
		}
		if (length == 3 && domainCheck(sndleveldomain))
		{
				setTimeout(function(){chrome.pageAction.setIcon({tabId: details.tabId, path: 'https_enforced.png'})},100);
				setTimeout(function(){chrome.pageAction.setTitle({tabId: details.tabId, title: 'Secure connections enforced'})},100);
		}

	}
}, { urls: ["https://*/*"]} );




chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	switch(request.a) {
		case 'clear':
			var listID = ['autoWhitelist','autoBlacklist'][request.listID];
			
			window[listID] = [];
			localStorage[listID] = JSON.stringify(window[listID]);
			sendResponse({});
			break;
		case 'domainAction': // 0: redetect, 1: enforce, 2: ignore, 3: remove
		    {
				domainChange(request.domain, request.action==3 ? 0 : request.action);
				if(request.action == 2){
					var parts = request.domain.split('.');
					var length = request.domain.split('.').length;
					var sndleveldomain = parts.slice(-2).join('.');
					if(length == 3)
						domainChange(sndleveldomain, 2);
				}

				if(request.action==0) 
					domainCheck(request.domain, false);
			}
		sendResponse({});
		break;
	}
});
