// add listener for content script calls
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
		
	if (request.method == 'SidebarSearch'){
        if (request.url != "") {
			
			chrome.tabs.create({url: request.url});
	
            //gBrowser.selectedTab = gBrowser.addTab(request.url);
			
        }else{
			/* removed custom for now */
		   /*
            try{
                var theKey = request.arguments.key;
            var theID = request.arguments.where;
            var theUrl = Prefs.getCValue(theID+"_link");
            gBrowser.selectedTab = gBrowser.addTab(theUrl+theKey);
            }catch(e){alert(e)}*/
            
     }
    }else if (request.method == 'SidebarShare') {
        
        if (request.url != "") {
           /* var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                    .getService(Components.interfaces.nsIWindowWatcher);
            var win = ww.openWindow(null, request.url,
                         "aboutMyExtension", "chrome,centerscreen", null);*/
			chrome.tabs.create({url: request.url});			 
        }else{
		
			/* removed custom for now */
			/*
            try{
                var theKey = request.arguments.key;
                var theID = request.arguments.where;
                var theUrl = Prefs.getCValue(theID+"_link");
                var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                    .getService(Components.interfaces.nsIWindowWatcher);
                var win = ww.openWindow(null, theUrl+theKey,
                         "aboutMyExtension", "chrome,centerscreen", null);
            }catch(e){alert(e)}*/
        }
    }
	
	return true;	
});