if ("undefined" == typeof (MySidebar)) {
    var MySidebar = {};
}
;
var DraggedElem;
var fadeEffect = function() {
    return{
        init: function(doc, id, flag, target) {
            this.elem = doc.getElementById(id);
            clearInterval(this.elem.si);
            this.target = target ? target : flag ? 100 : 0;
            this.flag = flag || -1;
            this.alpha = this.elem.style.opacity ? parseFloat(this.elem.style.opacity) * 100 : 0;
            this.elem.si = setInterval(function() {
                fadeEffect.tween()
            }, 20);
        },
        tween: function() {
            if (this.alpha == this.target) {
                clearInterval(this.elem.si);
            } else {
                var value = Math.round(this.alpha + ((this.target - this.alpha) * .05)) + (1 * this.flag);
                this.elem.style.opacity = value / 100;
                this.elem.style.filter = 'alpha(opacity=' + value + ')';
                this.alpha = value
            }
        }
    }
}();
MySidebar.details = {
    MyRightDiv: document.getElementById('sideDragRight'),
    MyLeftDiv: document.getElementById('sideDragLeft'),
    DisplayStateRight: 'hidden',
    DisplayStateLeft: 'hidden'
}

MySidebar.MiscFunc = {
    displayContent: function displayContent(doc, shareRep, searchRep) {
        var oDoc = doc.getElementsByTagName('html');
        var embed = doc.createElement('div');
        embed.id = "sideDragRight";
        embed.style.display = "none";
        var embed2 = doc.createElement('div');
        embed2.id = "sideDragLeft";
        embed2.style.display = "none";
        MySidebar.MiscFunc.addContent(doc, embed2, shareRep);
        MySidebar.MiscFunc.addContent(doc, embed, searchRep);
        oDoc[0].appendChild(embed);
        oDoc[0].appendChild(embed2);
    },
    addContent: function addContent(doc, div, Rep) {

        chrome.storage.local.get(null, function(data) {
            var content = "";
            var children = Rep.defaultElements;
            var repoName = Rep.itemName;
            var k = 0;
            var status;
            //display default items
            for (var i = 0; i < children.length; i++) {
                status = data[children[i].id + "_enabled"];
                if (status != false) {
                    content = content + "<div class='side_search_box' id='" + children[i].id + "' data-allowed-type='" + children[i].acceptType + "'></div>";
                    k++;
                }
                //content = content + "<div style='display:block;'> <div class='opt_repo_item' id='"+children[i].id+"' data-allowed-type='"+children[i].acceptType+"' ><input type='checkbox' name='status_"+children[i].name+"' value='"+status+"' "+ checked +" >"+children[i].content+"</div></div>";
            }
            //display custom items
            var prefElemChildren = data[Rep.itemName + "_CustomChildrenNumber"];
            if (prefElemChildren !== "") {
                for (var j = 1; j <= prefElemChildren; j++) {
                    var thisName = data[Rep.itemName + "_CustomChild_" + j + "_name"];
                    var thisLink = data[Rep.itemName + "_CustomChild_" + j + "_link"];
                    var status = data[Rep.itemName + "_CustomChild_" + j + "_enabled"];
                    var thisLogo = data[Rep.itemName + "_CustomChild_" + j + "_logo"]
                    var thisContent = (thisLogo !== "") ? "<img class='child-elements' src='" + thisLogo + "' alt='" + thisName + "' style='display:none;'/>" : thisName;
                    if (status !== false) {
                        content = content + "<div class='side_search_box' id='" + j.itemName + "_CustomChild_" + j + "' data-allowed-type='text' data-link='" + thisLink + "' >" + thisContent + "</div>";
                        k++;
                    }

                }
            }


            div.innerHTML = content;
            for (n = 0; n < div.childNodes.length; n++) {
                var height = 100 / k;
                div.childNodes[n].setAttribute("style", "height: " + height + "%;");
            }
            var _self = MySidebar.MiscFunc;
            if (repoName === "searchRepository") {
                _self.eventRightInit();
            } else if (repoName === "shareRepository") {
                _self.eventLeftInit();
            }

            document.addEventListener("dragover", _self.dragDrop.startDrag, false);
            document.addEventListener("dragend", _self.dragDrop.docDrop, false);
            document.addEventListener("dragstart", _self.setDraggedElem, false);
            document.addEventListener("mouseover", _self.dragDrop.docDrop, false);
        });
    },
    dragDrop: new MySidebar.dnddragDrop.init,
    eventRightInit: function eventRightInit() {
        try {

            var _self = MySidebar.MiscFunc;
            //var RightChildren = MySidebar.details.MyRightDiv.children;
            var RightChildren = document.getElementById('sideDragRight').children;
            for (var i = 0; i < RightChildren.length; i++) {

                var allowed = RightChildren[i].getAttribute("data-allowed-type");
                var thisId = RightChildren[i].getAttribute("id");
                switch (thisId) {
                    case "side_google_search" :
                        RightChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/webSearch.png") + ")";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        RightChildren[i].style.backgroundSize = "cover";
                        break
                    case "side_wikipedia_search" :
                        RightChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/wikipedia.png") + ")";
                        //RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/wikipedia.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        RightChildren[i].style.backgroundSize = "cover";
                        break
                    case "side_youtube_search" :
                        RightChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/youtube.png") + ")";
                        //RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/youtube.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        RightChildren[i].style.backgroundSize = "cover";
                        break
                    case "side_translate_search":
                        RightChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/translate.png") + ")";
                        //RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/translate.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        RightChildren[i].style.backgroundSize = "cover";
                        break
                    case "side_image_search" :
                        RightChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/imageSearch.png") + ")";
                        //RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/imageSearch.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        RightChildren[i].style.backgroundSize = "cover";
                        break
                    default:
                        RightChildren[i].style.backgroundSize = "cover";
                }


                RightChildren[i].style.backgroundPosition = "center";
                switch (allowed) {
                    case "text":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowText, false);
                        break;
                    case "images":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowImages, false);
                        break;
                    case "all":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowAll, false);
                        break
                }
                RightChildren[i].addEventListener("drop", _self.dragDrop.sideDropSearch, false);
                RightChildren[i].addEventListener("dragenter", _self.dragDrop.addHoverEfect2, false);
                RightChildren[i].addEventListener("dragleave", _self.dragDrop.removeHoverEfect2, false);
            }

        } catch (e) {
            console.log(e)
        }


    },
    eventLeftInit: function eventLeftInit() {
        try {

            var _self = MySidebar.MiscFunc;
            //var LeftChildren = MySidebar.details.MyLeftDiv.children;
            var LeftChildren = document.getElementById('sideDragLeft').children;
            for (var i = 0; i < LeftChildren.length; i++) {
                var allowed = LeftChildren[i].getAttribute("data-allowed-type");
                var thisId = LeftChildren[i].getAttribute("id");
                switch (thisId) {
                    case "side_facebook" :
                        LeftChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/facebook.png") + ")";
                        //LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/facebook.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_twitter" :
                        LeftChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/twitter.png") + ")";
                        //LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/twitter.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_googleplus" :
                        LeftChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/google+.png") + ")";
                        //LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/google+.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_pinterest":
                        LeftChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/pinterest.png") + ")";
                        //LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/pinterest.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_linkedin" :
                        LeftChildren[i].style.backgroundImage = "url(" + chrome.extension.getURL("images/linkedin.png") + ")";
                        //LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/linkedin.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    default:

                }
                LeftChildren[i].style.backgroundSize = "cover";
                LeftChildren[i].style.backgroundPosition = "center center";
                switch (allowed) {
                    case "text":
                        LeftChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowText, false);
                        break;
                    case "images":
                        LeftChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowImages, false);
                        break;
                    case "all":
                        LeftChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowAll, false);
                        break
                }
                LeftChildren[i].addEventListener("drop", _self.dragDrop.sideDropShare, false);
                LeftChildren[i].addEventListener("dragenter", _self.dragDrop.addHoverEfect2, false);
                LeftChildren[i].addEventListener("dragleave", _self.dragDrop.removeHoverEfect2, false)
            }

        } catch (e) {
            console.log(e)
        }


    },
    setDraggedElem: function setDraggedElem(e) {
        DraggedElem = e.target;
        // alert("called setDraggedElem");
        //console.log(DraggedElem);
    },
    initSidebarContent: function addSidebarContent() {
        var _self = MySidebar.MiscFunc;
        try {
            _self.eventRightInit();
            _self.eventLeftInit();
        } catch (e) {
            alert(e);
        }

    },
    buildFirstTimeWarning: function(doc) {
        var _self = MySidebar.MiscFunc;
        try {
            var oDoc = doc.getElementsByTagName('html');
            var embed = doc.createElement('div');
            embed.id = "firstTimeWarningDDS";
            //content bellow

            content = "<p>Drag anything to right for searching and to left for sharing.</p>";
            content += "<div id='do_now_show_dds_warn_again'><span>Do not show this message again</span></div>";
            embed.innerHTML = content;
            embed.style.backgroundImage = "url('" + chrome.extension.getURL("images/arr_bckg.png") + "')";
            embed.style.backgroundRepeat = "no-repeat";
            embed.style.backgroundPosition = "center";
            //end content
            oDoc[0].appendChild(embed);
            fadeEffect.init(doc, "firstTimeWarningDDS", 1);
            var TimeoutVar;
            clearTimeout(TimeoutVar);
            TimeoutVar = setTimeout(function() {
                _self.hideWarn(doc);
            }, 5000);
            doc.addEventListener("dragstart", function() {
                _self.hideWarn(doc);
            }, false);
            var myButton = doc.getElementById("do_now_show_dds_warn_again");
            myButton.addEventListener("click",
                    function() {
                        _self.hideWarn(doc);
                        chrome.storage.local.get("flag_hide_first_warn", function(data) {
                            if (data["flag_hide_first_warn"] == true || data["flag_hide_first_warn"] == undefined) {
                                var other = false;
                            } else {
                                var other = true;
                            }
                            chrome.storage.local.set({"flag_hide_first_warn": other}, function(response) {
                            });
                        })

                    }, false);
        } catch (e) {
            console.log(e);
        }
    },
    hideWarn: function(doc) {
        try {
            var elem = doc.getElementById("firstTimeWarningDDS");
            var opac = window.getComputedStyle(elem, null).getPropertyValue("opacity");
            if (opac > 0) {
                fadeEffect.init(doc, "firstTimeWarningDDS", 0);
                MySidebar.MiscFunc.displayNone(elem);
                //alert("hello");
            }
        } catch (e) {
            alert(e);
        }
    },
    displayNone: function(elem) {
        //clearTimeout(hideTO);

        setTimeout(function() {

            elem.style.display = "none";
        }, 500);
        //clearTimeout(hideTO);
    }
};
function oninit() {

    var thisUrl = document.URL;
    console.log(thisUrl);
    var splitUrl = thisUrl.split(".");
    if (splitUrl.length > 0) {
        var extension = splitUrl.pop();
        if (extension === "pdf") {
//            alert("this is pdf!");
            return;
        }
    }

    var DefaultSearchRepository = new searchRepository;
    var DefaultShareRepository = new shareRepository;
    MySidebar.MiscFunc.displayContent(document, DefaultShareRepository, DefaultSearchRepository);
    chrome.storage.local.get("flag_hide_first_warn", function(data) {
        //console.log(data["flag_hide_first_warn"]);
        if (data["flag_hide_first_warn"] == undefined || data["flag_hide_first_warn"] == false) {
            //MySidebar.MiscFunc.buildFirstTimeWarning(document);
        }
    });
}

window.addEventListener("load", oninit, false);