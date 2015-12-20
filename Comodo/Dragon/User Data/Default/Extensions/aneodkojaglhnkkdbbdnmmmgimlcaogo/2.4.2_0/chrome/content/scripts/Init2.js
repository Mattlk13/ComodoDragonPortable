if ("undefined" == typeof (MySidebar)) {
    var MySidebar = {};
}
;
var DraggedElem;

MySidebar.details = {
    MyRightDiv: document.getElementById('sideDragRight'),
    MyLeftDiv: document.getElementById('sideDragLeft'),
    DisplayStateRight: 'hidden',
    DisplayStateLeft: 'hidden'
};

MySidebar.MiscFunc = {
    dragDrop: new MySidebar.dnddragDrop.init,
    init: function init() {

        var thisUrl = document.URL;
        var splitUrl = thisUrl.split(".");
        if (splitUrl.length > 0) {
            var extension = splitUrl.pop();
            if (extension === "pdf") {
//                alert("this is pdf!");
                return;
            }
        }

        var _self = MySidebar.MiscFunc;
        try {
            _self.initSidebarContent();
            document.addEventListener("dragover", _self.dragDrop.startDrag, false);
            document.addEventListener("dragend", _self.dragDrop.docDrop, false);
            document.addEventListener("dragstart", _self.setDraggedElem, false);
            document.addEventListener("mouseover", _self.dragDrop.docDrop, false);

        } catch (e) {
            alert(e);
        }

    },
    eventRightInit: function eventRightInit() {


        try {
            var _self = MySidebar.MiscFunc;
            var RightChildren = MySidebar.details.MyRightDiv.children;
            for (var i = 0; i < RightChildren.length; i++) {
                var allowed = RightChildren[i].getAttribute("data-allowed-type");
                var thisId = RightChildren[i].getAttribute("id");
                switch (thisId) {
                    case "side_google_search" :
                        RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/webSearch.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_wikipedia_search" :
                        RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/wikipedia.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_youtube_search" :
                        RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/youtube.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_translate_search":
                        RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/translate.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_image_search" :
                        RightChildren[i].style.backgroundImage = "url('resource://DnDlogos2/imageSearch.png')";
                        RightChildren[i].style.backgroundColor = "#ffffff";
                        break
                    default:

                }
                RightChildren[i].style.backgroundSize = "cover";
                RightChildren[i].style.backgroundPosition = "center center";

                switch (allowed) {
                    case "text":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowText, false);



                        break;
                    case "images":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowImages, false);


                        break;
                    case "all":
                        RightChildren[i].addEventListener("dragover", _self.dragDrop.allowDrop.allowAll, false);

                        break;
                }
                RightChildren[i].addEventListener("drop", _self.dragDrop.sideDropSearch, false);
                RightChildren[i].addEventListener("dragenter", _self.dragDrop.addHoverEfect2, false);
                RightChildren[i].addEventListener("dragleave", _self.dragDrop.removeHoverEfect2, false);

            }
        } catch (e) {
            alert(e)
        }


    },
    eventLeftInit: function eventLeftInit() {
        try {
            var _self = MySidebar.MiscFunc;
            var LeftChildren = MySidebar.details.MyLeftDiv.children;
            for (var i = 0; i < LeftChildren.length; i++) {
                var allowed = LeftChildren[i].getAttribute("data-allowed-type");
                var thisId = LeftChildren[i].getAttribute("id");
                switch (thisId) {
                    case "side_facebook" :
                        LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/facebook.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_twitter" :
                        LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/twitter.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_googleplus" :
                        LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/google+.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_pinterest":
                        LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/pinterest.png')";
                        LeftChildren[i].style.backgroundColor = "#ffffff";
                        break
                    case "side_linkedin" :
                        LeftChildren[i].style.backgroundImage = "url('resource://DnDlogos2/linkedin.png')";
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
            alert(e)
        }
    },
    setDraggedElem: function setDraggedElem(e) {

        DraggedElem = e.target;


    },
    initSidebarContent: function addSidebarContent() {
        var _self = MySidebar.MiscFunc;
        try {
            _self.eventRightInit();
            _self.eventLeftInit();

        } catch (e) {
            alert(e);
        }
    }
}

window.addEventListener("load", function() {
    MySidebar.MiscFunc.init();
}, false)