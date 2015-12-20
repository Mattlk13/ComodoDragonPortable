$(function () {
    var RE_validateHost=/^(?:[a-zA-Z0-9-?*]+\.)?(?:[a-zA-Z0-9-?*]+\.)+[a-z?*]+(?::[1-9?*][0-9?*]{1,4})?$/;
    var mode = 'all'; //or except_trustedads
    var exceptionInput = $('#input_new_site');
    var exceptionList = [];
    var whiteListScrollElementAPI;//lint to jquery jScrollPane object for div element with ignore list
    var categories = {
        1:'Ads',
        2:'Trackers',
        3:'3<sup>rd</sup> Party Widgets',
        4:'Statistics'
    };
    
    var checkWhiteListLength = function (sites) {
        if (!sites.length) {
            $('.empty-list-label').show();
            $('#remove_selected_whitelist').hide();
        }
        showSel();
    };

    function updatePluginStateButton() {
        var replaceAdSpan = $('#replaceAd');

        // enabled
        if (pluginState) {
            $('#onoff').removeClass('off').addClass('on').text('On');

            replaceAdSpan.parent().removeClass('span-disabled');
            replaceAdSpan.removeClass('disabled');

            $('#pluginOn').addClass('checked');
            $('#pluginOff').removeClass('checked');
        } else {
            $('#onoff').removeClass('on').addClass('off').text('Off');

            replaceAdSpan.parent().addClass('span-disabled');
            replaceAdSpan.addClass('disabled');

            $('#pluginOff').addClass('checked');
            $('#pluginOn').removeClass('checked');
        }
    }

    function stripWWW(host) {
        return host.replace(/^www\./, '');
    }

    function showTotalBlockCount() {
        chrome.extension.sendMessage({cmd:"GetThreatsData"}, function (data) {
            var totalBlockCount = data.totalBlockCount || 0;
            $('#sessionCounter').html(totalBlockCount);
        });
    }

    function launchTotalBlockCount() {
        setInterval(function () {
            showTotalBlockCount();
        }, 1000);

        showTotalBlockCount();
    }

    function showSel() {
        var count = $('#whiteListContainer').find('li:not(.empty-list-label)').length;
        if(count > 0) {
            $('#sel-unsel').show();
        }else {
            $('#sel-unsel').hide();
        }

        whiteListScrollElementAPI.reinitialise();
    }
    
    function writeVersion() {
        var verPlugin = localStorage['version'] ? localStorage['version'] : ''; 
        var verData = localStorage['CIAA'] ? JSON.parse(localStorage['CIAA']).t.v : '';

        $('#version_plugin').text(verPlugin);
        $('#version_data').text(verData);
    }

    function updateSitesWhitelist() {
        chrome.extension.sendMessage({cmd: 'GetSitesInWhitelist'}, function (list) {
            list = list;

            if (exceptionList.length != list.length) {
                $('#whiteListContainer').html('<li class="empty-list-label">No domains in Exceptions list.</li>');
                if (list.length) {
                    $('.empty-list-label').hide();
                    $('#remove_selected_whitelist').show();
                } else {
                    $('#remove_selected_whitelist').hide();
                }

                showSel();

                var html = '';
                for (var i = 0, l = list.length; i < l; i++) {
                    html += '<li><span class="checkbox" id="'+
                        list[i] + '"></span><span class="site_name">'+
                        list[i] + '</span><span class="cross_delete removeHost"></span></li>';
                }

                $('#whiteListContainer').append(html);
                exceptionList = list;
            }
        });
    }

    //SOURCES PROCESS
    chrome.extension.sendMessage({cmd:"GetThreatsData"}, function (data, whiteListData) {
        var sitesWhitelist = data.sitesWhitelist,
            totalBlockCount = data.totalBlockCount || 0,
            dataStore = {};
            mode = data.block == 'all' ? 'all' : 'except_trustedads';
        pluginState = data.pluginState;
        
        
        //FIXME = refactoting this loops
        //PREPARE DATA STORE
        for (var i in data.treats) { //BLOCK - REDIRECT PROPS
            for (var j in data.treats[i]) { //INNER DATA
                for (var l in data.treats[i][j].c) {
                    var catId = data.treats[i][j].c[l].i,
                        catName = categories[catId];

                    if (!dataStore[catName]) {
                        dataStore[catName] = {
                            blocked: (data.whitelistCategories.indexOf(parseInt(catId)) != -1) ? true : false,
                            threats: data.treats[i][j].c[l].s.length,
                            id: catId
                        };
                    } else {
                        dataStore[catName].threats += data.treats[i][j].c[l].s.length;
                    }
                }
            }
        }

        var labels = {
            'Ads': {block: "Deliver TrustedAds from AdTrustMedia", allow: 'Block all Ad Networks'},
            'Trackers': {block: 'Block', allow: 'Allow'},
            '3<sup>rd</sup> Party Widgets': {block: 'Block', allow: 'Allow'},
            'Statistics': {block: 'Block', allow: 'Allow'}
        };

        for (var i in categories) {
            var id = categories[i];
        }

        if (mode == 'except_trustedads') {
            $('#replaceAd').addClass("checked");
        } else {
            $('#replaceAd').removeClass("checked");
        }

        updatePluginStateButton();

        //SITES WHITE LIST INIT
        if (!sitesWhitelist.length) {
            $('#remove_selected_whitelist').hide();
        } else {
            $('.empty-list-label').hide();
            // TODO optimize
            for (var x = 0; x < sitesWhitelist.length; x++) {
                $('#whiteListContainer')
                    .append($('<li><span class="checkbox" id="' +
                        sitesWhitelist[x]+ '"></span><span class="site_name">'+
                        sitesWhitelist[x] +
                        '</span><span class="cross_delete removeHost"></span></li>')
                    );
            }
        }

        showSel();

    });

    //WHITELIST - ADD
    function addSite2Whitelist (text) {
        if (!text) {
            return;
        }

        var wildcard = stripWWW($.trim(text.toLowerCase()));
        var whiteListContainer = $('#whiteListContainer');

        //in case user entered "http://www.hollywood.com/"
        var domainFromFullPath = /^https?:\/\/([^/]*)\/?/.exec(wildcard);
        if (domainFromFullPath && domainFromFullPath[1]) {
            wildcard = stripWWW($.trim(domainFromFullPath[1].toLowerCase()));
        }

        if (wildcard == '' || !RE_validateHost.test(wildcard) ) {
            alert('Wrong domain');
            return;
        }

        chrome.extension.sendMessage({cmd:"SiteInWhitelist", args: {wildcard: wildcard, cmd: 'add'}}, function (result) {
            if (result.success) {
                whiteListContainer.append($('<li><span class="checkbox" id="'+wildcard+'"></span><span class="site_name">'+wildcard+'</span><span class="cross_delete removeHost"></span></li>'));
                exceptionInput.val('');
                $('.empty-list-label').hide();
                $('#remove_selected_whitelist').show(); // show remove-selected-button
            } else {
                alert('Domain already in Exceptions list!');
            }

            showSel();
        });
    }

    //Setting the number of blocked threats
    launchTotalBlockCount();
    writeVersion();

    $(document).on('click', '#addSite2Whitelist', function (e) {
        e.preventDefault();

        var text = exceptionInput.val();
        addSite2Whitelist(text);
    });

    $(document).keypress(function (e) {
        if(e.which == 13 && exceptionInput.is(":focus")) {
            var text = exceptionInput.val();
            addSite2Whitelist(text);
        }
    });

    $(document).on('click', '#remove_selected_whitelist', function (e) {
        e.preventDefault();

        var somethingWasChecked = false;
        // get selected item from the whitelist box
        $('#whiteListContainer').find('span.checked').each(function () {

            var selectedItem = $(this);
            selectedItem.parent().remove();
            var wildcard = selectedItem.attr('id');

            chrome.extension.sendMessage({cmd:"SiteInWhitelist", args: {wildcard: wildcard, cmd: 'remove'}});
            somethingWasChecked = true;
        });

        if(!somethingWasChecked) alert('Select site from list and press "Remove selected"');

        // if the last domain was deleted
        chrome.extension.sendMessage({cmd:"GetSitesInWhitelist"}, checkWhiteListLength);
    });


    $(document).on('click', '.removeHost', function (e) {
        e.preventDefault();
        var selectedItem = $(this);

        // remove from whitelist reference
        var wildcard = selectedItem.prev().prev().attr('id');
        chrome.extension.sendMessage({cmd:"SiteInWhitelist", args: {wildcard: wildcard, cmd: 'remove'}});
        // remove html
        selectedItem.parent().remove();

        // if the last domain was deleted
        chrome.extension.sendMessage({cmd:"GetSitesInWhitelist"}, checkWhiteListLength);
    });

    $(document).on('click', '#replaceAd:not(.disabled)', function (e) {
        var span = $(this);

        if(span.hasClass('checked')) {
            span.removeClass('checked');
            chrome.extension.sendMessage({cmd: 'SetUserPrefsBlock', args: {state: true}});
            mode = 'all';
        }else {
            span.addClass('checked');
            chrome.extension.sendMessage({cmd: 'SetUserPrefsBlock', args: {state: false}});
            mode = 'except_trustedads';
        }
    });

    $(document).on('click', '#select_all', function (e) {
        $('#whiteListContainer span.checkbox').addClass('checked');
    });

    $(document).on('click', '#unselect_all', function (e) {
        $('#whiteListContainer span.checkbox').removeClass('checked');
    });

    $(document).on('click', '#whiteListContainer li span.checkbox', function (e) {
        var span = $(this);
        if (span.hasClass('checked')) {
            span.removeClass('checked');
        } else {
            span.addClass('checked');
        }
    });

    $(document).on('click', '#pluginState span.radio', function (e) {
        var span = $(this),
            spans = span.parents('.fieldset').find('span.radio');

        if (span.hasClass('checked')) {
            return false;
        }

        spans.removeClass('checked');
        span.addClass('checked');

        pluginState = !!$('#pluginOn.checked').length;
        chrome.extension.sendMessage({cmd:"SetPluginState", args:{state: pluginState}});

        updatePluginStateButton();
    });
    
    //init scroll for ignore list
    var element = $('#whitelistScrollContainer').jScrollPane({showArrows: true});  // customising scroll on browsers and license tab 
    whiteListScrollElementAPI = element.data('jsp');

    $('.tab_content > div, #about .license').hide();
    
    $('.tab_content > div:first-child').show();

    $(".left_nav li span").click(function () {
        $(this).next().slideToggle();
        $(this).parent().toggleClass("opened", 2000 );
    });
    
    $(".left_nav>ul>li>a").click(function () {
        $(".left_nav li span").next().slideUp();
        $(".left_nav li span").parent().removeClass("opened", 2000 );
    });
    
    $(".left_nav li a").click(function () {
        $(".left_nav li").removeClass("active"); 
        $(this).parent().addClass("active");

        $(".tab_content>div").fadeOut(300);
        t_content=$(this).attr("href");
        $(t_content).fadeIn(300);
        whiteListScrollElementAPI.reinitialise();
        
        return false;
    });
    
    $(".show_threats_table").click(function () {
        $("#summary .main").fadeOut(200);
        $("#summary .dialog").fadeIn(200);
    });
    
    $(".back_to_main").click(function () {
        $("#summary .dialog").fadeOut(200);
        $("#summary .main").fadeIn(200);
    });
    
    $(".licence_link").click(function () {
        $("#about .main").fadeOut(200);
        $("#about .license").fadeIn(200);
    });
    
    $(".back_to_about").click(function () {
        $("#about .license").fadeOut(200);
        $("#about .main").fadeIn(200);
    });
    
    $(".close").click(function () {
        $(".popup_wrapper").fadeOut();
    });

});
