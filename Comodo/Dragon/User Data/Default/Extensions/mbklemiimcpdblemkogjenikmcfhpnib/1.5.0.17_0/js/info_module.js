define(function (require) { 
    
    var exports = {};
    var Session = require('./backgroundSession').Session;

    function InfoModule() {
        /**
        * public method
        * log of plugin
        **/
        this.log = function (details) {
            try {
                //log session variable 
                sessionVariable();

                //log from localStorage
                logFromLocalStorage();
            } catch(arr) {}
        };

        this.setLog = function (name, item) {
            try {
                saveLog(name, item);
            }catch(err) {}
        };

        /**
        * private method
        * log session variable 
        **/
        function sessionVariable() {
            console.group("Variables");
            console.log('name - ', chrome.runtime.getManifest().name);
            console.log('version - ', chrome.runtime.getManifest().version);
            console.log('id - ', chrome.runtime.id);
            console.log('affiliateId - ', Session.affiliateId);
            console.log('computerId - ', Session.computerId);
            console.log('serverConfigURL -', Session.serverConfigURL);
            console.log('channelVersion - ', Session.channelVersion);
            console.log('productVersion - ', Session.productVersion);
            console.log('distributedProductId - ', Session.distributedProductId);
            console.log('productId - ', Session.productId);
            console.log('update_url - ', chrome.runtime.getManifest().update_url);
            console.groupEnd();
        };

        /**
        * private method
        * log configs
        **/
        function logFromLocalStorage() {
            var data = localStorage.getItem('info');

            if(data) {
                logs = JSON.parse(data);

                for(item in logs) {
                    console.group(item);

                    for(var j = 0; j < logs[item].length; j++) {
                        console.log(logs[item][j]);
                    }

                    console.groupEnd();
                }
            };
        };

        /**
        * private method
        * save logs in localStorage
        **/
        function saveLog(name, item) {
            var info = localStorage.getItem('info');
            var arr = [];

            if(!info) {
                info = {};
                info[name] = arr;
                info[name].push(item);
                
                localStorage.setItem('info', JSON.stringify(info));
            }else {
                var data = JSON.parse(info);
                
                if(data[name]) {
                    arr = data[name];
                }

                if(arr.length > 150) {
                    arr.shift();
                }

                arr.push(item);
                data[name] = arr;
                
                localStorage.setItem('info', JSON.stringify(data));
            }

            return false;
        };

        /**
        * private method
        * get logs from localStorage
        **/
        function getLog(name) {
            var data = localStorage.getItem('info');

            if(data) {
                data = JSON.parse(data)[name];
            }

            return data;
        };
    }

    exports = InfoModule;

return exports;

});
