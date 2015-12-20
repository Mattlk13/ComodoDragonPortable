var videoObj = {
    video: new Object(),
    videoLength: 0,
    videoTitles: new Object(),
    setTtitle: function(tabId, title, vidIndex) {
        /* adds the title to the array and sends a message to the popup so it can update the title in the list */
        if (!mediaActions.tabsWithVids[tabId][vidIndex])
            return;
        mediaActions.tabsWithVids[tabId][vidIndex].title = title;
        chrome.runtime.sendMessage(null, {method: "showTitle", title: title, vidIndex: vidIndex, directCall: 1}, function() {
        });
    }
};