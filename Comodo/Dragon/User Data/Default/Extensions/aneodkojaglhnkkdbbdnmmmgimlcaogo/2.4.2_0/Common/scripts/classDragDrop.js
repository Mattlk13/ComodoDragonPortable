if ("undefined" === typeof (MySidebar)) {
    var MySidebar = {};
}
;

MySidebar.dnddragDrop = {
    init: function(setting) {
        this.setting = setting;
    }
};

MySidebar.dnddragDrop.init.prototype = {
    Common: new MySidebar.Common.init,
    getPosition: function getPosition(e) {
        e = e || window.event;
        var thisPosition = {
            X: e.pageX,
            Y: e.pageY
        };
        return thisPosition;
    },
    startDrag: function startDrag(e) {
        try {
            //console.log("startDrag");
            var _self = MySidebar.dnddragDrop.init.prototype;
            var myPos = _self.getPosition(e);
            if (myPos.X >= window.innerWidth - (window.innerWidth / 3)) {
                _self.Common.showRightSidebar();
            } else if (myPos.X <= window.innerWidth / 3) {
                _self.Common.showLeftSidebar();
            } else if (myPos.X > window.innerWidth / 3 && myPos.X < window.innerWidth - (window.innerWidth / 3)) {
                _self.Common.hideSidebars();
            }

        } catch (e) {
            alert(e);
        }

    },
    endDrag: function(e)
            // for Chrome only
            {
                try
                {
                    var mouseX = e.clientX;/*e.screenX;*//*e.pageX;*/
                    var mouseY = e.clientY;/*e.pageY;*/
                    if ((mouseY > 0 && mouseY < window.innerHeight - 10)
                            && (mouseX > 0 && mouseX < window.innerWidth - 20))
                        return;
                    var _self = MySidebar.dnddragDrop.init.prototype;
                    console.log(window.innerWidth + " : " + window.innerHeight + " ----" + mouseX + " : " + mouseY);
                    _self.Common.hideSidebars();

                } catch (e)
                {
                    console.log("ERROR: " + e);
                }
            },
    docDrop: function docDrop() {
        //console.log("drag end !");
        var _self = MySidebar.dnddragDrop.init.prototype;
        _self.Common.hideSidebars();
        //_self.hidden = true;
    },
    sideDropSearch: function sideDropSearch(event) {
        event.preventDefault();
        var someData = event.dataTransfer.getData('text/plain');
        MySidebar.dnddragDrop.init.prototype.removeHoverEfect2(event);
        var search = new MySidebar.searchFunc.search(this.id, someData, this.getAttribute("data-link"));
        //event.preventDefault();
    },
    sideDropShare : function sideDropShare(event){
	event.preventDefault();
	var someData = event.dataTransfer.getData('text/plain');
	//console.log(someData);
        MySidebar.dnddragDrop.init.prototype.removeHoverEfect2(event);
	var search = new MySidebar.searchFunc.share(this.id, someData, this.getAttribute("data-link"));
        //event.preventDefault();
    },
    allowDrop: {
        allowText: function(event) {
            if (MySidebar.dndBrowser === "Firefox") {
                var isLink = event.dataTransfer.types.contains("text/uri-list") || event.dataTransfer.types.contains("text/x-moz-url");
                if ((!isLink) /*|| ( external == null )*/) {
                    event.preventDefault();
                } else
                {
                    event.stopPropagation();
                }
            } else {
                if ((event.dataTransfer.items[0].type == 'text/plain') &&
                        (event.dataTransfer.items[1].type != 'text/uri-list'))
                {
                    event.preventDefault();
                }
                else
                {
                    event.stopPropagation();
                }
            }
        },
        allowImages: function(event) {
            if (MySidebar.dndBrowser === "Firefox") {
                var isLink = event.dataTransfer.types.contains("text/uri-list") || event.dataTransfer.types.contains("text/x-moz-url");
                if (isLink) {
                    event.preventDefault();
                }
            } else {
                if ((event.dataTransfer.items[0].type == 'text/plain') &&
                        (event.dataTransfer.items[1].type == 'text/uri-list'))
                {
                    event.preventDefault();
                }
            }
        },
        allowAll: function(event) {
            event.preventDefault();
        }
    },
    addHoverEfect2: function addHoverEffect2(event) {
        var thisId = null;
        var node = null;
        thisId = event.target.id;
        var DefaultSearchRepository = new searchRepository;
        var DefaultShareRepository = new shareRepository;
        var searchChildren = DefaultSearchRepository.defaultElements;
        var shareChildren = DefaultShareRepository.defaultElements;
        for (var i = 0; i < searchChildren.length; i++) {
            var foundId = searchChildren[i].id;
            if (thisId == foundId) {
                event.target.style.backgroundImage = "url('" + DefaultSearchRepository.getImagePath(searchChildren[i].imgHoverIcon) + "')";
                event.target.style.backgroundColor = searchChildren[i].bgHoverColor;
            }
        }

        for (var i = 0; i < shareChildren.length; i++) {
            var foundId = shareChildren[i].id;
            if (thisId == foundId) {
                event.target.style.backgroundImage = "url('" + DefaultShareRepository.getImagePath(shareChildren[i].imgHoverIcon) + "')";
                event.target.style.backgroundColor = shareChildren[i].bgHoverColor;
            }
        }
        event.preventDefault();

        return false;
    },
    removeHoverEfect2: function removeHoverEfect2(event) {
        var thisId = null;
        var node = null;
        thisId = event.target.id;


        var DefaultSearchRepository = new searchRepository;
        var DefaultShareRepository = new shareRepository;
        var searchChildren = DefaultSearchRepository.defaultElements;
        var shareChildren = DefaultShareRepository.defaultElements;
        for (var i = 0; i < searchChildren.length; i++) {
            var foundId = searchChildren[i].id;
            if (thisId == foundId) {
                event.target.style.backgroundImage = "url('" + DefaultSearchRepository.getImagePath(searchChildren[i].imgIcon) + "')";
                event.target.style.backgroundColor = "#ffffff";
            }
        }

        for (var i = 0; i < shareChildren.length; i++) {
            var foundId = shareChildren[i].id;
            if (thisId == foundId) {
                event.target.style.backgroundImage = "url('" + DefaultShareRepository.getImagePath(shareChildren[i].imgIcon) + "')";
                event.target.style.backgroundColor = "#ffffff";
            }
        }
        event.preventDefault();

        return false;
    }
};