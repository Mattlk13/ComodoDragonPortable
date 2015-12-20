/*youtube media detection class*/
var Youtube = {

    k: false,
    l: {},
    q: "download-youtube-signature-code",
    DECODE_RULE: {},
    checkForYoutubeObject: function(thisTabId, pageUrl) {

        var videoId = Youtube.getYoutubeVideoId(pageUrl); //gets id of the video from url
        var xhReq = new XMLHttpRequest(); //the request object
        xhReq.open("GET", "http://www.youtube.com/watch?v=" + videoId, true);
        xhReq.setRequestHeader('Cache-Control', 'no-cache');
        xhReq.onreadystatechange = function() {
            try {
                if (this.readyState == 4 && this.status == 200) {

                    try {
                        /*  thisTabId - tab id
                         *  pageUrl - url of the page
                         *  responseText - response of the request
                         *  videoId - id of the video
                         */
                        var videoParams = Youtube.getYoutubeMap(thisTabId, pageUrl, this.responseText, videoId); // call the mathod which parses the response

                    } catch (e) {
                        console.log(e);
                    }

                }
            }
            catch (e) {
            }
        };
        xhReq.send(null);
    },
    getYoutubeMap: function(thisTabId, thisTabUrl, ThisInnerHTML, videoID) {
        var videoParams = new Array(); //list of different video qualities of same video
        var VideoParamsByType = new Array(); //list of different video qualities of same video sorted by type

        /* the text by which we'll be getting the details */
        var URL = "url=";
        var QUALITY = "quality=";
        var FALLBACK_HOST = "fallback_host=";
        var TYPE = "type=";
        var ITAG = "itag=";
        var SIG = "sig=";
        var S = "s=";
        var urls = null;
        /*get the title from the response by matching the regex*/
        var videoTitle = ThisInnerHTML.match(/<title[^>]*>(.*?)<\/title>/)[1];
        videoTitle = videoTitle.replace(/\s*\-\s*YouTube$/i, '').replace(/[#"\?:\*]/g, '').replace(/[&\|\\\/]/g, '_').replace(/'/g, '\'').replace(/^\s+|\s+$/g, '').replace(/\.+$/g, '');
        /*get the map from the response by matching the regex - it will be used to extract video details*/
		var regExMap = new RegExp('"url_encoded_fmt_stream_map"\s*:\s*"([^"]*)"');
        var map = ThisInnerHTML.match(regExMap);
        map = map[1];
        var urls = map.split(",");
        //parametrii video-ului
        for (var i in urls) {
            /*split the string into an array of params*/
            var params = urls[i].split("\\u0026");
            /*foreach param get details - it will represent the video in a different format */
            for (var j in params) {
                if (params[j].indexOf(URL) !== -1) {
                    var url = params[j].split(URL)[1];
                }
                if (params[j].indexOf(QUALITY) !== -1) {
                    var quality = params[j].split(QUALITY)[1];
                }
                if (params[j].indexOf(ITAG) !== -1) {
                    var itag = parseInt(params[j].split(ITAG)[1]);
                }
                if (params[j].indexOf(SIG) === 0) {
                    var sig = params[j].split(SIG)[1];
                }
                if (params[j].indexOf(S) === 0) {
                    var s = params[j].split(S)[1];
                }
            }
            /*check and add what type of signature is found*/
            if (sig && url.indexOf("signature") === -1) {
                url += "&signature=" + sig;
            }
            if (s && url.indexOf("signature") === -1) {
                url += "&signature=" + s;
            }
            /*check and add ratebypass */
            if (url.toLowerCase().indexOf("ratebypass") === -1)
            {
                url += "&ratebypass=yes";
            }
            url = unescape(url); //unescape the url
            /* get, unescape and replace fexp param*/
            var fexp = url.split("fexp=").pop().split("&")[0]; //split the url params
            var newfexp = unescape(fexp);
            url = url.replace(fexp, newfexp);
            /* get, unescape and replace sparamas param*/
            var sparams = url.split("sparams=").pop().split("&")[0];
            var newsparams = unescape(sparams);
            url = url.replace(sparams, newsparams);


            var thisFiletype = Youtube.getYoutubeVideoFormat(itag).fileType; //get the filetype using the getYoutubeVideoFormat function
            var thisResolution = Youtube.getYoutubeVideoFormat(itag).resolution; //get the resolution using the getYoutubeVideoFormat function
            /*if filetype is ok, add details to the video type*/
            if (thisFiletype !== "Unrecognized") {
                var thisVideoParams = {
                    url: url, // "\u0026" is an "&"
                    tabUrl: thisTabUrl, // url of the tab
                    tabId: thisTabId, //id of the tab
                    quality: quality, // example, "large", "medium"
                    fileType: thisFiletype, // example, "video/x-flv"
                    resolution: thisResolution, // example, "34", "43" (video quality - hd and such)
                    title: videoTitle + "." + thisFiletype, //title.extension
                    thumbnail: "http://img.youtube.com/vi/" + videoID + "/2.jpg", //thumbnail
                    fileSize: "..." //initial state of filesize
                };

                /*start sorting the video list by filetype*/

                if (thisFiletype === "mp4") {
                    if (Object.prototype.toString.call(VideoParamsByType[0]) !== '[object Array]') {
                        VideoParamsByType[0] = new Array();
                    }
                    VideoParamsByType[0].push(thisVideoParams);

                } else if (thisFiletype === "flv") {
                    if (Object.prototype.toString.call(VideoParamsByType[1]) !== '[object Array]') {
                        VideoParamsByType[1] = new Array();
                    }
                    VideoParamsByType[1].push(thisVideoParams);
                } else if (thisFiletype === "webm") {
                    if (Object.prototype.toString.call(VideoParamsByType[2]) !== '[object Array]') {
                        VideoParamsByType[2] = new Array();
                    }
                    VideoParamsByType[2].push(thisVideoParams);
                } else if (thisFiletype === "3d.webm") {
                    if (Object.prototype.toString.call(VideoParamsByType[3]) !== '[object Array]') {
                        VideoParamsByType[3] = new Array();
                    }
                    VideoParamsByType[3].push(thisVideoParams);
                } else if (thisFiletype === "3gp") {
                    if (Object.prototype.toString.call(VideoParamsByType[4]) !== '[object Array]') {
                        VideoParamsByType[4] = new Array();
                    }
                    VideoParamsByType[4].push(thisVideoParams);
                }
                /* end sorting the video list by file type*/
            }
        }
        /* after sorting, we merge the resulting arrays together*/
        for (var t in VideoParamsByType) {
            if (typeof VideoParamsByType[t] !== 'undefined' && VideoParamsByType[t].length > 0) {
                videoParams = videoParams.concat(VideoParamsByType[t]);
            }
        }
        /*signature decrypting starts here by geting the encoding script url */
        var regExScriptUrl = new RegExp('\\"js\\":\\s*\\"([^"]+)"');
        var scriptURL = Youtube.findMatch(ThisInnerHTML, regExScriptUrl);// /\"js\":\s*\"([^\"]+)\"/);
        scriptURL = scriptURL.replace(/\\/g, '');
        if (scriptURL) {
            if (scriptURL.indexOf('//') === 0) {
                var protocol = (thisTabUrl.split("//")[0] === 'http:') ? 'http:' : 'https:';
                scriptURL = protocol + scriptURL;
            }
            /* resolves the signature problem - url from above and id of the tab as params */
            Youtube.fetchSignatureScript(scriptURL, thisTabId);
        }
        /* activates the extension icon */
        mediaActions.setIcon("found", thisTabId);
        /* adds the media array to the tabsWithVids object */
        mediaActions.tabsWithVids[thisTabId] = videoParams;

    },
    getYoutubeVideoFormat: function(format) {
        /*predefined resolution for youtube videos to match*/
        var videoFormats = {
            5: {resolution: '240p', fileType: 'flv'},
            6: {resolution: '270p', fileType: 'flv'},
            34: {resolution: '360p', fileType: 'flv'},
            35: {resolution: '480p', fileType: 'flv'},
            18: {resolution: '360p', fileType: 'mp4'},
            22: {resolution: '720p', fileType: 'mp4'},
            37: {resolution: '1080p', fileType: 'mp4'},
            38: {resolution: '2304p', fileType: 'mp4'},
            83: {resolution: '240p 3D', fileType: 'mp4'},
            82: {resolution: '360p 3D', fileType: 'mp4'},
            85: {resolution: '520p 3D', fileType: 'mp4'},
            84: {resolution: '720p 3D', fileType: 'mp4'},
            43: {resolution: '360p', fileType: 'webm'},
            44: {resolution: '480p', fileType: 'webm'},
            45: {resolution: '720p', fileType: 'webm'},
            46: {resolution: '1080p', fileType: 'webm'},
            100: {resolution: '360p', fileType: '3d.webm'},
            101: {resolution: '480p', fileType: '3d.webm'},
            102: {resolution: '720p', fileType: '3d.webm'},
            13: {resolution: '144p', fileType: '3gp'},
            17: {resolution: '144p', fileType: '3gp'},
            36: {resolution: '240p', fileType: '3gp'}
        };
        /*checks and returns the coressponding format or unrecognized it not on the list above*/
        if (videoFormats[format]) {
            return videoFormats[format];
        }
        else {
            return {
                resolution: "Unrecognized",
                fileType: "Unrecognized"
            };
        }
    },
    getYoutubeVideoId: function(pageUrl) {
        /*gets the id of the video from the url of the page */
        try {
            var result = pageUrl.split("watch?v=");
            var checkforparams = result[1].indexOf("&");
//            console.log(checkforparams);
            if (checkforparams === -1) {
                return result[1];
            } else {
                var allParams = result[1].split("&");
                return allParams[0];
            }
        } catch (e) {
            console.log(e);
        }
    },
    fetchSignatureScript: function(scriptURL, thisTabId) {
        /*makes a call to the encrypting script url and tries to get the signature code that will help us decrypt the signature*/
        try {
            var xhReq = new XMLHttpRequest();
            xhReq.open("GET", scriptURL, true);
            xhReq.setRequestHeader('Cache-Control', 'no-cache');
            xhReq.onreadystatechange = function() {
                try {
                    if (this.readyState == 4 && this.status == 200) {
                        /*call the function that will try to return the signature code*/
                        Youtube.findSignatureCode(this.responseText, thisTabId);
                    }
                }
                catch (e) {
                }
            };
            xhReq.send(null);

        } catch (e) {
        }
    },
    findSignatureCode: function(sourceCode, thisTabId) {
        /*start here <- get the encrypting function name and code for the encrypting */
       
        var functionName = Youtube.findMatch(sourceCode, /\.signature\s*=\s*(\w+)\(\w+\)/);
        if (functionName == null) {
            functionName = Youtube.findMatch(sourceCode, /"signature"\s*,\s*(\w+)\(\w+\)/);
            if(functionName == null){
                console.log("error");
                return; /*setPref(STORAGE_CODE, 'error'); */
            }
        }

        var regCode = new RegExp('function ' + functionName + '\\s*\\(\\w+\\)\\s*{\\w+=\\w+\\.split\\(""\\);(.+);return \\w+\\.join');
        var functionCode = Youtube.findMatch(sourceCode, regCode);
        if (functionCode == null) {
            console.log("error");
            return; //setPref(STORAGE_CODE, 'error');
        }
        var firstpiece = functionCode.split(';');
        var varName = firstpiece[0].split('.');
        var regExpforSecondfunct = new RegExp('var\\s*' + varName[0] + '\\s*=\\s*\\{\\w+:\\w+\\(.+\\}}');
        var functionName2 = Youtube.findFunctionMatch(sourceCode,regExpforSecondfunct);
        var regExpforVarFunct = new RegExp('\\w+:\\s*(.+)\\}}');
        var functionName3 = Youtube.findFunctionMatch(functionName2,regExpforVarFunct);
        
        var varCodePieces = functionName3.split('},');
        var functionCodePieces = functionCode.split(';');
        
        // 9/26/14 neslihand
        var regExpFunctName = new RegExp('\\w+\\s*:');
        for(var k = 0; k<varCodePieces.length; k++){
            if(varCodePieces[k].length == 0){
            }else if(varCodePieces[k].indexOf('.splice') >= 0){
                
                var sliceFunct = varCodePieces[k].split(':');

            }
            else if(varCodePieces[k].indexOf('.reverse') >= 0){
                var reverseFunct = varCodePieces[k].split(':');

            }
            else if(varCodePieces[k].indexOf('.length') >= 0){
                var swapFunct = varCodePieces[k].split(':');
            }
        }   

        var decodeArray = [], signatureLength = 81;
        /*starts here <- choose what decrypting rule to use and decrypt the signature */
        for (var i = 0; i < functionCodePieces.length; i++) {
            
            functionCodePieces[i] = functionCodePieces[i].trim();
            if (functionCodePieces[i].length == 0) {
            } else if (functionCodePieces[i].indexOf(sliceFunct[0]) >= 0) { // slice

                var regSlice = new RegExp('\\d*\\)');//('\\s*' + varName[0] + '\\.' + sliceFunct[0] + '\\(.+\\)');
                var slice = Youtube.findFunctionMatch(functionCodePieces[i], regSlice);
                slice = parseInt(slice, 10);
                if (Youtube.isInteger(slice)) {
                    decodeArray.push(-slice);
                    signatureLength += slice;
                } else {
                    console.log("error");
                    return;
                }

            } else if (functionCodePieces[i].indexOf(reverseFunct[0]) >= 0) {

                decodeArray.push(0);

            } else if (functionCodePieces[i].indexOf(swapFunct[0]) >= 0) {

                var regSwap = new RegExp('\\d*\\)');
                var inline = Youtube.findFunctionMatch(functionCodePieces[i], regSwap);
                inline = parseInt(inline, 10);
                decodeArray.push(inline);
                
            }else {
                console.log("error");
                return;
            }

        }

        /*adds the decrypted signature to the media details replacing the old signature*/
        if (decodeArray) {
            //Youtube.DECODE_RULE[signatureLength] = decodeArray; // 9/24/14 neslihand 
            var thisTabVideos = mediaActions.tabsWithVids[thisTabId];
            var thisTabVideosResult = mediaActions.tabsWithVids[thisTabId];
            for (var vid in thisTabVideos) {
                var thisUrl = thisTabVideos[vid].url;
                var thisSig = thisUrl.split("&signature=").pop().split("&")[0];
                Youtube.DECODE_RULE[thisSig.length] = decodeArray; // 9/24/14 neslihand
                var decryptedSig = Youtube.decryptSignature(thisSig);
                thisUrl = thisUrl.replace(thisSig, decryptedSig);
                thisTabVideosResult[vid].url = thisUrl;
            }
            mediaActions.tabsWithVids[thisTabId] = thisTabVideosResult;
        }
        /*ends here <- choose what decrypting rule to use and decrypt the signature */
    },
    decryptSignature: function(sig) {
        /*decrypting algorithm for the signature*/
        function swap(a, b) {
            var c = a[0];
            a[0] = a[b % a.length];
            a[b] = c;
            return a
        }
        ;
        function decode(sig, arr) { // encoded decryption
            if (!Youtube.isString(sig)) {
                return null;
            }

            var sigA = sig.split('');

            for (var i = 0; i < arr.length; i++) {
                var act = arr[i];
                if (!Youtube.isInteger(act)) {
                    return null;
                }

                sigA = (act > 0) ? swap(sigA, act) : ((act == 0) ? sigA.reverse() : sigA.slice(-act));
                

            }

            var result = sigA.join('');
            return (result.length == 81) ? result : sig;
        }
        
        if (sig == null) {
            return '';
        }

        var arr = Youtube.DECODE_RULE[sig.length];

        if (arr) {
            var sig2 = decode(sig, arr);

            if (sig2 && sig2.length == 81)
                return sig2;
        }
        return sig;
    },
    findMatch: function(text, regexp) {
        var matches = text.match(regexp);
        return (matches) ? matches[1] : null;
    },
    // 9/26/14 neslihand
    findFunctionMatch: function(text, regexp) {
        var matches = text.match(regexp);
        return (matches) ? matches[0] : null;
    },
    isInteger: function(n) {
        return (typeof n === 'number' && n % 1 == 0);
    },
    isString: function(s) {
        return (typeof s === 'string' || s instanceof String);
    }
};