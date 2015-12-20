define(function (require) { 

    var exports = {};

(function () {

    var ScriptInjector = function () {
        this._config = {
            globalInsert: [],
            insert: []
        };
    };

    // (proto://)?(fqdn)(rest)?
    ScriptInjector.FQDN_RX = /^([a-z]+:\/\/)?([^\/]*\.[a-z]{2,})(\/.*)?$/i;

    // (full_path)[?(params)]
    ScriptInjector.URI_PATH_PART_RX = /^([^\?]*)(\?(.+))?$/;

    ScriptInjector.prototype = {

        // Set the config object compatible with ScriptInjectConfig.config property
        setConfig: function (config) {
            this._config = config;
        },

        // Take the url argument (presumably a current page URL) and suggest the scripts
        // to be executed according the content of the configuration stored in this._config
        suggest: function (url) {
            var self = this;
            var resultGlobal = _.reduce(self._config.globalInsert, function (memo, item) {
                var exceptionFound = _.any(item.exceptions, function (pattern) {
                    return self._match(url, pattern);
                });
                return exceptionFound ? memo : memo.concat(item.scriptUrls);
            }, []);

            var resultTargets = _.reduce(self._config.insert, function (memo, item) {
                var matchFound = _.any(item.targets, function (pattern) {
                    return self._match(url, pattern);
                });
                return matchFound ? memo.concat(item.scriptUrls) : memo;
            }, []);

            return resultGlobal.concat(resultTargets);
        },

        // Helper method matching the url argument with the configuration pattern.
        // The pattern has the form of the object:
        //  {
        //    type: 'PAGE',
        //    fqdn: 'target.example.com',
        //    path: '/some/path'
        //  }
        _match: function (url, pattern) {
            // First, let's compare the domains (FQDNs) of the argument and the pattern:
            var urlParsed = url.match(ScriptInjector.FQDN_RX);
            //wrong url or FQDNs do not match
            if (!urlParsed || urlParsed[2] !== pattern.fqdn) {
                return false;
            }

            // Resolve <type>DOMAIN</type> or type="DOMAIN" cases:
            if (pattern.type === 'FQDN') {
                return true; // FQDN match found, it is enough for "DOMAIN" type
            }

            // Assuming 'PAGE' type pattern here (we use validated config).
            urlParsed = urlParsed[3].match(ScriptInjector.URI_PATH_PART_RX); // ignore args
            var urlPath = urlParsed ? urlParsed[1] : '/'; // no path means a root path

        return urlPath === pattern.path; // do paths match?
    }
  };

    exports.ScriptInjector = ScriptInjector;

}).call(this);

return exports;

});