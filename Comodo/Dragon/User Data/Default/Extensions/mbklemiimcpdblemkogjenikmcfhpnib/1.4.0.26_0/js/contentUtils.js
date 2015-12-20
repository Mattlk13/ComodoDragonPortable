define(function (require) {

   var exports = {};

(function () {

    var u = {};

    u.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    u.getAddedGETStr = function (url, paramName, paramValue) {
        var a = url.indexOf("?") > -1 ? "&" : "?";
        a += paramName;
        if (paramValue) {
            a += "=" + paramValue;
        }
        return a;
    }

    u.injectScript = function(code, id){
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = id ? id : '';
        script.text = code;
        document.head.appendChild(script);
    }
    
    u.injectScriptInHeadTop = function(code, id){
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.id = id ? id : '';
        script.text = code;
        head.insertBefore(script, head.firstChild);
    }

    u.generateUUID = function() {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d/16);
            return (c === 'x' ? r : (r&0x7|0x8)).toString(16);
        });
        return uuid;
    }

  exports = u;

}).call(this);

return exports;

});
