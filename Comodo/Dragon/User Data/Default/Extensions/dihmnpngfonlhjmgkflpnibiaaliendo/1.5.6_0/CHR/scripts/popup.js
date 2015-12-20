/* get size of object */
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            size++;
    }
    return size;
};


function oninit(e) {
    /* send message to the background script*/
    chrome.runtime.sendMessage(null, {method: "PopupPing", arguments: {}, directCall: 1}, function() {
    });
}

/*handles messages comming from the background script*/
chrome.extension.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.method === 'PopupResponse') {
                if (Object.size(request.arguments) > 0) {
                    /* call display list function */
                    DisplayCMGList(request.arguments, request.tabId);
                } else {
                    document.getElementById("embedList").innerHTML = "<li>No videos found...</li>";
                }
            } else if (request.method === 'showTitle') {
                /* gets the title div and replace the content with the new title */
                var ul = document.getElementById("embedList");
                var liArray = ul.getElementsByTagName("li");
                var thisLi = liArray[request.vidIndex];
                if (thisLi) {
                    thisLi.setAttribute("data-title", request.title);
                    var titleSpan = thisLi.getElementsByTagName("div")[1].getElementsByTagName("span")[0];
                    titleSpan.innerHTML = request.title;
                }

            }
            return true;
        });

function DisplayCMGList(arguments, tabId) {
    /* start here <-- get the existing list tag and populates it with the videos from arguments*/
    var videoListSize = arguments.length;
    var lastul = document.getElementById("embedList");
    for (var obj in arguments) {
        var node = document.createElement("LI");

        node.innerHTML = "";
        var attri = document.createAttribute("class");
        attri.value = "videoItem";
        node.setAttributeNode(attri);
        for (var key in arguments[obj]) {
            var att = document.createAttribute("data-" + key);
            att.value = arguments[obj][key];
            node.setAttributeNode(att);
        }
        var objType = arguments[obj]["fileType"];
        var thisTitle = arguments[obj]["title"].substring(0, arguments[obj]["title"].lastIndexOf("."));
        if (thisTitle === "MyMediaFile") {
            /*checks if title is the generic one - meaning that there is no video title yet - and tries to get it again */
            chrome.tabs.query(
                    {currentWindow: true, active: true},
            function(tabArray) {
                var tab = tabArray[0];
                chrome.tabs.sendMessage(tab.id, {method: "SetTitleAgain", vidIntex: obj, fileType: objType});
            }
            );
        }
        node.innerHTML = "<div class='metaDetails'><span class='vidTypePop'>" + objType.toUpperCase() + "</span><span class='vidSizePop'>" + arguments[obj]["fileSize"] + "</span></div>";

        if (arguments[obj]["resolution"] && arguments[obj]["resolution"] !== "") {
            node.innerHTML = node.innerHTML + "<div class='vidTitlePop'><span class='theTitle'>" + arguments[obj]["title"] + "</span><span class='theResolution'>" + arguments[obj]["resolution"] + "</span></div>";
        } else {
            node.innerHTML = node.innerHTML + "<div class='vidTitlePop'><span class='theTitle'>" + arguments[obj]["title"] + "</span></div>";
        }
        node.innerHTML = node.innerHTML + "</div>";
        lastul.appendChild(node);
        /*checks if filesize is ... and if so, gets the file size and shows that*/
        if (arguments[obj]["fileSize"] === "...") {
            setFileSize(arguments[obj]["url"], obj, lastul, tabId);
        }
        /* ends here <-- get the existing list tag and populates it with the videos from arguments*/
        /* ads an event listener for click which will send a message to background script to start the download */
        node.addEventListener("click", function(e) {
            e.preventDefault();
            try {
                var thisTitle = this.getAttribute("data-title");
                var thisType = this.getAttribute("data-fileType");
                var thisUrl = this.getAttribute("data-url");

                chrome.tabs.query(
                        {currentWindow: true, active: true},
                function(tabArray) {
                    var tab = tabArray[0];

                    if (tab.url.indexOf("thirteen.org") >= 0) {
                        chrome.runtime.sendMessage(null, {method: "DownloadVideo", arguments: {title: thisTitle, type: thisType, url: thisUrl}, directCall: 1}, function() {
                        });
                    } else {
                        chrome.tabs.sendMessage(tab.id, {method: "downloadFromPage", arguments: {title: thisTitle, type: thisType, url: thisUrl}});
                    }
                }
                );
            } catch (e) {
                alert(e);
            }
        }, false);
    }

}

function setFileSize(url, vidIndx, ul, tabId) {
    /*
     * 1.make an xmlhttprequest and get only the header from which we extract the content-length. 
     * 2.we transform from bytes to mb and show it in the video list. 
     * 3.also, we send a message to the background scrip to set the new value in the global array of tabs with videos
     * */
    //1
    var xhReq = new XMLHttpRequest();
    xhReq.open("HEAD", url, true);
    xhReq.onreadystatechange = function() {
        try {
            if (this.status == 200 && this.readyState == 2) {
                //2
                var bytes = this.getResponseHeader("Content-Length");
                var mb = Math.floor(bytes * 100 / 1024 / 1024) / 100;
                var liArray = ul.getElementsByTagName("li");
                var sizeSpan = liArray[vidIndx].getElementsByTagName("div")[0].getElementsByTagName("span")[1];
                sizeSpan.innerHTML = mb + "MB";
                //3
                chrome.runtime.sendMessage(null, {method: "setSizeInArray", arguments: {tabId: tabId, size: mb + "MB", vidIndx: vidIndx}, directCall: 1}, function() {
                });
            }
        }
        catch (e) {
        }
    };
    xhReq.send(null);
}
/*ads an event listener for load and triggers oninit*/
window.addEventListener("load", function() {
    oninit();
}, false);
