var Popup = {
    DisplayCMGList: function(arguments, tabId) {
        /* because the popup is at the background level in firefox, we don't need a messaging system
         * we directly get the elements we need and using the argument list, we populate the popup
         * */
        var doc = document;
        
        var button = doc.getElementById('MediaGrabberButton');
        var panel = doc.getElementById('thepanel');
        var lastul = doc.getElementById('embedList');

        while (lastul.hasChildNodes())
        {
            lastul.removeChild(lastul.lastChild);
        }

        for (var obj in arguments) {
            
            var node = doc.createElement("LI");
            var attri = doc.createAttribute("class");
            attri.value = "videoItem";
            node.setAttributeNode(attri);

            for (var key in arguments[obj]) {
                var att = doc.createAttribute("data-" + key);
                att.value = arguments[obj][key];
                node.setAttributeNode(att);
            }

            var objType = arguments[obj]["fileType"];
            if (arguments[obj]["title"] === "MyMediaFile") {
                //check again for title
            }

            var metaDetails = doc.createElement("div");
            var attri = doc.createAttribute("class");
            attri.value = "metaDetails";
            metaDetails.setAttributeNode(attri);

            var vidTypePop = doc.createElement("span");
            var attri = doc.createAttribute("class");
            attri.value = "vidTypePop";
            vidTypePop.setAttributeNode(attri);

            var typeText = doc.createTextNode(objType.toUpperCase());
            vidTypePop.appendChild(typeText);

            metaDetails.appendChild(vidTypePop);

            var vidSizePop = doc.createElement("span");
            var attri = doc.createAttribute("class");
            attri.value = "vidSizePop";
            vidSizePop.setAttributeNode(attri);

            var sizeText = doc.createTextNode(arguments[obj]["fileSize"]);
            vidSizePop.appendChild(sizeText);
            /* if the file size is not specified we trigger a function that gets the filesize and adds it to the list*/
            if(arguments[obj]["fileSize"] === "..."){
                mediaActions.setFileSize(tabId, arguments[obj]["url"], obj);
            }


            metaDetails.appendChild(vidSizePop);

            node.appendChild(metaDetails);

            var vidTitlePop = doc.createElement("div");
            var attri = doc.createAttribute("class");
            attri.value = "vidTitlePop";
            vidTitlePop.setAttributeNode(attri);

            var theTitle = doc.createElement("span");
            var attri = doc.createAttribute("class");
            attri.value = "theTitle";
            theTitle.setAttributeNode(attri);

            var title = doc.createTextNode(arguments[obj]["title"]);
            theTitle.appendChild(title);

            vidTitlePop.appendChild(theTitle);

            if (arguments[obj]["resolution"] && arguments[obj]["resolution"] !== "") {

                var theResolution = doc.createElement("span");
                var attri = doc.createAttribute("class");
                attri.value = "theResolution";
                theResolution.setAttributeNode(attri);

                var resolution = doc.createTextNode(arguments[obj]["resolution"]);
                theResolution.appendChild(resolution);

                vidTitlePop.appendChild(theResolution);
            }

            node.appendChild(vidTitlePop);

            lastul.appendChild(node);
            
            /* we add an event listener that triggers the download of the media */
            node.addEventListener("click", function(e) {
                e.preventDefault();
                try {
                    var thisTitle = this.getAttribute("data-title");
                    var thisType = this.getAttribute("data-fileType");
                    var thisUrl = this.getAttribute("data-url");
                    
                    mediaActions.downloadVideo(thisTitle, thisType, thisUrl);

                } catch (e) {
                    alert(e);
                }
            }, false);
        }
        /*open the popup */
        panel.openPopup(button, 'after_start', 0, 0, false, false);

    },
    
}