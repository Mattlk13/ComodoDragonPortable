if ("undefined" == typeof (MySidebar)) {
    var MySidebar = {};
}
;

MySidebar.Common = {
    init: function(setting) {
        this.setting = setting;
    },
}
MySidebar.Common.init.prototype = {
    animate: function animate(elem, style, unit, from, to, time) {
        if (!elem)
            return;
        var start = new Date().getTime(),
                timer = setInterval(function() {
                    var step = Math.min(1, (new Date().getTime() - start) / time);
                    elem.style[style] = (from + step * (to - from)) + unit;
                    if (step == 1)
                        clearInterval(timer);
                }, 25);
        elem.style[style] = from + unit;
    },
    delegate: function delegate(that, thatMethod, args) {
        return function() {
            if (args == undefined)
                return thatMethod.apply(that, arguments);
            else {
                for (var i = 0; i < arguments.length; i++)
                    args.push(arguments[i])
                return thatMethod.apply(that, args);
            }
        }
    },
    showRightSidebar: function showRightSidebar() {
        var _self = MySidebar.Common.init.prototype;
        if (MySidebar.details.DisplayStateRight == 'hidden') {
            document.getElementById('sideDragRight').style.display = "block";
            _self.animate(document.getElementById('sideDragRight'), "right", "px", -205, 0, 200);
            MySidebar.details.DisplayStateRight = 'visible';
            _self.arrangeImages("sideDragRight");
        }
    },
    showLeftSidebar: function showLeftSidebar() {
        var _self = MySidebar.Common.init.prototype;
        if (MySidebar.details.DisplayStateLeft == 'hidden') {
            document.getElementById('sideDragLeft').style.display = "block";
            _self.animate(document.getElementById('sideDragLeft'), "left", "px", -205, 0, 200);
            MySidebar.details.DisplayStateLeft = 'visible';
            _self.arrangeImages("sideDragLeft");
        }
    },
    hideSidebars: function hideSidebars() {
        var _self = MySidebar.Common.init.prototype;
        //hide right
        if (MySidebar.details.DisplayStateRight == 'visible') {
            _self.animate(document.getElementById('sideDragRight'), "right", "px", 0, -205, 200);
            setTimeout(function() {
                document.getElementById('sideDragRight').style.display = "none";
            }, 250);

            MySidebar.details.DisplayStateRight = 'hidden';
        }
        //hide left
        if (MySidebar.details.DisplayStateLeft == 'visible') {
            _self.animate(document.getElementById('sideDragLeft'), "left", "px", 0, -205, 200);
            setTimeout(function() {
                document.getElementById('sideDragLeft').style.display = "none";
            }, 250);
            MySidebar.details.DisplayStateLeft = 'hidden';
        }
    },
    arrangeImages: function(id) {
        var imgs = document.getElementById(id).getElementsByTagName("img");
        for (var i in imgs) {
            if(imgs[i].className && imgs[i].className=== "child-elements" ){
                var parHeight = imgs[i].parentNode.clientHeight;
                var imgHeight = imgs[i].clientHeight;
                console.log(parHeight + "/" + imgHeight);
                imgs[i].setAttribute("style", "margin-top:" + (parHeight / 2 - imgHeight / 2) + "px");
            }
            

        }
    }

}

