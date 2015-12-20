//popup clicked.
chrome.tabs.getSelected(undefined, function(tab) {
	tabSelected = tab;
	chrome.runtime.sendMessage({method:"green", tab:tabSelected },function(response)
	{ 
		if(response=="green")
		{
			domainboxHandler(1);
		}
	});
});

// Functions
function domainboxHandler(action) {
	var action = typeof action !== 'undefined' ? action : 0; // Default: redetect
	var domain = $('#domain').text();
	var scheme = $('#protocol').text().toLowerCase();

	var parts = domain.split('.');
	var length = domain.split('.').length;

	if(action == 5 && length==3)
	{
		domain= parts.slice(-2).join('.');
		action = 1;
	}

	chrome.extension.sendMessage({a:'domainAction', domain:domain, action:action, tab:tabSelected}, function(response) {
		switch(action) 
		{
			case 0: // Redetect
				break;
			case 1: // Whitelist
				if(scheme=='http') chrome.tabs.update(tabSelected.id, {url:'https://'+tabSelected.url.substr(7)});
				break;
			case 2:
				break;
		}			
		tabUpdate();
	});
	return false;
}


function domainboxHandlerEnforce() {
	domainboxHandler(1);
}

function domainboxHandlerSubdomainEnforce() {
	domainboxHandler(5);
}

function done() {
	window.close();
}
function domainboxHandlerIgnore() {
	domainboxHandler(2);
	chrome.tabs.getSelected(undefined, function(tab) {
		tabSelected = tab;
		chrome.runtime.sendMessage({method:"gray", tab:tabSelected },function(response){ });
	});
	window.close();
}

function tabUpdate() {
	chrome.tabs.getSelected(undefined, function(tab) {
		tabSelected = tab;
		var urlSplit = tab.url.toLowerCase().match('^(https?)://([a-z0-9-.]+)/');
		$('#domain').text(urlSplit ? urlSplit[2] : 'Special page');
		$('#protocol').text(urlSplit ? urlSplit[1].toUpperCase() : 'N/A');
	});
}
$(tabUpdate);

// Init
var tabSelected;

document.addEventListener('DOMContentLoaded', function () {
	document.querySelector('#domainboxForm').addEventListener('submit', domainboxHandler);
	document.querySelector('#buttonEnforce').addEventListener('click', domainboxHandlerSubdomainEnforce);
	document.querySelector('#buttonIgnore').addEventListener('click', domainboxHandlerIgnore);
	document.querySelector('#done').addEventListener('click', done);
});


