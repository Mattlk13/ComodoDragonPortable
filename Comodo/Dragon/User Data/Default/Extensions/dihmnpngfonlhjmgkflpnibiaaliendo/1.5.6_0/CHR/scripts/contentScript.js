var ContentScript = {
    returnTitle: function(vidIndex, fileType) {
        /*extracts the title from the page and sends a message to the background script with it*/
        var title = document.getElementsByTagName("title")[0].innerHTML;
        if (title !== undefined && title !== null && title !== "") {
            Communicate.sendRequest({method: "setTitle", title: title+"."+fileType, vidIndex:vidIndex,  directCall: 1}, function() {
            });
        }
    },
    initDownload: function() {
        /*
         * inits the download from the page level
         * gets an existing anchor element and triggers a click on it
         */
        var el = document.getElementById("cmdMedAnchor");
        el.click();
        window.parent.document.getElementById("cmdMedAnchor").parentNode.removeChild(window.parent.document.getElementById("cmdMedAnchor"));
    }
};

var Communicate = {
    //manages the sent messages
    sendRequest: function sendRequest(data, callback) {
        chrome.runtime.sendMessage(null, data, callback);
    },
    //waits and manages the incoming messages
    waitRequest: function() {
        chrome.runtime.onMessage.addListener(
                function(request, sender, sendResponse) {
                    if (request.method === 'downloadFromPage') {
                        /* configures the download anchor tag and triggers the initDownload from above */
                        var cmdAnchor = document.createElement("a");
                        cmdAnchor.id = "cmdMedAnchor";
                        cmdAnchor.href = unescape(request.arguments.url);
                        cmdAnchor.download = request.arguments.title.replace(" ", "") + "." + request.arguments.type;
                        //cmdAnchor.innerText = "CLICK HERE"; 
                        document.body.appendChild(cmdAnchor);
                        ContentScript.initDownload();
                    }else if (request.method === 'addTitle'){
                        ContentScript.returnTitle(request.vidIndex, request.fileType);
                    }else if (request.method === 'SetTitleAgain'){
                        ContentScript.returnTitle(request.vidIntex, request.fileType);
                    }
                    return true;
                });
    }
};
/*adds a load event listener which triggers the incoming messages handler */
window.addEventListener("load", function() {
    //ContentScript.oninit();
    Communicate.waitRequest();
}, false);