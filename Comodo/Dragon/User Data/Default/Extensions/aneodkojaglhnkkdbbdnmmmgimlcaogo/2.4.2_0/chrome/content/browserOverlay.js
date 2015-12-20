
window.addEventListener("load", function load(event){
    try{
    
        window.removeEventListener("load", load, false); //remove listener, no longer needed
        dndprivileged.init(); 
    
    }catch(e){alert(e)}
    
},false);

var SSCProperties = function(){
    var propertiesPage = "chrome://DnD/content/files/options.html"
    gBrowser.selectedTab = gBrowser.addTab(propertiesPage);
}

var TimeoutVar;

var dndprivileged = {
    init: function(){
        //if (window.location.protocol == 'http:' || window.location.protocol == 'https:') {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent)
    {
      appcontent.addEventListener("DOMContentLoaded", dndprivileged.onPageLoad, true);
    }
       // }
    },
    
    onPageLoad: function(aEvent){
        var doc = aEvent.originalTarget; // doc is document that triggered "onload" event
        if (doc instanceof HTMLDocument) {
    // is this an inner frame?
    if (doc.defaultView.frameElement) {
      return;
    }
  }
        if (doc.head == null)
        {
        return;
        }
        try
        {
            var myScripts = [
            {type: "application/javascript", src: "resource://DnDscripts/defineBrowser.js"},
            {type: "application/javascript", src: "resource://DnDCommonScripts/classCommunicate.js"},
            {type: "application/javascript", src: "resource://DnDCommonScripts/classSearchFunc.js"},
            {type: "application/javascript", src: "resource://DnDCommonScripts/classCommon.js"},
            {type: "application/javascript", src: "resource://DndCommonScripts/classDragDrop.js"},
	    {type: "application/javascript", src: "resource://DndCommonScripts/classRepository.js"},
            {type: "application/javascript", src: "resource://DnDscripts/Init2.js"}
            //{type: "application/javascript", src: "resource://DnDscripts/classTest.js"}
            ];
            for (var i=0; i< myScripts.length; i++){
                var script = doc.createElement("script");
                script.type = myScripts[i].type;
                script.src = myScripts[i].src;
                doc.head.appendChild(script);
            }
            var css 			   = doc.createElement("link");
        
            css.type = "text/css";
            css.rel = "stylesheet";
            css.href = "resource://DnDCommonStyle/content_style2.css";
            doc.head.appendChild(css);
        
        
            //--------------------------------------------------------
            
        
        
            var DefaultSearchRepository = new searchRepository;
            var DefaultShareRepository = new shareRepository;
            dndprivileged.displayContent (doc, DefaultShareRepository, DefaultSearchRepository);
	    var WarnFlag = Prefs.getValue("ShowWarn");
	    
            if (WarnFlag == true) {
		dndprivileged.buildFirstTimeWarning(doc);
	    }
            
	    
        
        } catch(e)
        {
        alert(e);
        }
    },
    
    listen_request: function( callback )
    { 
    document.addEventListener("privilegedEvent", function(event)
    {
        try
        {
            //alert("listen request chought");
            
            var node = event.target;
            if (!node || node.nodeType != Node.TEXT_NODE)
              return;
      
            var doc = node.ownerDocument;
            
            callback(JSON.parse(node.nodeValue), doc, function(response)
             {

            });
           
            
        } catch(e)
        {
            alert(e);
        }
    }, false, true);
   
  },
  
  callback: function(request, sender, callback)
  {
  
    if (request.method == 'SidebarSearch' || request.method == 'SidebarShare')
    {
        if (request.url != "") {
            gBrowser.selectedTab = gBrowser.addTab(request.url);
        }else{
            try{
                var theKey = request.arguments.key;
            var theID = request.arguments.where;
            var theUrl = Prefs.getCValue(theID+"_link");
            gBrowser.selectedTab = gBrowser.addTab(theUrl+theKey);
            }catch(e){alert(e)}
            
        }
    }
	
  },
  buildFirstTimeWarning: function (doc){
    try{
	var oDoc  = doc.getElementsByTagName('html');
        var content;
	var embed = doc.createElement('div');
	embed.id = "firstTimeWarningDDS";
	//content bellow
	
	content = "<p>Drag anything to right for searching and to left for sharing.</p>";
	content += "<div id='do_now_show_dds_warn_again'><span>Do not show this message again</span></div>";
	embed.innerHTML = content;
        embed.style.backgroundImage="url('resource://DnDlogos2/arr_bckg.png')";
	embed.style.backgroundRepeat="no-repeat";
	embed.style.backgroundPosition="center";
	//end content
	oDoc[0].appendChild(embed);
	
	fadeEffect.init(doc, "firstTimeWarningDDS", 1);
	clearTimeout(TimeoutVar);
	TimeoutVar = setTimeout(function(){dndprivileged.hideWarn(doc);},5000);
	
	
	doc.addEventListener("dragstart", function(){dndprivileged.hideWarn(doc);}, false);
	var myButton = doc.getElementById("do_now_show_dds_warn_again");
	myButton.addEventListener("click", function(){dndprivileged.hideWarn(doc); Prefs.setValue("ShowWarn", false)}, false);
        
    }catch(e){console.log(e);}
  },
  hideWarn : function(doc){
    try{
	var elem = doc.getElementById("firstTimeWarningDDS");
	var opac = window.getComputedStyle(elem, null).getPropertyValue("opacity");
	if (opac > 0) {
	    fadeEffect.init(doc, "firstTimeWarningDDS", 0);
	    dndprivileged.displayNone(elem);
	    //elem.style.visibility ("hidden");
	    //alert("hello");
	}
    }catch(e){console.log(e)}
  },
  displayNone : function(elem){
	//clearTimeout(hideTO);
	
	var hideTO = setTimeout(function(){elem.style.display = "none";},500);
	//clearTimeout(hideTO);
  },
  displayContent: function displayContent(doc, shareRep, searchRep){
        var oDoc  = doc.getElementsByTagName('html');
        var embed = doc.createElement('div');
        embed.id  = "sideDragRight";
        embed.style.display = "none";
        var embed2 = doc.createElement('div');
        embed2.id = "sideDragLeft";
        embed2.style.display = "none";
        
        dndprivileged.addContent(doc, embed2, shareRep);
        dndprivileged.addContent(doc, embed, searchRep);
        
        oDoc[0].appendChild(embed);
        oDoc[0].appendChild(embed2);
  },
  addContent : function addContent (doc, div, Rep){
        var content = "";
        var children = Rep.defaultElements;
        var k=0;
        
        for (var i = 0; i < children.length; i++){
              var status = Prefs.getValue(children[i].id+"_enabled");
              
              if (status != false) {
                    //content = content + "<div class='side_search_box' id='"+children[i].id+"' data-allowed-type='"+children[i].acceptType+"' ><img  class='child-elements' src='"+children[i].imgIcon+"' alt='"+children[i].name+"' style='display:none;' /></div>";
		    content = content + "<div class='side_search_box' id='"+children[i].id+"' data-allowed-type='"+children[i].acceptType+"' ></div>";
                    k++;
               }
            
	}
        
        function calculateDist(img){
            var thisHeight = img.height;
            var parentHeight = img.parentNode.height;
            if (parentHeight > thisHeight) {
                var marginTop = (parentHeight - thisHeight)/2;
            }else{
                var marginTop = 0-((thisHeight - parentHeight)/2)
            }
            return marginTop;
            
        }
        
        var se_repo = Rep;
        var prefElemChildren = Prefs.getIValue(se_repo.itemName+"_CustomChildrenNumber");
        if (prefElemChildren != "" ) {
                for (var j = 1; j <= prefElemChildren; j++){
                    var thisName = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_name");
                    var thisLink = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_link");
                    var status = Prefs.getValue(se_repo.itemName+"_CustomChild_"+j+"_enabled");
                    var thisLogo = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_logo");
                    thisContent = (thisLogo != "") ? "<img class='child-elements' src='"+thisLogo+"' alt='"+thisName+"' style='display:none;'/>" : thisName;
                    
                    if (status != false) {
                    content = content + "<div class='side_search_box' id='"+se_repo.itemName+"_CustomChild_"+j+"' data-allowed-type='text' data-link='"+thisLink+"'>"+thisContent+"</div>";
                    k++;
                    }
                    
                }
            }
        
        
        div.innerHTML = content;
        
        for (n=0; n< div.childNodes.length; n++) {
            var height = 100 / k;
            div.childNodes[n].setAttribute("style", "height: "+height+"%;");
        }
  }
  
    
}

var fadeEffect=function(){
	return{
		init:function(doc, id, flag, target){
			this.elem = doc.getElementById(id);
			clearInterval(this.elem.si);
			this.target = target ? target : flag ? 100 : 0;
			this.flag = flag || -1;
			this.alpha = this.elem.style.opacity ? parseFloat(this.elem.style.opacity) * 100 : 0;
			this.elem.si = setInterval(function(){fadeEffect.tween()}, 20);
		},
		tween:function(){
			if(this.alpha == this.target){
				clearInterval(this.elem.si);
			}else{
				var value = Math.round(this.alpha + ((this.target - this.alpha) * .05)) + (1 * this.flag);
				this.elem.style.opacity = value / 100;
				this.elem.style.filter = 'alpha(opacity=' + value + ')';
				this.alpha = value
			}
		}
	}
}();

dndprivileged.listen_request(dndprivileged.callback);
