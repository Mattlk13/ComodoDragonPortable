if ("undefined" == typeof(MySidebar)) {
  var MySidebar = {};
};


MySidebar.Options ={
    init : function(){
        try {

        }catch (e){alert(e);}
        
    },
    displayRepo : function displayRepo(Rep, div){
        try{
            var se_repo = Rep;
            var content = "";
            var prefElemChildren = Prefs.getIValue(se_repo.itemName+"_CustomChildrenNumber");
            var children = Rep.defaultElements;
            for (var i = 0; i < children.length; i++){
                var status = Prefs.getValue(children[i].id+"_enabled");
                console.log(status);
                if (status != false){
                    var checked = "checked";
                }else{
                    var checked = ""; 
                }
                //console.log(checked);
                content = content + "<div class='opt_repo_item' id='" + children[i].id + "' data-allowed-type='" + children[i].acceptType + "' style='background: url(\"resource://DnDlogos2/" + children[i].imgHoverIcon + "\"); background-color:" + children[i].bgHoverColor + "' ><input type='checkbox' name='status_" + children[i].name + "' value='" + status + "' " + checked + " onclick='MySidebar.Options.changeElemStatus(this);'></div>";
                //content = content + "<div style='display:block;'> <div class='opt_repo_item' id='"+children[i].id+"' data-allowed-type='"+children[i].acceptType+"' ><input type='checkbox' name='status_"+children[i].name+"' value='"+status+"' "+ checked +" onclick='MySidebar.Options.changeElemStatus(this);'>"+children[i].content+"</div></div>";
            }
            
            if (prefElemChildren != "" ) {
                for (var j = 1; j <= prefElemChildren; j++){
                    var thisName = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_name");
                    var thisLink = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_link");
		    var thisLogo = Prefs.getCValue(se_repo.itemName+"_CustomChild_"+j+"_logo");
                    var status = Prefs.getValue(se_repo.itemName+"_CustomChild_"+j+"_enabled");
                    //console.log(status);
                    if (status != false) {
                        var checked = "checked"; 
                    }else{
                        var checked = "";
                    }
                    var linkToRemove = se_repo.itemName+"_CustomChild_"+j;

                    content = content + "<div class='opt_repo_item' id='" + se_repo.itemName + "_CustomChild_" + j + "' data-allowed-type='all' style='background: url(" + thisLogo + "); background-color:#ddd;'><input type='checkbox' name='status_" + thisName + "' value='" + status + "' " + checked + " onclick='MySidebar.Options.changeElemStatus(this);' ><h2 class='customName'>" + thisName + "</h2><div class='removeThis' id='removeThis_" + linkToRemove + "' onclick='MySidebar.Options.removeElement(\""+linkToRemove+"\");' style='background: url(\"resource://DnDlogos2/removeOptBtn.png\"); background-repeat:no-repeat; background-position:center;'></div></div>";
                }
            }
            content = content + "<div class='addNewOpt' id='addNew_" + se_repo.itemName + "' style='background: url(\"resource://DnDlogos2/addNewOptBckg.png\");'></div>";
            div.innerHTML = content;
        }catch(e){alert(e)}
	
    },
    changeElemStatus : function changeElemStatus(checkbox){
        try {
            
            var newVal;
            var parentId = checkbox.parentNode.id;
            var status = Prefs.getValue(parentId+"_enabled");
            console.log(status);
            if (status == true) {
                newVal = false;
            }else{
                newVal = true;
            }
            console.log(newVal);
            Prefs.setValue(parentId+"_enabled", newVal);
            
        } catch(e) {
            alert(e);
        }
        location.reload();
        
    },
    removeElement : function removeElement(id){
    try{
        
        var splitId = id.split("_");
        var repo_name = splitId[0];
        var prefElemChildren = Prefs.getIValue(repo_name+"_CustomChildrenNumber");
        console.log(repo_name);
        //reposition the other elements
        var deletedElemIndex = parseInt(splitId[2]);
        console.log(deletedElemIndex);
        
        for(var i = deletedElemIndex; i< prefElemChildren; i++){
            var j = i+1;
            var nameValueToBe = Prefs.getCValue(repo_name+"_CustomChild_"+j+"_name");
            var linkValueToBe = Prefs.getCValue(repo_name+"_CustomChild_"+j+"_link");
	    var logoValueToBe = Prefs.getCValue(repo_name+"_CustomChild_"+j+"_logo");
            var enbledValueToBe = Prefs.getValue(repo_name+"_CustomChild_"+j+"_enabled");
            
            Prefs.setCValue(repo_name+"_CustomChild_"+i+"_name", nameValueToBe);
            Prefs.setCValue(repo_name+"_CustomChild_"+i+"_link", linkValueToBe);
	    Prefs.setCValue(repo_name+"_CustomChild_"+i+"_logo", logoValueToBe);
            Prefs.setValue(repo_name+"_CustomChild_"+i+"_enabled", enbledValueToBe);
            
        }
        //delete the keys of this element
        Prefs.deleteThis(repo_name+"_CustomChild_"+prefElemChildren+"_name");
        Prefs.deleteThis(repo_name+"_CustomChild_"+prefElemChildren+"_link");
	Prefs.deleteThis(repo_name+"_CustomChild_"+prefElemChildren+"_logo");
        Prefs.deleteThis(repo_name+"_CustomChild_"+prefElemChildren+"_enabled");
        
        //decrement number of custom elements
        Prefs.setIValue(repo_name+"_CustomChildrenNumber", prefElemChildren-1);
        console.log(prefElemChildren-1);
        
        location.reload();
    }catch(e){
        alert(e);
    }
    },
    addSearch : function addSearch(){
        try {
            var se_repo = new searchRepository;
            //var parent = document.getElementsByName("addSearchEngine")[0];
            var se_name = document.getElementsByName("searchEngineName")[0].value;
            var se_link = document.getElementsByName("searchEngineLink")[0].value;
            var se_logo = document.getElementsByName("searchEngineLogoUrl")[0].value;
            var se_number = Prefs.getIValue(se_repo.itemName+"_CustomChildrenNumber");
            var new_se_number;
            if (se_number != "") {
                new_se_number = se_number + 1; 
            }else{  
                new_se_number = 1;
            }
            Prefs.setIValue(se_repo.itemName+"_CustomChildrenNumber", new_se_number);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_name", se_name);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_link", se_link);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_logo", se_logo);
            //console.log("SearchEngine_"+new_se_number+"_link"+ se_link);
            Prefs.setValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_enabled", true);
            location.reload();
        } catch(e) {
            alert(e);
        }
         
    },
    addSocial : function addSocial(){
        try {
            var se_repo = new shareRepository;
            //var parent = document.getElementsByName("addSearchEngine")[0];
            var se_name = document.getElementsByName("socialNetworkName")[0].value;
            var se_link = document.getElementsByName("socialNetworkLink")[0].value;
            var se_logo = document.getElementsByName("socialNetworkLogoUrl")[0].value;
            var se_number = Prefs.getIValue(se_repo.itemName+"_CustomChildrenNumber");
            var new_se_number;
            if (se_number != "") {
                new_se_number = se_number + 1; 
            }else{  
                new_se_number = 1;
            }
            Prefs.setIValue(se_repo.itemName+"_CustomChildrenNumber", new_se_number);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_name", se_name);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_link", se_link);
            Prefs.setCValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_logo", se_logo);
            //console.log("SearchEngine_"+new_se_number+"_link"+ se_link);
            Prefs.setValue(se_repo.itemName+"_CustomChild_"+new_se_number+"_enabled", true);
            location.reload();
        } catch(e) {
            alert(e);
        }
    },
    restoreDefaults : function restoreDefaults(){
        try{
            //console.log("yellow");
            Prefs.restoreDefaults();
            location.reload();
        }catch(e){alert(e);}
        
    }
    
}

window.addEventListener("load", function load(event){
    try {
        var myOpt = MySidebar.Options;
        var searchRep = new searchRepository;
        var shareRep = new shareRepository;
        var sRepodiv = document.getElementById('searchRepo');
        var shRepodiv = document.getElementById('shareRepo');
        myOpt.displayRepo(searchRep, sRepodiv);
        myOpt.displayRepo(shareRep, shRepodiv);
        document.getElementById('addNewSearch').addEventListener("click", function() {
            myOpt.addSearch();
        }, false);
        document.getElementById('addNewNetwork').addEventListener("click", function() {
            myOpt.addSocial();
        }, false);
        document.getElementById("restoreDefaults").addEventListener("click", function() {
            myOpt.restoreDefaults()
        }, false);
    } catch(e) {
        alert(e);
    }
},false);