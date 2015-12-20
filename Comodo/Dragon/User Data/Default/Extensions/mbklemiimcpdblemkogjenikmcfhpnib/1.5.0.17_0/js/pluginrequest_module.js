define(function (require) { 
    
    var exports = {};
    var URI = require('./frameworks/uri').URI;
    var messageDispatcher = require('./messaging').MessageDispatcher;
    //module can be turned off or on
    var enabled = true;
    var PLUGIN_DOMAIN = 'ad.sanitizer.extension';

    function PluginRequestModule() {

        /**
        * public method
        * point of enter from WebRequestInspector
        **/
        this.processUrl = function (url, tabId, referer) {
            var parsed;
            var domain = URI.parse(url).host_without_www;

            //check for ad.sanitizer.extension domain in url
            if (enabled && domain == PLUGIN_DOMAIN) {
                parsed = parseUrl(url);
                request(parsed.url, parsed.callback, parsed.request_id, tabId, referer);
                return true;
            }

            return false;
        };

        /**
        * private method
        * requesting extracted url for data, constructing string and injecting JS
        * return null
        **/
        function request (url, callback, request_id, tabId, referer) {
            url = decodeURIComponent(url);

            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'text',
                headers: {"data-referer": referer},
                success: function (data) {
                    var code = jsconstruct(data, callback, request_id);
                    injectJS(code, tabId);
                }
            });

        };

        /**
        * private method
        * extracting needed params from url
        * return object
        **/
        function parseUrl (url) {
            var rx = new RegExp(PLUGIN_DOMAIN + '\/(.*)?\/(.*)?\/(.*)$');
            var parts = rx.exec(url);
            return {
                'callback': parts[1],
                'request_id': parts[2],
                'url': parts[3]
            };
        };

        /**
        * private method
        * constructing js call as a plain text, based on returned data from ajax request
        * return string
        **/
        function jsconstruct (request_data, callback, request_id) {
            return callback + "('" + request_id + "', '" + escape(request_data) + "')";
        };

        /**
        * private method
        * using Chrome API, implementation depends on browser
        * return null
        **/
        function injectJS(code, tabId) {
            messageDispatcher.sendToContentScript(tabId, {
                cmd: 'InjectScript',
                args: {code: code}
            });
        };

    }

    exports = PluginRequestModule;

return exports;

});
