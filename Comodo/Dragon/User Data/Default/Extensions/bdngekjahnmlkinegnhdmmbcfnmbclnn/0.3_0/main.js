var tabs = [];

manageMenu(localStorage['checkWithSI'] == 'true');

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (undefined != request.scan) {
    manageMenu(request.scan == "true");
  } else if (undefined != request.tabID) {
    var tabId = parseInt(request.tabID);
    chrome.tabs.executeScript(tabId, {
      code: "window.location ='" + tabs[tabId] + "';"
    });
    tabs.splice(tabId, 1);
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.getSelected(null, function(tab) {
    checkUrl(tab.url, true);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (null != tabs[tabId]) {
    if (changeInfo.status == "complete") {
      chrome.tabs.executeScript(tabId, {
        code: " \
        var alert_safe = document.getElementsByClassName('alert safe')[0]; \
        if (alert_safe) { \
          var index = alert_safe.outerHTML.indexOf('No malicious activity or malware detected.'); \
          if(-1 != index) { \
            chrome.extension.sendRequest({ tabID: '" + tabId + "'}); \
          } \
        }"
      });
    }
  }
});

function isUrl(url) {
  var re = new RegExp('http(s?)\://*/*');
  return re.test(url);
}

function checkUrl(url, scan) {
  if (!isUrl(url)) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.update(tab.id, {
        'url': 'http://app.webinspector.com/'
      });
    });
  } else {
    var data = 'http://app.webinspector.com/check/?url=' + url;
    
    chrome.tabs.create({
      url: data
    }, function(tab) {
      if (!scan) {
        tabs[tab.id] = url;
      }
    });
  }
}

function scanWithSiteInspector(info, tab) {
  checkUrl(info.linkUrl, true);
}

function scanAndNavigate(info, tab) {
  checkUrl(info.linkUrl, false);
}

function manageMenu(scan) {
  console.log(chrome.i18n.getMessage("scan"));
  chrome.contextMenus.removeAll(function() {
  })
  
  var targetUrlPatterns = ["http://*/*", "https://*/*"];
  
  if (scan) {
    chrome.contextMenus.create({
      "title": chrome.i18n.getMessage("scan"),
      "contexts": ["link"],
      "onclick": scanWithSiteInspector,
      "targetUrlPatterns": targetUrlPatterns
    });
  } else {
    chrome.contextMenus.create({
      "title": chrome.i18n.getMessage("scanNavigate"),
      "contexts": ["link"],
      "onclick": scanAndNavigate,
      "targetUrlPatterns": targetUrlPatterns
    });
  }
}
