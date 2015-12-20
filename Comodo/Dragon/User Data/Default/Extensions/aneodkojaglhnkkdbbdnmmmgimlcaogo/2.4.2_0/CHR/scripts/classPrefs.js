var dndPrefs = {
    getValue : function getStatus(key){
        var value = true;
        
        try {
             chrome.storage.local.get(key, function(data){
                var thisReturn = JSON.stringify(data[key]);
                if (thisReturn) {
                    value= thisReturn;
                    //console.log(value);
                }
            });
            
            //value = (thisReturn) ? thisReturn : value;
        } catch(e) {
            alert(e);
        }  
        return value;
            
    },
    setValue : function setStatus(key, value){
        //console.log(key + '~~'+ value)
        var myobj = {};
        myobj[key] = value;
        //console.log(myobj);
        try {
            //chrome.storage.sync.set(myobj, function(){
            chrome.storage.local.set(myobj, function(){
                console.log(myobj);
            });
        } catch(e) {
            alert(e);
        }
    },
    deleteThis : function deleteThis(key){
        try {
            chrome.storage.sync.remove(key, function(key){
                console.log('removed');
            });
        } catch(e) {
            alert(e);
        }
    },
    restoreDefaults: function restoreDefaults(){
        try {
            chrome.storage.sync.clear(function(key, value){
                console.log('cleared');
            });
        } catch(e) {
            alert(e);
        }
    }
    
}