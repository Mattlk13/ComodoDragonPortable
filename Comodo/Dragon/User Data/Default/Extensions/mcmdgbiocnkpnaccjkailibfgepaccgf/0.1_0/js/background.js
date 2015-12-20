function isUrl(url) {
  var re = new RegExp('http(s?)\://*/*');
  return re.test(url);
}

/**
* Disable browser action
*/
function disable() {
  chrome.browserAction.setPopup({
    popup: ''
  });
  chrome.browserAction.setIcon({
    path: 'icons/toolbar_icon_inactive.png'
  });
}

/**
* Enable browser action
*/
function enable() {
  chrome.browserAction.setPopup({
    popup: 'browser_action.html'
  });
  chrome.browserAction.setIcon({
    path: 'icons/toolbar_icon_active.png'
  });
}

function isBrowserActionActive(url) {
  if (!isUrl(url)) {
    disable();
  } else {
    enable();
  }
}

chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (-1 != windowId) {
    chrome.windows.get(windowId, {
      populate: true
    }, function(window) {
      for (var i = 0; i != window.tabs.length; i++) {
        if (window.tabs[i].active) {
          isBrowserActionActive(window.tabs[i].url);
        }
      }
    })
  } else {
    disable();
  }
});

chrome.tabs.getSelected(null, function(tab) {
  isBrowserActionActive(tab.url);
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    isBrowserActionActive(tab.url);
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  isBrowserActionActive(tab.url);
});
