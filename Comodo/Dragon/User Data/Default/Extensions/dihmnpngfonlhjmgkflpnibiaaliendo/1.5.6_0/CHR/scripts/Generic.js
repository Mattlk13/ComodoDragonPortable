var Generic = {
    /* object that stores details to be matched and to get the coresponding filetype*/
    videoHandler: [
        {mime: "flv", urlParts: [""], fileType: "flv"},
        {mime: "audio/mpeg", urlParts: [".mp3"], fileType: "mp3"},
        {mime: "audio/mpeg", urlParts: [""], fileType: "mpeg"},
        {mime: "application/ogg", urlParts: [""], fileType: "ogg"},
        {mime: "mp4", urlParts: [""], fileType: "mp4"},
        {mime: "plain", urlParts: ["youporn", ".flv"], fileType: "flv"}, // Youporn		
        {mime: "octet-stream", urlParts: ["coolcdn.ch", ".flv"], fileType: "flv"},
        {mime: "octet-stream", urlParts: [".webm"], fileType: "webm"},
        {mime: "octet-stream", urlParts: [".mp3"], fileType: "mp3"},
        //{mime: "plain", urlParts: ["youtube.com", "videoplayback", "range"]}, // Youtube
        {mime: "m4v", urlParts: [""], fileType: "m4v"}
    ],
    /*array of website on which generic method does not apply */
    siteExceptions: [
        "dailymotion.com",
        "youtube.com"
    ],
    checkForObject: function(details) {
        var thisTabUrl = mediaActions.tabUrl; // url of the tab
        var url = details.url; // url of the request
        var thisVideoObject = new Object(); 
        var existsAlready = false;
        if (details.tabId < 0)
            return;
        
        var thisTabId = details.tabId; //id of the tab
        for (var i in details.responseHeaders) {
            /*for each reponse header in details object we check the content-type against the videoHandler object above and get the 
             * corresponding file type
             * */
            if (details.responseHeaders[i].name === 'Content-Type') {
                var mime = details.responseHeaders[i].value;
                for (var j in Generic.videoHandler)
                {
                    var comp = Generic.videoHandler[j].mime;
                    if (mime.indexOf(comp) !== -1)
                    {
                        var type = mime;
                        var parts = Generic.videoHandler[j].urlParts;
                        for (var k in parts)
                        {
                            var find = parts[k];
                            if (url.indexOf(find) === -1) {
                                type = false;
                            }
                                
                                /* we check the url not to be from site in the exception list*/
                            for (var ex in Generic.siteExceptions) {
                                if (url.indexOf(Generic.siteExceptions[ex]) >= 0) {
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
                            //creates a video object and adds details 
                            thisVideoObject = {
                                tabId: thisTabId, //tab id
                                url: url, //media url
                                tabUrl: thisTabUrl, //tab url
                                title: "MyMediaFile." + Generic.videoHandler[j].fileType, //title.extension
                                fileType: Generic.videoHandler[j].fileType, //file type
                                fileSize: "..." //initial filesize
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
                                mediaActions.tryToGetTitle(thisTabId, mediaActions.tabsWithVids[thisTabId].length, Generic.videoHandler[j].fileType);
                                /* activates the extension icon */
                                mediaActions.setIcon("found", thisTabId);
                            }

                        }

                    }
                }

            }
        }



    }
};