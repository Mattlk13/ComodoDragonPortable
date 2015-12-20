/* Dailymotion class  */

var Dailymotion = { 
    checkForDailymotionObject: function(thisTabId, thisTabUrl) {
        /* check if tab url contains "/video/" string and extracts it  */
        if (thisTabUrl.indexOf("/video/") > 0) {
            var videoID = thisTabUrl.split("/").pop().split("_")[0];
        }
        /* if the id exists make a httprequest and calls  setVideoFilesList with the response as argument */
        if (videoID) {
            var xhReq = new XMLHttpRequest();
            xhReq.open("GET", "http://www.dailymotion.com/embed/video/" + videoID, false);
            xhReq.send(null);
            var serverResponse = xhReq.responseText;
            /*
             *  thisTabId = tab id
             *  thisTabUrl = tab url
             *  serverResponse = request response
             *  videoID = video id
             */
            this.setVideoFilesList(thisTabId, thisTabUrl, serverResponse, videoID);
        }
    },
    setVideoFilesList: function(thisTabId, thisTabUrl, doc, videoID) {
        var videoParams = new Array();
        /* regex to match the code we need to parse*/
        var info = /var *info *= *(.*),/.exec(doc);
        /* gets the links and some details from the matched code */
        var links = this.getVideoLinks(info);
        if (!links) {
            return;
        }
        /* gets the title from the response got from the xmlhttprequest  */
        var title = this.getTitleFromDoc(doc);
        /* for every media link found, set an media object with parameters*/
        for (var i in links) {
            videoParams[i] = {
                url: links[i].url, //media url
                quality: this.getResolution(links[i].quality), // example, "large", "medium"
                fileType: links[i].fileType, // example, "video/x-flv"
                id: i, //index
                title: title + "-" + this.getResolution(links[i].quality) + "." + links[i].fileType, //title.extension
                thumbnail: "http://www.dailymotion.com/thumbnail/video/" + videoID, //thumbnail
                fileSize: "..." //filesize in its initial state 
            };
        }
        /* activates the extension icon */
        mediaActions.setIcon("found", thisTabId);
        /* adds the media array to the tabsWithVids object */
        mediaActions.tabsWithVids[thisTabId] = videoParams;
    },
    getVideoLinks: function(info) {
        /* check info not to be undefined*/
        if (!info) {
            return false;
        }
        var links = new Array();
        /*parse the second element from the functions argument array*/
        info = JSON.parse(info[1]);
        var url = null;
        /* for every quality in the predefined list, add the specific details to the links array */
        for (var i in this.QUALITIES) {
            url = info["stream_h264_" + this.QUALITIES[i]];
            if (url != null) {
                links.push({
                    url: url,
                    quality: i, // key
                    fileType: "mp4",
                    resolution: this.RESOLUTIONS[i]
                });
            }
        }
        return links;
    },
    /* predefined qualities*/
    QUALITIES: {
        H264_512x384: "url",
        H264_320x240: "ld_url",
        H264_848x480: "hq_url",
        H264_1280x720: "hd_url",
        H264_1280x720_2: "hd720_url",
        H264_1920x1080: "hd1080_url"
    },
    /* predefined corresponding resolution*/
    RESOLUTIONS: {
        H264_320x240: "240",
        H264_512x384: "380",
        H264_848x480: "480",
        H264_1280x720: "720",
        H264_1280x720_2: "720",
        H264_1920x1080: "1080"
    },
    getTitleFromDoc: function(docAsString) {
        /* gets the start and end index where are first find our strings */
        var startIndex = docAsString.indexOf("<title>") + 7;
        var endIndex = docAsString.indexOf("</title>", startIndex);
        /*return the substring between our indexes*/
        return docAsString.substring(startIndex, endIndex);
    },
    getResolution: function(quality) {
        /*matches and returs the quality with corresponding resolution */
        if (this.RESOLUTIONS[quality])
            return this.RESOLUTIONS[quality];
        else
            return "???";
    }

};