if ("undefined" === typeof (MySidebar)) {
    var MySidebar = {};
}
;


MySidebar.dndcommunicate = {
    sendRequest: function sendRequest(data, callback) {
        if (MySidebar.dndBrowser === "Firefox") {
            var request = document.createTextNode(JSON.stringify(data));
            document.head.appendChild(request);
            var event = document.createEvent("HTMLEvents");
            event.initEvent("privilegedEvent", true, false);
            request.dispatchEvent(event);
        } else {
            chrome.runtime.sendMessage(null, data, callback );
        }

    }
};