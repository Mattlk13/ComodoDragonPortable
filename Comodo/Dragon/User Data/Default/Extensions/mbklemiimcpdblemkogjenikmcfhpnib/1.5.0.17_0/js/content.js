define(function (require) {
    var exports = {};

(function() {
    var Session = require('./contentSession').Session;
    var messageDispatcher = require('./messaging').MessageDispatcher;
    var affiliateHeaderName = require('./localConfig').AFFILIATE_REQUEST_HEADER_NAME;
    var affiliateHeaderValue = require('./localConfig').AFFILIATE_REQUEST_HEADER_VALUE;
    var instanceIdHeaderName = require('./localConfig').INSTANCE_ID_HEADER_NAME;
    var URI = require('./frameworks/uri').URI;
    var u = require('./contentUtils');
    var historyUrl = document.location.href;
    var isNotIframe = (window == window.top);

    if(isNotIframe) {
        // Enable messaging between content script and background
        messageDispatcher.contentScriptInstall();

        messageDispatcher.sendToBackground({cmd: 'GetIFrameCommScrText'}, function (response) {
            var scriptId = 'cta_linr_script';
            var scriptText = (response ? response : '') +
                         'if((typeof cta_linr != "undefined") && (typeof cta_linr.regInstance == "function")){ \n \
                           document.getElementById("cta_linr_script").setAttribute("cta_linr", "true")\n \
                          }\n';
            u.injectScriptInHeadTop(scriptText, scriptId);

            if ($('#' + scriptId).attr('cta_linr') == 'true') {
                messageDispatcher.sendToBackground({cmd: 'SetCtaLinr', args: 'true'});
            }
        });

        messageDispatcher.sendToBackground({cmd: 'ContentLoaded', args: {url: window.location.href}}, function (response) {
            //empty function
        });

        //Init new tab Security Module
        messageDispatcher.sendToBackground({cmd: 'InitTabSecurityModule'}, function (response) { });

        //Inject script Security module
        injectSecurityModule();

        //Retargeting module
        window.addEventListener('hashchange', function() {
            if(historyUrl != document.location.href) {
                messageDispatcher.sendToBackground({cmd: 'HashChange', args: {"u": document.location.href, "r": historyUrl}});
                historyUrl = document.location.href;
            }
        }, false);

        $(function () {
            // Headers functionality
            messageDispatcher.sendToBackground({cmd: 'GetInstanceId' }, function (instanceId) {
                $.ajaxSetup({
                    'beforeSend': function (xhr) {
                        xhr.setRequestHeader(affiliateHeaderName, affiliateHeaderValue);
                        xhr.setRequestHeader(instanceIdHeaderName, instanceId);
                    }
                });
            });
        });

    } else {
        injectSecurityModule();
    }

    function injectSecurityModule() {
        //Injection Security Module module
        messageDispatcher.sendToBackground({cmd: 'GetSecurityModuleScript', args: {"u": document.location.href, f: isNotIframe}}, function (response) {
            var scriptId = 'security_module_script';
            var scriptText = (response ? response : '');
            
            //Listen data from Security Module content scripts 
            window.addEventListener('sendToExtension', function (e) { 
                var data = e.detail;
                messageDispatcher.sendToBackground({cmd: 'SetSecurityModule', args: data}, function (response) { });
            }, false);

            //Injection Security Module content scripts
            var execute =  new Function( 'return ' + scriptText); 
            execute(messageDispatcher);

            //Also Injection Security Module content scripts
            /*$(function() {
                u.injectScriptInHeadTop(scriptText, scriptId);
            });*/
        });
    }

}).call(this);

return exports;

});
