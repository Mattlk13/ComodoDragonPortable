/**
* Contents utils for Security Module
**/
var UTILS = {
	isIframe: (window != window.top),

	sendToExtension : function(data) {
		var event = new CustomEvent('CustomEvent',{detail: data}); 
		event.initEvent('sendToExtension', true, true); 
		window.dispatchEvent(event);
	},

	getMainData: function($el) {
		return {
			'u' : SEC.getURL ? SEC.getURL() : '',
			'kw' : SEC.getKeyword ? SEC.getKeyword() : '',
			's' : SEC.getSearchStart ? SEC.getSearchStart() : '',
			'i' : SEC.getPageIndex ? SEC.getPageIndex() : '',
			'scs' : SEC.getAdSlot ? SEC.getAdSlot($el) : ''
		};
	},

	getClickData: function($el) {
		return {
			'scx' : SEC.getItemType ? SEC.getItemType() : '',
			'sct' : SEC.getClickTitle ? SEC.getClickTitle($el) : '',
			'scd' : SEC.getClickDescription ? SEC.getClickDescription($el) : '',
			'scu' : SEC.getClickURL ? SEC.getClickURL($el) : '',
			'scp' : SEC.getPosition ? SEC.getPosition($el) : '',
		};
	},

	collectData: function($el, clickData) {
		return UTILS.mergeObject(UTILS.getMainData($el), clickData || UTILS.getClickData($el));
	},

	initIframeListener: function() {
		window.addEventListener("message", function(e){
			if(e.data && e.data['secType'] && e.data['secType'] == 'fromIframeSecutityModule') {
				var $el = $('iframe[src*="' + e.data['secURl'].replace(/^http:\/\//, '') + '"]');

				SEC.setItemType(e.data['secClickType']);
				UTILS.sendToExtension(UTILS.collectData($el, e.data['secClick']));
			}
		}, false); 
	},

	mergeObject: function(obj1, obj2) {
		var obj3 = {};

		for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }

		return obj3;
	},

	init: function() {
		//Listen click from iframe
		if(!UTILS.isIframe) {
			UTILS.initIframeListener();
		}

		//Events
		if(typeof(SEC) != 'undefined') {
			for(item in SEC) {
				if(item.indexOf('el_') == 0) {
					$(document).on('click, mousedown', SEC[item], item, function(e) {
						SEC.setItemType(e.data.match(/\d+/)[0]);

						if(!UTILS.isIframe) {
							UTILS.sendToExtension(UTILS.collectData($(e.target)));
						}else {
							window.parent.postMessage({'secType': 'fromIframeSecutityModule', 'secClick' : UTILS.getClickData($(e.target)), 'secURl': document.location.href, 'secClickType': SEC.getItemType()}, '*');
						}
					});
				}
			}
		}
	}
}