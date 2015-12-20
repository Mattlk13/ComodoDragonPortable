/*function to get the size of an object */
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            size++;
    }
    return size;
};

var mediaActions = {
    /*initiate the tabs with vide object */
    tabsWithVids: new Object(),
    tabUrl: "",
    initialCheck: function(method, thisTabId, thisTabUrl) {
        /* in the initial state, the extension icon is disabled*/
        mediaActions.disableBrowserAction(thisTabId);
        /* check if there already exists some media details for the tab it in the parameters */
        if (mediaActions.tabsWithVids[thisTabId] !== undefined && mediaActions.tabsWithVids[thisTabId] !== null && Object.size(mediaActions.tabsWithVids[thisTabId]) > 0) {
            /* checks the tipe of actions that has occured -- refresh or new url*/
            if (method === "activated") {
                /* activates the extension icon */
                mediaActions.setIcon("found", thisTabId);
            } else if (method === "updated") {
                if (mediaActions.tabsWithVids[thisTabId][0].tabUrl === thisTabUrl) {
                    mediaActions.setIcon("found", thisTabId);
                } else {
                    mediaActions.setIcon("notFound", thisTabId);
                    /*initiate the tabs with vids for this tab */
                    mediaActions.tabsWithVids[thisTabId] = new Array();
                    mediaActions.applySpecificMethod(thisTabId, thisTabUrl);
                }
            }
        } else {
            mediaActions.setIcon("notFound", thisTabId);
            /*check what type of detection should be applied*/
            mediaActions.applySpecificMethod(thisTabId, thisTabUrl);
        }
    },
    applySpecificMethod: function(thisTabId, thisTabUrl) {
        /* defines the strings that identifies the website  */
        var yString = "youtube.com/watch?v=";
        var dString = "dailymotion.com";
        var vString = "vimeo.com";
        /* checks if any of these strings is found in the url  */
        var indexOfYoutube = thisTabUrl.indexOf(yString);
        var indexOfDailymotion = thisTabUrl.indexOf(dString);
        var indexOfVimeo = thisTabUrl.indexOf(vString);
        /* if so, iniatiates the propper detection method or the generic one if different
         * */
        if (indexOfYoutube >= 0 || indexOfDailymotion >= 0 || indexOfVimeo >= 0) {
            if (chrome.webRequest.onHeadersReceived.hasListener(
                    Generic.checkForObject)) {
                chrome.webRequest.onHeadersReceived.removeListener(
                        Generic.checkForObject
                        );
            }
            if (indexOfYoutube >= 0) {
                mediaActions.tabUrl = thisTabUrl;
                mediaActions.initYoutubeGrabber(thisTabId, thisTabUrl);
            }
            if (indexOfDailymotion >= 0) {
                mediaActions.tabUrl = thisTabUrl;
                mediaActions.initDailymotionGrabber(thisTabId, thisTabUrl);
            }
            if (indexOfVimeo >= 0) {
                mediaActions.tabUrl = thisTabUrl;
                mediaActions.initVimeoGrabber(thisTabId, thisTabUrl);
            }
        } else {
            mediaActions.tabUrl = thisTabUrl;
            mediaActions.initGrabber();
        }
    },
    setIcon: function(state, thisTabId) {
        if (state === "found") {
            /*if the state is found, activate the extension icon and make it red for this tab*/
            chrome.browserAction.setIcon({path: "images/icon2.png"}, function(result) {
                chrome.browserAction.enable(thisTabId);
            });
        } else if (state === "notFound") {
            /*if the state is not found deactivate the extension icon and make it gray */
            chrome.browserAction.setIcon({path: "images/icon1.png"}, function(result) {
                chrome.browserAction.disable(thisTabId);
            });

        }

    },
    initGrabber: function() {
        /*triggered as a first step of the generic method, it adds listeners for request coming from the website */
        chrome.webRequest.onHeadersReceived.addListener(Generic.checkForObject, {
            urls: ["<all_urls>"],
            types: ["object", "xmlhttprequest", "other"]
        }, ["blocking", "responseHeaders"]);

    },
    initYoutubeGrabber: function(thisTabId, thisTabUrl) {
        /*triggers the first method of the youtube class*/
        Youtube.checkForYoutubeObject(thisTabId, thisTabUrl);
    },
    initDailymotionGrabber: function(thisTabId, thisTabUrl) {
        /*triggers the first method of the dailymotion class*/
        Dailymotion.checkForDailymotionObject(thisTabId, thisTabUrl);
    },
    initVimeoGrabber: function(thisTabId, thisTabUrl) {
        /*triggers the first method of the vimeo class*/
        Vimeo.checkForVimeoObject(thisTabId, thisTabUrl);
    },
    sendObjectToPopup: function() {
        /*gets the current tab and sends a message with the media object to that tab*/
        chrome.tabs.query(
                {currentWindow: true, active: true},
        function(tabArray) {
            var tab = tabArray[0];
            var thisTabId = tab.id;
            chrome.runtime.sendMessage(null, {method: "PopupResponse", arguments: mediaActions.tabsWithVids[thisTabId], tabId: thisTabId, directCall: 1}, function() {
            });
        }
        );
    },
    tryToGetTitle: function(thisTabId, arrSize, fileType) {
        /*sends a message to the tab with the specified id to look for the title in the page*/
        if (arrSize === 0) {
            var vidInd = 0;
        } else {
            var vidInd = arrSize - 1;
        }
        chrome.tabs.sendMessage(thisTabId, {method: "addTitle", vidIndex: vidInd, fileType: fileType});
    },
    disableBrowserAction: function(thisTabId) {
        /*disables the extension icon*/
        chrome.browserAction.disable(thisTabId);
    }

};

/*adds listener for tab activation */
chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(thisTab) {
        mediaActions.initialCheck("activated", thisTab.id, thisTab.url);
    });
});

/*adds listener for tab update / refresh*/
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    mediaActions.initialCheck("updated", tab.id, tab.url);
}, false);

/*adds listener fot tab remove */
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    if (mediaActions.tabsWithVids[tabId]) {
        delete mediaActions.tabsWithVids[tabId];
        //delete mediaActions.tabsLoaded[tabId];
    }

});
/*handles messages comming to the background script*/
chrome.extension.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method === 'PopupPing') {
                mediaActions.sendObjectToPopup();
            } else if (request.method === 'DownloadVideo') {
                try {
                    /* intiates the download with the requested details*/
                    chrome.downloads.download({url: request.arguments.url, filename: request.arguments.title}, function(result) { /**/
                    });
                } catch (e) {
                    alert(e);
                }
            } else if (request.method === 'setTitle') {
                /*gets message from content script and triggers setTitle */
                videoObj.setTtitle(sender.tab.id, request.title, request.vidIndex);
            } else if (request.method === 'setSizeInArray') {
                mediaActions.tabsWithVids[request.arguments.tabId][request.arguments.vidIndx]["fileSize"] = request.arguments.size;
            }
            return true;
        }
);

function open_help_first_time() {
    var key = "NotTheFirstRunOfComodoMediaDownloader";
    chrome.storage.local.get(key, function(data) {
        var thisReturn = data[key];
        if (!thisReturn || thisReturn != true) {
            var value = true;
            var myobj = {};
            myobj[key] = value;
            chrome.storage.local.set(myobj, function() {
//                console.log("first time");
            });
            var help_url = "http://help.comodo.com/topic-120-1-279-6885-Using-Media-Downloader--to-Download-Streaming-Media.html";
			// https://help.comodo.com/topic-249-1-593-7581-Using-Media-Downloader-to-Download-Streaming-Media.html (ChromiumSecure MD help URL)
            chrome.tabs.create({url: help_url, active: false});
        }
    });
}

//open_help_first_time(); This is commented out since now help url is triggered by browser.