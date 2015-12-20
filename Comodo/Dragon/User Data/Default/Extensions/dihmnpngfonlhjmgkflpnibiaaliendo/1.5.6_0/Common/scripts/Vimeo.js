/* vimeo media detection class */
var Vimeo = {
    checkForVimeoObject: function(thisTabId, thisTabUrl) {
        /* gets the tabid */
        var videoID = thisTabUrl.split("/").pop();
        /* if video id is not undefined and is different than "" or "watch" makes an xmlhttprequest to the tab url*/
        if (videoID && videoID != "" && videoID != "watch") {
            var xhReq = new XMLHttpRequest();
            xhReq.open("GET", thisTabUrl, false);
            xhReq.thisTabId = thisTabId;
            xhReq.thisTabUrl = thisTabUrl;
//            xhReq.setRequestHeader('Cache-Control', 'no-cache');
            xhReq.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var serverResponse = xhReq.responseText; // request response
                    var data_url_cont = serverResponse.match(/data-config-url="([^"]*)"/); //match the regez to get the data we need
                    /* url to which we will make the second xmlhttprequest*/
                    var data_url = data_url_cont[1]; 
                    var data_url = data_url.replace(/&amp;/g, '&');
                    
                    var xhReq2 = new XMLHttpRequest();
                    xhReq2.thisTabId = xhReq.thisTabId;
                    xhReq2.thisTabUrl = xhReq.thisTabUrl;
                    xhReq2.open("GET", data_url, false);
//                    xhReq.setRequestHeader('Cache-Control', 'no-cache');
                    xhReq2.onreadystatechange = function() {
                        var serverResponse2 = xhReq2.responseText; //response from the second call
                        var data_json = JSON.parse(serverResponse2); //parsed response
                        var title = data_json.video.title; //title of the video
                        var videoParams = new Array();
                        //parse the h264 child of the response and extract the details
                        for(var i in data_json.request.files.h264) {
                            var thisVideoParams = {
                                url: data_json.request.files.h264[i].url, // "\u0026" is an "&"
                                tabUrl: xhReq2.thisTabUrl, //url of the tab
                                tabId: xhReq2.thisTabId, //id of the tab
                                quality: i, // example, "large", "medium"
                                fileType: "mp4", // example, "video/x-flv"
                                title: title +"["+ i+"].mp4",
                                fileSize: "..."
                            };
                            videoParams.push(thisVideoParams);
                        }
                        /* activates the extension icon */
                        mediaActions.setIcon("found", thisTabId);
                        /* adds the media array to the tabsWithVids object */
                        mediaActions.tabsWithVids[thisTabId] = videoParams;

                    }
                    xhReq2.send(null);
                }

            }
            xhReq.send(null);
        }
    }
}