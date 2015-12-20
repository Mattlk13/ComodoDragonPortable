function mgOpenPanel() {
    var doc = gBrowser.contentDocument; //Gets the current document.
    var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(doc); //get our browser by doc
    var tab = gBrowser.tabContainer.childNodes[targetBrowserIndex]; //get tab from browser

    Popup.DisplayCMGList(mediaActions.tabsWithVids[tab.linkedPanel], tab.linkedPanel); //display the media details in popup
}
/* gets the size of an object*/
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
            if (mediaActions.tabsWithVids[thisTabId][0].tabUrl === thisTabUrl) {
                /* activates the extension icon */
                mediaActions.setIcon("found", thisTabId);

            } else {
                mediaActions.setIcon("notFound", thisTabId);
                /*initiate the tabs with vids for this tab */
                mediaActions.tabsWithVids[thisTabId] = new Array();
                /*check what type of detection should be applied*/
                mediaActions.applySpecificMethod(thisTabId, thisTabUrl);

            }

        } else {

            mediaActions.setIcon("notFound", thisTabId);
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
        if (indexOfYoutube >= 0 || indexOfDailymotion >= 0 || indexOfVimeo >=0) {
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
            MGGeneric.init(thisTabId);
        }
    },
    setIcon: function(state) {
        /*gets the extension icon element*/
        var button = document.getElementById("MediaGrabberButton");
        if (state === "found") {
            /*if the state is found, activate the extension icon and make it red for this tab*/
            if (button.getAttribute("disabled") === "true") {
                button.setAttribute("disabled", false);
            }
            button.setAttribute("image", "resource://MGlogos/icon2.png");
        } else if (state === "notFound") {
            /*if the state is not found deactivate the extension icon and make it gray */
            if (button.getAttribute("disabled") === "false") {
                button.setAttribute("disabled", true);
            }
            button.setAttribute("image", "resource://MGlogos/icon1.png");
        }
    },
    initYoutubeGrabber: function(thisTabId, thisTabUrl) {
        /*triggers the first method of the youtube class*/
        Youtube.checkForYoutubeObject(thisTabId, thisTabUrl);
    },
    initDailymotionGrabber: function(thisTabId, thisTabUrl) {
        /*triggers the first method of the dailymotion class*/
        Dailymotion.checkForDailymotionObject(thisTabId, thisTabUrl);
    },
    initVimeoGrabber: function(thisTabId, thisTabUrl){
        /*triggers the first method of the vimeo class*/
        Vimeo.checkForVimeoObject(thisTabId, thisTabUrl);
    },
    disableBrowserAction: function() {
        /*disables the extension icon*/
        var button = document.getElementById('MediaGrabberButton');
        button.setAttribute("disabled", true);
    },
    downloadVideo: function(title, type, url) {
        /*function to iniate the download with the specific details*/
        var doc = gBrowser.contentDocument;
        var file = this.getFileToDownload(title, type, doc);
        if (!file)
            return;
        var persist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Components.interfaces.nsIWebBrowserPersist);
        var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
        var uri = ios.newURI(url, null, null); // source - the link of the file to download
        var target = ios.newFileURI(file); // target - the location (where to save the file)
        var xfer = Components.classes["@mozilla.org/transfer;1"].createInstance(Components.interfaces.nsITransfer);
        var privacyContext = doc.defaultView.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIWebNavigation)
                .QueryInterface(Components.interfaces.nsILoadContext);
        xfer.init(uri, target, "", null, null, null, persist, false);
        persist.progressListener = xfer;
        persist.saveURI(uri, null, null, null, null, file, privacyContext);
    },
    getFileToDownload: function(filename, fileType, doc) {
        /*sets the details to the file that will be download*/
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(doc.defaultView, "Save As", nsIFilePicker.modeSave);
        fp.defaultString = filename;
        fp.appendFilter(fileType, "*." + fileType);
        var rv = fp.show();
        if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
            var file = fp.file; // location - where to save
            return file;
        }
        return null;
    },
    setFileSize: function(thisTabId, url, vidIndx) {
        /*makes a request to the url, gets only the head and parse it to get the content-length which then is transformed
         * from bytes to mb and added to the media details
         * */
        var ul = document.getElementById('embedList');
        var xhReq = new XMLHttpRequest();
        xhReq.open("HEAD", url, true);

        xhReq.onreadystatechange = function() {
            try {
                if (this.status == 200 && this.readyState == 2) {
                    var bytes = this.getResponseHeader("Content-Length");
                    var mb = Math.floor(bytes * 100 / 1024 / 1024) / 100;
                    var thisSize = mb + "MB";
                    //add to array
                    mediaActions.tabsWithVids[thisTabId][vidIndx].fileSize = thisSize;
                    //show in popup
                    var liArray = ul.childNodes;
                    var liobj = liArray[vidIndx];
                    var liobjdivs = liobj.childNodes;
                    var liobjdiv = liobjdivs[0];
                    var sizespans = liobjdiv.childNodes;
                    var sizespan = sizespans[1];
                    var thismb = document.createTextNode(thisSize);
                    while (sizespan.hasChildNodes())
                    {
                        sizespan.removeChild(sizespan.lastChild);
                    }
                    sizespan.appendChild(thismb);
                }
            }
            catch (e) {
            }
        };
        xhReq.send(null);
    }

};
var tabActions = {
    tabsUrls: new Object(),
    /*handles the tab selected event*/
    onTabSelected: function(ttab) {
        var uri = ttab.currentURI;
        var url = uri.spec;
        var doc = ttab.document;
        var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(doc);
        var tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
        var tabID = tab.linkedPanel;
        if (this.tabsUrls.tabID == undefined || this.tabsUrls.tabID == null || this.tabsUrls.tabID !== url) {
            this.tabsUrls.tabID = url;
        }

        mediaActions.initialCheck("activated", tabID, url);

    },
    onNewTab: function(event) {
        /*handles the new tab event*/
        var browser = gBrowser.getBrowserForTab(event.target);
        browser.addProgressListener(
                MGPROGlistener);

    },
    onTabRemoved: function(event) {
        /*handles the remove tab event*/
        var thisTab = event.target;
        var thisTabId = thisTab.linkedPanel;
        mediaActions.tabsWithVids[thisTabId] = new Array();
    },
    getTabById: function(id) {
        /*get the tab id */
        var num = gBrowser.browsers.length; //length of the global gbrowser array
        for (var i = 0; i < num; i++) { //for every browser
            var b = gBrowser.getBrowserAtIndex(i); //b- the browser at the index
            var doc = b.contentDocument; //document from this browser
            var targetBrowserIndex = gBrowser.getBrowserIndexForDocument(doc); //get the target browser
            var tab = gBrowser.tabContainer.childNodes[targetBrowserIndex]; //gets the tab
            if (tab.linkedPanel === id) { //tab id
                return b;
            }
        }
    },
    getTabTitle: function(id, arrSize, fileType) {
        /*get the tab title from the page by searching the title tag*/
        var vidInd;
        if (arrSize === 0) {
            vidInd = 0;
        } else {
            vidInd = arrSize - 1;
        }

        var thisTab = this.getTabById(id);
        var doc = thisTab.contentDocument;
        var title = doc.getElementsByTagName("title")[0].innerHTML;
        title = title.replace(/\s*\-\s*YouTube$/i, '').replace(/[#"\?:\*]/g, '').replace(/[&\|\\\/]/g, '_').replace(/'/g, '\'').replace(/^\s+|\s+$/g, '').replace(/\.+$/g, '');
        mediaActions.tabsWithVids[id][vidInd].title = title + "." + fileType;

    }


};

var MGGeneric = {
    /*the init of the generic method*/
    tabId: 0,
    init: function(tabId) {
        this.tabId = tabId;
        /*adds obeserver for the request comming from the site*/
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.addObserver(this, 'http-on-examine-response', false);
    },
    observe: function(aSubject, aTopic, aData) {
        /*handles the requests from the website and triggers check for object function */
        var details = new Object();
        var httpChannel = aSubject.QueryInterface(Components.interfaces.nsIHttpChannel);
        var notificationCallbacks;
        if (httpChannel.notificationCallbacks) {
            notificationCallbacks = httpChannel.notificationCallbacks;
        } else {
            notificationCallbacks = aSubject.loadGroup.notificationCallbacks;
        }

        if (notificationCallbacks && notificationCallbacks !== null) {
            var interfaceRequestor = notificationCallbacks
                    .QueryInterface(Components.interfaces
                            .nsIInterfaceRequestor);

            var domWindow = interfaceRequestor.getInterface(Components.interfaces.nsIDOMWindow);

            var chromeWindow = window.QueryInterface(Ci.nsIInterfaceRequestor)
                    .getInterface(Ci.nsIWebNavigation)
                    .QueryInterface(Ci.nsIDocShellTreeItem)
                    .rootTreeItem
                    .QueryInterface(Ci.nsIInterfaceRequestor)
                    .getInterface(Ci.nsIDOMWindow);

            var targetBrowserIndex = chromeWindow.gBrowser.getBrowserIndexForDocument(domWindow.top.document);
            var tab = gBrowser.tabContainer.childNodes[targetBrowserIndex];
            if (tab && tab !== undefined) {
                var tabId = tab.linkedPanel; //if tab defined

                if (tabId === this.tabId) {
//                    console.log("-->Check this out for tab: " + tabId);
                    details.tabId = tabId;
                    details.responseHeaders = httpChannel;
                    Generic.checkForObject(details);
                }
            }

        }
    }
};
/*handles the browser quit event*/
var MGQuitApp = {
    observe: function(aSubject, aTopic, aData) {
        var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
        observerService.removeObserver(httpObs, 'http-on-examine-response', false);
    }
};
/*adds the listener for load event*/
window.addEventListener("load", function() {
    gBrowser.addProgressListener(
            MGPROGlistener);
}, false);

/*adds listener and handles location change event*/
var MGPROGlistener = {
    QueryInterface: XPCOMUtils.generateQI(["nsIWebProgressListener",
        "nsISupportsWeakReference"]),
    onLocationChange: function(tab) {
        tabActions.onTabSelected(tab);

    }
};

var container = gBrowser.tabContainer; //the container of global gbrowser
/*adds listener for tab close event*/
container.addEventListener("TabClose", tabActions.onTabRemoved, false);
/*adds listener for tab oepn event*/
container.addEventListener("TabOpen", tabActions.onNewTab, false);
/*adds obeserver for browser quit event*/
var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
observerService.addObserver(MGQuitApp, 'browser-lastwindow-close-requested', false);

