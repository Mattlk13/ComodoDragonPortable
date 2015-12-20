var Generic = {
    /*array with sites on which the generic method doesn't apply */
    siteExceptions: [
        "dailymotion.com",
        "youtube.com"
    ],
    checkForObject: function(details) {
        var thisTabUrl = mediaActions.tabUrl; // url of the tab
        var type = false;
        var thisVideoObject = new Object();
        var existsAlready = false;
        if (details.tabId == undefined) {
            return;
        }
        var thisTabId = details.tabId; //tab id
        var mime = details.responseHeaders.getResponseHeader('Content-Type'); //the cotnent type of the request
        var url = details.responseHeaders.URI.prePath + details.responseHeaders.URI.path; // url of the request
        
        /*checks the type of the content not to be f4m or f4f -- because they are parts of video*/
        if((mime.indexOf("f4m") != -1) || (mime.indexOf("f4f") != -1)){
            return;
        }
        /*checks the url not to be youtube or vimeo*/
        if((url.indexOf("youtube") != -1) || (url.indexOf("vimeo") != -1)){
            return;
        }
        /*checks the content type for accepted types*/
        if ((mime.indexOf("video") != -1) || (mime.indexOf("audio") != -1) || (mime.indexOf("mp3") != -1))
        {
            type = mime;
            for (var ex in Generic.siteExceptions) {
                /*check against the exception websites */
                if (thisTabUrl.indexOf(Generic.siteExceptions[ex]) >= 0) {
                    type = false;
                }
            }
        }
        if (type !== false)
        {
            if (!mediaActions.tabsWithVids[thisTabId]) {
                //iniate new array for this tab
                mediaActions.tabsWithVids[thisTabId] = new Array();
            }

            var fileType = mime.split("/")[1];
            /* get the filetype */
            fileType = (fileType == "x-flv" ? "flv" : fileType);
            /* get and transform the size of the media files from bytes to mb*/
            var bytes = details.responseHeaders.contentLength;
            var mb = Math.floor(bytes * 100 / 1024 / 1024) / 100;
            var thisSize = mb + "MB";
            //creates a video object and adds details 
            thisVideoObject = {
                tabId: thisTabId, // tab id 
                url: url, //media url
                tabUrl: thisTabUrl, //tab url
                title: "MyMediaFile." + fileType, //title.extension
                fileType: fileType, //filetype
                fileSize: thisSize //filesize
            };

            for (var vid in mediaActions.tabsWithVids[thisTabId]) {
                /*check if the video already exists by checking their url */
                var thisArrayUrl = mediaActions.tabsWithVids[thisTabId][vid].url;
                if (thisArrayUrl.indexOf("?") > 0) {
                    thisArrayUrl = thisArrayUrl.split("?")[0];
                }
                var thisUrl = thisVideoObject.url;
                if (thisUrl.indexOf("?") > 0) {
                    thisUrl = thisUrl.split("?")[0];
                }

                if (thisArrayUrl === thisUrl)
                    existsAlready = true;
            }
            if (existsAlready === false) {
                /* adds the media array to the tabsWithVids object */
                mediaActions.tabsWithVids[thisTabId].push(thisVideoObject);
                /* try to get the title -- - now the page is loaded*/
                tabActions.getTabTitle(thisTabId, mediaActions.tabsWithVids[thisTabId].length, fileType);
                /* activates the extension icon */
                mediaActions.setIcon("found", thisTabId);
            }
        }
    }
};