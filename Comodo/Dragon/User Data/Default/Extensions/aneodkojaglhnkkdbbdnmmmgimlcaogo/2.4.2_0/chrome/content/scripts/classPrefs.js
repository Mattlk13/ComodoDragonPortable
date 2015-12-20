var Prefs = {
    getValue : function getValue(key){
        var value = true;

        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
        var branch = prefs.getBranch("extensions.DDS.");
            
        if(branch.getPrefType(key)){
                
                value = branch.getBoolPref(key);
        }
            
        return value;
            
    },
    setValue : function setValue(key, value){
        try {
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS.");
            //var children = branch.getChildList("", {});
            //alert(children);
            branch.setBoolPref(key, value);
        } catch(e) {
            alert(e);
        }
    },
    getIValue : function getIValue(key){
        /// get int value ///
        var value = "";
        try{
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS.");
            //var children = branch.getChildList("", {});
            //alert(children);
            if(branch.getPrefType(key)){
                value = branch.getIntPref(key);
            }
        }catch(e){
            alert(e)
        }
        return value;   
        
        },
    setIValue : function setIValue(key, value){
        /// set int value///
        try {
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS.");
            //var children = branch.getChildList("", {});
            //alert(children);
            
            branch.setIntPref(key, value);
        } catch(e) {
            alert(e);
        }
    },
    getCValue : function getCValue(key){
        var value= "";
        try{
            
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS.");
            //var children = branch.getChildList("", {});
            //alert(children);
            
            if(branch.getPrefType(key)){
                value = branch.getCharPref(key);    
            }
        } catch(e){alert(e)}
        return value; 
    },
    setCValue : function setCValue(key, value){
        try{
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS.");
            //var children = branch.getChildList("", {});
            //alert(children);
            branch.setCharPref(key, value);
        }catch(e){alert(e)}
    },
    deleteThis : function deleteThis(key){
        try{
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
        var branch = prefs.getBranch("extensions.DDS.");
        branch.clearUserPref(key);
        }catch(e){alert(e)}
    },
    restoreDefaults: function restoreDefaults(){
        try{
            var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefService);
            
            var branch = prefs.getBranch("extensions.DDS");
            branch.deleteBranch("");
        }catch(e){alert(e);}
    }
    
}