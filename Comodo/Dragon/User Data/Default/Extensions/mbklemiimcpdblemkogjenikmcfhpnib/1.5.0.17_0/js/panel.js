define(function (require) { 

    var exports = {};

    var messageDispatcher = require('./messaging').MessageDispatcher;

/**
 * Widget Panel
 *
 * List found threats & access Options page
 */
var tab_host, tab_url, preventExpand = false;

var catNames = {
            1:'Ad Networks',
            2:'Trackers',
            3:'3<sup>rd</sup> Party Widgets',
            4:'Statistics'
        };

var virtualCat = {
    name: 'Scripts and Widgets',
    blocked: false,
    cat: [2, 3, 4]
}

/**
 * Helper function.
 * Extracts the host name (domain,subdomain,port) from a given URL. Used when scanning URLs by domain. Because
 * URLs come from the browser and they are guaranteed to be valid, we don't need regular expressions to validate
 * them. Also, because this function will be called many times, I tried to keep it as fast and simple as possible.
 * @param {String} url
 * @return {String}
 */
function getHostname (url) {
    var i;
    if ((i = url.indexOf('://')) !== -1) { 
        url = url.substring(i + 3) + '/';
    }

    if ((i=url.indexOf('/')) !== -1) {
        url = url.substring(0, i);
    }

    if ((i = url.indexOf('@')) !== -1 ) {
        url = url.substring(i + 1);
    }

    return url;
}

$(document).ready(function () {

    var panelController = (function ($, self) {
        "use strict";

        var data, isCurrentDomainWhitelisted, sessionThreats, num_threats, pluginState, pluginWasDisabled, isUrlTechnical;
        var removeFromWhitelist = $('#removeFromWhitelist');
        var threats = $('#threats');
        var msgThreatsFound = $('#msgThreatsFound');
        var whiteListScrollElementAPI;

        // Init panel
        function init (options){
            data = options['threatCatsStats'];
            isCurrentDomainWhitelisted = options['isWhitelisted'];
            sessionThreats = options['sessionCount'];
            pluginState = options['pluginState'];

            num_threats = options['threatCount'];
            pluginWasDisabled = num_threats === -1;
            isUrlTechnical = getIsUrlTechnical(tab_url);

            updateSessionCounter();
            setWhiteListMessage();
            setNumberOfThreats();

            showNotice();

            updatePluginStateButton();
            updateEnableDisableView();

            attachListeners();
            whiteListScrollElementAPI = $('.scroll-panel').jScrollPane({showArrows: true}).data('jsp');
            $('.scroll-panel').removeAttr('tabIndex');
            dropDownList();
        }

        function dropDownList () {
           $('#threats ul li.expandable').bind("click", function (){
                //category blocked - no need to expand
                if (preventExpand) {
                    preventExpand = false;
                    return;
                }
                $(this).next('.drop-list').slideToggle( "complete", function () {
                    whiteListScrollElementAPI.reinitialise();
                    $('.scroll-panel').removeAttr('tabIndex');
                });
                
                $(this).find('.arrow').toggleClass('opened');
            })
        }

        function updatePluginStateButton () {
            // enabled
            if (pluginState) {
                $('#onoff').removeClass('off').addClass('on');
            }else{
                $('#onoff').removeClass('on').addClass('off');
            }
        }

        function updateEnableDisableView () {
            if (!pluginState) {
                threats.hide();
                $('#sessionCounter').hide()
                $('#whiteListFound').hide();
                msgThreatsFound.attr('class', '').addClass('threatsFound');
                msgThreatsFound.addClass('pluginDisabled');
                msgThreatsFound.html('Plugin disabled!');
            } else {
                threats.show();
                $('#sessionCounter').show();
                $('#whiteListFound').show();
                msgThreatsFound.removeClass('pluginDisabled');
                setNumberOfThreats();
                showNotice();
            }

        }

        function setNumberOfThreats () {
            threats.html( buildList(data) );
            if (num_threats === 0 && !isUrlTechnical) {
                msgThreatsFound.attr('class', '').addClass('no-threatsFound');
            }else if ((pluginState && pluginWasDisabled) || isUrlTechnical) {
                msgThreatsFound.attr('class', '').addClass('notScanned');
            }else {
                msgThreatsFound.attr('class', '').addClass('threatsFound');
            }
        }

        function showNotice () {
            if (isCurrentDomainWhitelisted || pluginWasDisabled || isUrlTechnical) {
                msgThreatsFound.html('Not scanned.');
            } else {
                var message = function (n) {
                    if (!n) {
                        return 'No threats were found on this page.';
                    }
                    if (n === 1) {
                        return '1 threat blocked on this page.';
                    }

                    return n + ' threats blocked on this page.';
                }(num_threats);
                msgThreatsFound.html(message);
            }
        }

        // Build threats list
        function buildList (data) {
            var html = '<ul>';
            var virtualAdNetworkEnumHtml = '';
            var virtualCatCount = 0;

            for (var i = 1; i <= 4; i++) {
                var adNetworkEnumHtml = '';
                var blockVerb = 'sanitized';
                var arrowClass = "arrow-invis";
                var liClass = "";
                var catCount = data[i].count;

                //if there is ad network enumeration in category
                if (virtualCat.cat.indexOf(i) >= 0) {
                    var lastVirtualCategory = virtualCat.cat[virtualCat.cat.length-1] === i;
                    virtualCatCount += catCount;
                    blockVerb = 'blocked';

                    if (Object.keys(data[i].adNetworkEnum).length) {
                        for (var j in data[i].adNetworkEnum) {
                            var s = data[i].adNetworkEnum[j].count > 1 ? 's' : '';
                            virtualAdNetworkEnumHtml += '<span class="block_domain">'+data[i].adNetworkEnum[j].domain+'</span><span class="block_request"><strong>'+data[i].adNetworkEnum[j].count+'</strong> request'+s+'</span><br />';
                        }

                        virtualCat.blocked = true;
                    }

                    if (!lastVirtualCategory) {
                        continue;
                    }

                    if (virtualCat.blocked && lastVirtualCategory) {
                        virtualAdNetworkEnumHtml = "<div class='drop-list'><p>"+virtualAdNetworkEnumHtml+"</p></div>";
                        liClass = "expandable";
                        arrowClass = "arrow";
                    }

                    if (!virtualCat.blocked && i !== 1) {
                        html += "<li class='"+liClass+" lastCat'><span class='"+arrowClass+"'></span><b>" + virtualCat.name + ":</b><i>" + virtualCatCount + " detected</i>";
                        html += "</li>"+virtualAdNetworkEnumHtml;
						console.log('i', i)
                    } else {
                        html += "<li class='"+liClass+" lastCat'><span class='"+arrowClass+"'></span><b>" + virtualCat.name + ":</b><i>" + virtualCatCount + " <span"+(virtualCatCount==0 ? '  ': '')+">"+
                        (virtualCatCount==0 ? 'detected' : blockVerb)+"</span></i></li>"+virtualAdNetworkEnumHtml;
                    }

                    continue;
                }

                if (Object.keys(data[i].adNetworkEnum).length) {

                    for (var j in data[i].adNetworkEnum) {
                        var s = data[i].adNetworkEnum[j].count > 1 ? 's' : '';
                        adNetworkEnumHtml += '<span class="block_domain">'+data[i].adNetworkEnum[j].domain+'</span><span class="block_request"><strong>'+data[i].adNetworkEnum[j].count+'</strong> request'+s+'</span><br />';
                    }
                    adNetworkEnumHtml = "<div class='drop-list'><p>"+adNetworkEnumHtml+"</p></div>";
                    liClass = "expandable";
                    arrowClass = "arrow";
                }

                if (!data[i].blocked && i !== 1) {
                    html += "<li class='"+liClass+"'><span class='"+arrowClass+"'></span><b>" + catNames[i] + ":</b><i>" + catCount + " detected</i>";
                    html += "</li>"+adNetworkEnumHtml;
                } else {
                    if (data[i].blocked) {
                        blockVerb = 'blocked';
                    }

                    if( i === 4) { 
                        liClass += " lastCat";
                    }

                    html += "<li class='"+liClass+"'><span class='"+arrowClass+"'></span><b>" + catNames[i] + ":</b><i>" + catCount + " <span"+(catCount==0 ? '  ': '')+">"+
                        (catCount === 0 ? 'detected' : blockVerb) + "</span></i></li>" + adNetworkEnumHtml;

                }
            }
            html += '</ul>';
            return html;
        }


        function setWhiteListMessage() {
            var whiteListFound = $('#whiteListFound');

            if (!isUrlTechnical) {
                if (isCurrentDomainWhitelisted === true) {
                    whiteListFound.find('span').html('This site is in your exceptions.');
                } else {
                    whiteListFound.find('span').html('');
                }
            }
        }

        function getIsUrlTechnical(url) {
            var res = /^chrome/.test(url);
            var newTab = /https:\/\/www\.google\.com\/webhp.*espv=[123]/.test(url);
            return res || newTab;
        }


        function updateSessionCounter(){
            $('#sessionCounter').html('<b>'+sessionThreats+'</b>' + (sessionThreats!=1 ? 'threats' : 'threat') + ' blocked since browser start');
        }


        // Attach some listeners
        function attachListeners(){
            // launch the options page

            $('#optionsButton').on('click', function (e){
                e.preventDefault();
                //self.port.emit('show-options-page');
                chrome.tabs.create({
                    'url':'html/options.html'
                },function(){window.close();});
            });


            $('#onoff').on('click', function (e) {
                e.preventDefault();

                pluginState = !pluginState;
                updatePluginStateButton();
                updateEnableDisableView();

                //self.port.emit('pluginStateChange', pluginState);
                messageDispatcher.sendToBackground({cmd: 'SetPluginState', args: {state: pluginState}})

            });

            $(".blockCategory").on("click", function (e) {
                preventExpand = true;
                e.preventDefault();
                var catId = $(this).data("cid");
                var fail = false;
                if (catId === 1) {
                    messageDispatcher.sendToBackground({cmd: 'SetUserPrefsBlock', args: {state: true}});
                }else{
                    messageDispatcher.sendToBackground({cmd: 'ThreatCategoryStateChanged', args: {checked: false, catId: catId}});
                }
                if (!fail) {
                    $(this).parent().parent().find("i").first().html(catNames[catId]+" will be blocked now onwards");
                    $(this).parent().remove()
                }
            });
        }

        return {
            'init' : init
        };

    }(jQuery, self));

    chrome.tabs.query({ 'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT }, function (tabs) {
        tab_url = tabs[0].url;
        tab_host = getHostname(tabs[0].url);
        messageDispatcher.sendToBackground({cmd: 'GetTabData', args: {tabId: tabs[0].id, host: tab_host}}, panelController.init);

    });
});

return exports;

});
