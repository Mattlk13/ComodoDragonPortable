// alert("hello");
//document.getElementById("antivirusMessage").innerHTML = "Comodo Dragon!!";
// A $( document ).ready() block.

(function ($) {

    /**
    * @function
    * @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
    * @param {function} handler A function to execute at the time when the element is inserted
    * @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
    * @example $(selector).waitUntilExists(function);
    */

    $.fn.waitUntilExists = function (handler, shouldRunHandlerOnce, isChild) {
        var found = 'found';
        var $this = $(this.selector);
        var $elements = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);

        if (!isChild) {
            (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
                window.setInterval(function () { $this.waitUntilExists(handler, shouldRunHandlerOnce, true); }, 500)
            ;
        }
        else if (shouldRunHandlerOnce && $elements.length) {
            window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
        }

        return $this;
    }

}(jQuery));


var closeDiffButton = 0;
var closefov = 0;
var closeOSButton = 0;
var closeVersionButton = 0;
var closeBundledButton = 0;
var closeSureButton = 0;
var closeDownloadButton = 0;


$(document).ready(function () {
    $(function () {
        $("#buttonDownload").off('click');
        $("#closeButton").on("click", (function (e) {
            $("#select_os").hideBalloon();
            closeOSButton = 0;
        }));
    });

    $(window).resize(function () {
        if (closeDiffButton == 1) {
            $("#need_other_version").hideBalloon();
            $("#need_other_version").showBalloon();
        }
        if (closefov == 1) {
            $("a[href='/flashplayer/otherversions/']").hideBalloon();
            $("a[href='/flashplayer/otherversions/']").showBalloon();
        }
        if (closeOSButton == 1) {
            $("#select_os").hideBalloon();
            $("#select_os").showBalloon();
        }
        if (closeVersionButton == 1) {
            $("#select_version").hideBalloon();
            $("#select_version").showBalloon();
        }
        if (closeBundledButton == 1) {
            $("#offerCheckbox").hideBalloon();
            $("#offerCheckbox").showBalloon();
        }
        if (closeSureButton == 1) {
            $("#mainSection").hideBalloon();
            $("#mainSection").showBalloon();
        }
        if (closeDownloadButton == 1) {
            $("#buttonDownload").hideBalloon();
            $("#buttonDownload").showBalloon();
        }
    });

    $('body').on('click', '#closeDiffButton', function (e) {
        $("#need_other_version").hideBalloon();
        closeDiffButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closefov', function (e) {
        $("a[href='/flashplayer/otherversions/']").hideBalloon();
        closefov = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closeOSButton', function (e) {
        $("#select_os").hideBalloon();
        closeOSButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closeVersionButton', function (e) {
        $("#select_version").hideBalloon();
        closeVersionButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closeBundledButton', function (e) {
        $("#offerCheckbox").hideBalloon();
        closeBundledButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closeSureButton', function (e) {
        $("#mainSection").hideBalloon();
        closeSureButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#closeDownloadButton', function (e) {
        $("#buttonDownload").hideBalloon();
        closeDownloadButton = 0;
        e.preventDefault();
    });

    $('body').on('click', '#DOFButton', function (e) {
        $('#offerCheckbox').click();//('checked', false); // Unchecks it
        $('#buttonDownload').get(0).click();//trigger('click');
        setTimeout(
            function () {
                window.location.href = $("#buttonDownload").attr("href");
            }, 200);
    });

    $("a[href*='/flashplayer/otherversions/']").waitUntilExists(
	        function () {
	            closefov = 1;
	            $("a[href*='/flashplayer/otherversions/']").showBalloon({
	                position: "right",
	                tipSize: 24,
	                css: {
	                    opacity: "1",
	                    padding: '10px',
	                    fontSize: '150%',
	                    fontWeight: 'bold',
	                    backgroundColor: '#FFFFFF',
	                    color: '#000000'
	                },
	                contents: ' <div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp<a id="closefov" href="#"> X </a> <br/> <br/> <div style="font-weight: normal;text-align:center;"> Please click this link'
	            });
	        });


    $("#need_other_version").waitUntilExists(
        function () {
            closeDiffButton = 1;
            $("#need_other_version").showBalloon({
                position: "right",
                tipSize: 24,
                css: {
                    opacity: "1",
                    padding: '10px',
                    fontSize: '150%',
                    fontWeight: 'bold',
                    backgroundColor: '#FFFFFF',
                    color: '#000000'
                },
                contents: ' <div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp<a id="closeDiffButton" href="#"> X </a> <br/> <br/> <div style="font-weight: normal;text-align:center;"> Please click this link'

            });
        });

    $("#select_os").waitUntilExists(
        function () {
            closeOSButton = 1;
            $("#select_os").showBalloon({
                position: "top",
                tipSize: 24,
                css: {
                    opacity: "1",
                    padding: '10px',
                    fontSize: '150%',
                    fontWeight: 'bold',
                    backgroundColor: '#FFFFFF',
                    color: '#000000'
                },
                contents: ' <div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp<a id="closeOSButton" href="#"> X </a> <br/> <br/> <div style="font-weight: normal;text-align:center;"> Select your operating system '

            });
            $("#select_os").on('change', function () {
                $("#select_os").hideBalloon();
                closeOSButton = 0;
                if ($("#select_os").find(":selected").text().indexOf("Windows") > -1) {
                    closeVersionButton = 1;		
					var check = setInterval( function() {		
						if ($("#select_version").is(':enabled')) {
							clearInterval(check);
							var optionText = $("#select_version").find(":contains('Chromium')").text();
							$("#select_version").showBalloon({
								position: "bottom",
								tipSize: 24,
								css: {
									opacity: "1",
									padding: '10px',
									fontSize: '150%',
									fontWeight: 'bold',
									backgroundColor: '#FFFFFF',
									color: '#000000'
								},
								contents: '<div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp<a id="closeVersionButton" href="#"> X </a> <br/> <br/> <div style="font-weight: normal;text-align:center;">  Select <div style="font-weight: bold;">' + optionText + '</div> to install Flash Player for your <br/> browser.'
							});
						}	
					}, 100);
                }
                else {
                    $("#select_version").hideBalloon();
                    closeVersionButton = 0;
                }
            });
        }); 

    $("#select_version").waitUntilExists(
    	function () {
    	    $("#select_version").on('change', function () {
    	        $("#select_version").hideBalloon();
    	        closeVersionButton = 0;
    	        $("#offerCheckbox").waitUntilExists(
                        function () {
                            $("#offerCheckbox").showBalloon({
                                position: "top",
                                tipSize: 24,
                                css: {
                                    opacity: "1",
                                    padding: '10px',
                                    fontSize: '150%',
                                    fontWeight: 'bold',
                                    backgroundColor: '#FFFFFF',
                                    color: '#000000'
                                },
                                contents: '<div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<a id="closeBundledButton" href="#"> X </a> <div style="text-align:center;font-weight: bold;"> <br/> Are you sure you want to install <br/>the bundled software?'
                            });
                        });
    	        closeBundledButton = 1;
    	        if ($("#buttonDownload").val() == "default") {
    	            $("#offerCheckbox").hideBalloon();
    	            closeBundledButton = 0;
    	        }
    	        if ($('#offersInformationPane').css('display') == 'none') {
    	            setTimeout(function () { $("#buttonDownload").hideBalloon() }, 200);
    	            closeDownloadButton = 0;
    	        }
    	        else {
    	            $("#buttonDownload").waitUntilExists(
                        function () {
                            $("#buttonDownload").showBalloon({
                                position: "bottom",
                                tipSize: 24,
                                css: {
                                    opacity: "1",
                                    padding: '10px',
                                    fontSize: '150%',
                                    fontWeight: 'bold',
                                    backgroundColor: '#FFFFFF',
                                    color: '#000000'
                                },
                                contents: '<div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp&nbsp<a id="closeDownloadButton" href="#"> X </a> <br/> <br/> <div style="font-weight: normal; text-align:center;"> Click <div style="font-weight: bold; display: inline;"> Download now </div><div style="font-weight:normal;display: inline">to <br/> begin the install of Flash Player <br/> for your browser'
                            })
                        });
    	            closeDownloadButton = 1;
    	        }
    	    });
    	});

    setTimeout(function () {
        $("#offer").on('change', function () {
            if (!$("#offerCheckbox").attr('checked')) {
                $("#offerCheckbox").hideBalloon();
                closeBundledButton = 0;
            }
            else {
                setTimeout(
					function () {
					    $("#offerCheckbox").showBalloon({
					        position: "top",
					        tipSize: 24,
					        css: {
					            opacity: "1",
					            padding: '10px',
					            fontSize: '150%',
					            fontWeight: 'bold',
					            backgroundColor: '#FFFFFF',
					            color: '#000000'
					        },
					        contents: '<div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<a id="closeBundledButton" href="#"> X </a> <div style="text-align:center;font-weight: bold;"> <br/> Are you sure you want to install <br/>the bundled software?'
					    });
					}, 200);
                closeBundledButton = 1;
            }
        })
    }, 200);

    var interrupted = false;
    $("#bottom_download_button_section").click(function (clickEvent) {
        if (!interrupted && $("#buttonDownload").hasClass("Button download-button ButtonYellow")) {
            $("#offerCheckbox").hideBalloon();
            $("#buttonDownload").hideBalloon();
            closeDownloadButton = 0;
            closeBundledButton = 0;

            if ($("#offerCheckbox").attr('checked')) {
                $("#mainSection").waitUntilExists(
					function () {
					    $("#mainSection").showBalloon({
					        position: "null",
					        tipSize: 24,
					        css: {
					            opacity: "1",
					            padding: '10px',
					            fontSize: '150%',
					            fontWeight: 'bold',
					            backgroundColor: '#FFFFFF',
					            color: '#000000'
					        },
					        contents: '<div style="font-weight: bold;text-align:right;">Comodo Dragon Install Helper &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<a id="closeSureButton" href="#"> X </a> <br/> <br/> <div style="font-size:30px;text-align:center;"> Bundled Software Alert </div><br/> <div style="font-size:15px;font-weight: normal;text-align:center;">The website is attempting to install a software bundle. <br/> <br/> Please confirm you intended to install a software bundle or only <br/> Flash Player. <br/> <br/> <br/> <a href=\"' + $("#buttonDownload").attr("href") + '\" class="speciallink">download software bundle</a><script> $(".speciallink").on("click", function(){});</script> <a class="Button ButtonYellow" href="#" id="DOFButton"> Download only Flash Player</a>'
					    })
					});
                closeSureButton = 1;
                clickEvent.preventDefault();
            }
            interrupted = true;
        }
    });
});