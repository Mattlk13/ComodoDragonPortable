if ("undefined" == typeof (MySidebar)) {
    var MySidebar = {};
}
;


MySidebar.Options = {
    init: function() {
        try {

        } catch (e) {
            alert(e);
        }

    },
    displayRepo: function displayRepo(Rep, div) {
        try {

            var se_repo = Rep;
            var content = "";
            var status, checked;
            var prefElemChildren;//= Prefs.getValue(se_repo.itemName+"_CustomChildrenNumber");
            var children = Rep.defaultElements;

            chrome.storage.local.get(null, function(data) {

                prefElemChildren = data[se_repo.itemName + "_CustomChildrenNumber"];
                //console.log(prefElemChildren);
                for (var i = 0; i < children.length; i++) {
                    var checked = "";
                    status = data[children[i].id + "_enabled"];
                    if (status == undefined || status == true) {
                        checked = "checked";
                    }
                    content = content + "<div class='opt_repo_item' id='" + children[i].id + "' data-allowed-type='" + children[i].acceptType + "' style='background: url(" + chrome.extension.getURL("images/" + children[i].imgHoverIcon) + "); background-color:" + children[i].bgHoverColor + "' ><input type='checkbox' name='status_" + children[i].name + "' value='" + status + "' " + checked + " ></div>";
                }

                if (prefElemChildren !== undefined && prefElemChildren > 0) {
                    for (var j = 1; j <= prefElemChildren; j++) {
                        var thisName = data[se_repo.itemName + "_CustomChild_" + j + "_name"];
                        var thisLink = data[se_repo.itemName + "_CustomChild_" + j + "_link"];
                        status = data[se_repo.itemName + "_CustomChild_" + j + "_enabled"];
                        var thisLogo = data[se_repo.itemName + "_CustomChild_" + j + "_logo"];
                        //console.log(status);
                        if (status == undefined || status == true) {
                            var checked = "checked";
                        } else {
                            var checked = "";
                        }
                        var linkToRemove = se_repo.itemName + "_CustomChild_" + j;
                        content = content + "<div class='opt_repo_item' id='" + se_repo.itemName + "_CustomChild_" + j + "' data-allowed-type='all' style='background: url(" + thisLogo + "); background-color:#ddd;'><input type='checkbox' name='status_" + thisName + "' value='" + status + "' " + checked + "><h2 class='customName'>" + thisName + "</h2><div class='editThis' id='editThis_" + linkToRemove + "' ></div><div class='removeThis' id='removeThis_" + linkToRemove + "' ></div></div>";
                    }
                }

                content = content + "<div class='addNewOpt' id='addNew_" + se_repo.itemName + "'></div>";
                div.innerHTML = content;

                if (prefElemChildren != undefined && prefElemChildren > 0) {
                    for (var k = 1; k <= prefElemChildren; k++) {
                        var linkToRemove2 = se_repo.itemName + "_CustomChild_" + k;
                        document.getElementById("removeThis_" + linkToRemove2).addEventListener("click", function() {
                            MySidebar.Options.removeElement(this)
                        }, false);
                        document.getElementById("editThis_" + linkToRemove2).addEventListener("click", function() {
                            MySidebar.Options.editElement(this);
                        }, false);
                        var allInputs = document.getElementsByTagName("input");

                        for (var i = 0; i < allInputs.length; i++) {
                            if (allInputs[i].type === 'checkbox') {
                                allInputs[i].addEventListener("click", function() {
                                    MySidebar.Options.saveOption(this);
                                }, false);
                            }

                        }
                    }
                }
            })
        } catch (e) {
            alert(e)
        }

    },
    saveOption: function(elem) {
        try {
            var parentId = elem.parentNode.id;
            var propName = parentId + "_enabled";
//            console.log(propName);
            if (elem.checked) {
                propVal = true;
            } else {
                propVal = false;
            }
            var myobj = {};
            myobj[propName] = propVal;
            chrome.storage.local.set(myobj, function(response) {
//                location.reload();
            });

        } catch (e) {
            alert(e);
        }
        //location.reload();

    },
    editElement: function(elem) {
        var elemId = elem.getAttribute('id');
        var splitId = elemId.split("_");
        var repo_name = splitId[1];
        var DeletedElementIndex = splitId[3];
        chrome.storage.local.get(null, function(data) {
            var seNameProp = data[repo_name + "_CustomChild_" + DeletedElementIndex + "_name"];
            var seLinkProp = data[repo_name + "_CustomChild_" + DeletedElementIndex + "_link"];
            var seLogoProp = data[repo_name + "_CustomChild_" + DeletedElementIndex + "_logo"];
            chrome.tabs.query(
                    {currentWindow: true, active: true},
            function(tabArray) {
                var tab = tabArray[0];
//                console.log("try to get title for tab: "+tab.id+ ", index: "+obj);
                chrome.tabs.sendMessage(tab.id, {method: "ShowDetails", name: seNameProp, link: seLinkProp, logo: seLogoProp, repoInfo: repo_name + "_CustomChild_" + DeletedElementIndex});
            }
            );

        });
    },
    UpdateItem: function(elem) {
        var repoInfo = document.getElementById("NewShareWrap").getAttribute("data-repoInfo");
        var newname = document.getElementsByName("socialNetworkName")[0].value;
        var newlink = document.getElementsByName("socialNetworkLink")[0].value;
        var newlogo = document.getElementsByName("socialNetworkLogoUrl")[0].value;
        var newSeLink = {};
        var newSeLogo = {};
        var newSeName = {};
        newSeName[repoInfo + "_name"] = newname;
        newSeLink[repoInfo + "_link"] = newlink;
        newSeLogo[repoInfo + "_logo"] = newlogo;

        chrome.storage.local.set(newSeName, function(response) {
            document.getElementById(repoInfo).getElementsByTagName("h2")[0].innerHTML = newname;
        });
        chrome.storage.local.set(newSeLink, function(response) {
            //console.log("name set");
        });
        chrome.storage.local.set(newSeLogo, function(response) {
            document.getElementById(repoInfo).style.backgroundImage = "url(" + newlogo + ")";
        });
        chrome.tabs.query(
                {currentWindow: true, active: true},
        function(tabArray) {
            var tab = tabArray[0];
//                console.log("try to get title for tab: "+tab.id+ ", index: "+obj);
            chrome.tabs.sendMessage(tab.id, {method: "HideBox"});
        }
        );
    },
    removeElement: function removeElement(elem) {
        try {

            var elemId = elem.getAttribute('id');
            var splitId = elemId.split("_");
            var repo_name = splitId[1];
            var DeletedElementIndex = splitId[3];
            document.getElementById(elemId).parentNode.remove();

            chrome.storage.local.get(null, function(data) {
//                console.log(data);

                prefElemChildren = data[repo_name + "_CustomChildrenNumber"];
                var newChildrenNumber = prefElemChildren - 1;

                var seNameProp = repo_name + "_CustomChild_" + prefElemChildren + "_name";
                var seLinkProp = repo_name + "_CustomChild_" + prefElemChildren + "_link";
                var seLogoProp = repo_name + "_CustomChild_" + prefElemChildren + "_logo";
                var seEnabledProp = repo_name + "_CustomChild_" + prefElemChildren + "_enabled";
                //console.log(seNameProp+ "//" +seLinkProp+"//"+seLogoProp+"//"+seEnabledProp);
                //var toRemove = [seNameProp, seLinkProp, seLogoProp, seEnabledProp];

                //reposition the other elements
                for (var i = DeletedElementIndex; i < prefElemChildren; i++) {
                    var j = parseInt(i) + 1;
                    var nameValueToBe = data[repo_name + "_CustomChild_" + j + "_name"];

                    var linkValueToBe = data[repo_name + "_CustomChild_" + j + "_link"];
                    var logoValueToBe = data[repo_name + "_CustomChild_" + j + "_logo"];
                    var enbledValueToBe = data[repo_name + "_CustomChild_" + j + "_enabled"];
                    //console.log(nameValueToBe+"/"+linkValueToBe+"/"+logoValueToBe+"/"+enbledValueToBe);
                    var newSeName = {};
                    newSeLink = {};
                    newSeLogo = {};
                    newSeStatus = {};

                    newSeName[repo_name + "_CustomChild_" + i + "_name"] = nameValueToBe;
                    newSeLink[repo_name + "_CustomChild_" + i + "_link"] = linkValueToBe;
                    newSeLogo[repo_name + "_CustomChild_" + i + "_logo"] = logoValueToBe;
                    newSeStatus[repo_name + "_CustomChild_" + i + "_enabled"] = enbledValueToBe;

                    chrome.storage.local.set(newSeName, function() {
                        //console.log(newSeName);
                    });
                    chrome.storage.local.set(newSeLink, function() {
                        //console.log(newSeLink);
                    });
                    chrome.storage.local.set(newSeLogo, function() {
                        //console.log(newSeLogo);
                    });
                    chrome.storage.local.set(newSeStatus, function() {
                        //console.log(newSeStatus);
                    });

                }


                //delete element keys
                chrome.storage.local.remove(seNameProp, function() {
                    //console.log(seNameProp);
                });
                chrome.storage.local.remove(seLinkProp, function() {
                    //console.log(seLinkProp);
                });
                chrome.storage.local.remove(seLogoProp, function() {
                    //console.log(seLogoProp);
                });
                chrome.storage.local.remove(seEnabledProp, function() {
                    //console.log(seEnabledProp);
                });

                var myobj = {};
                myobj[repo_name + "_CustomChildrenNumber"] = newChildrenNumber;

                chrome.storage.local.set(myobj, function(response) {
                    //console.log("set");
                });


            })



            //location.reload();
        } catch (e) {
            alert(e);
        }
    },
    addSearch: function addSearch() {
        try {

            var se_repo = new searchRepository;
            //var parent = document.getElementsByName("addSearchEngine")[0];
            var se_name = document.getElementsByName("searchEngineName")[0].value;
            var se_link = document.getElementsByName("searchEngineLink")[0].value;
            var se_logo = document.getElementsByName("searchEngineLogoUrl")[0].value;
            chrome.storage.local.get(null, function(data) {
                if (data[se_repo.itemName + "_CustomChildrenNumber"]) {
                    se_number = data[se_repo.itemName + "_CustomChildrenNumber"];
                    new_se_number = se_number + 1;
                } else {
                    new_se_number = 1;
                }

                var newSeNumber = {};
                newSeName = {};
                newSeLink = {};
                newSeLogo = {};
                newSeStatus = {};
                newSeNumber[se_repo.itemName + "_CustomChildrenNumber"] = new_se_number;
                newSeName[se_repo.itemName + "_CustomChild_" + new_se_number + "_name"] = se_name;
                newSeLink[se_repo.itemName + "_CustomChild_" + new_se_number + "_link"] = se_link;
                newSeLogo[se_repo.itemName + "_CustomChild_" + new_se_number + "_logo"] = se_logo;
                newSeStatus[se_repo.itemName + "_CustomChild_" + new_se_number + "_enabled"] = true;

                chrome.storage.local.set(newSeNumber, function(response) {
                    //console.log("number set");
                });
                chrome.storage.local.set(newSeName, function(response) {
                    //console.log("name set");
                });
                chrome.storage.local.set(newSeLink, function(response) {
                    //console.log("link set");
                });
                chrome.storage.local.set(newSeLogo, function(response) {
                    //console.log("logo set");
                });
                chrome.storage.local.set(newSeStatus, function(response) {
                    //console.log("status set");
                });

                location.reload();

            })


        } catch (e) {
            alert(e);
        }

    },
    addSocial: function addSocial() {
        try {
            var se_repo = new shareRepository;
            //var parent = document.getElementsByName("addSearchEngine")[0];
            var se_name = document.getElementsByName("socialNetworkName")[0].value;
            var se_link = document.getElementsByName("socialNetworkLink")[0].value;
            var se_logo = document.getElementsByName("socialNetworkLogoUrl")[0].value;
            chrome.storage.local.get(null, function(data) {
                if (data[se_repo.itemName + "_CustomChildrenNumber"]) {
                    se_number = data[se_repo.itemName + "_CustomChildrenNumber"];
                    new_se_number = se_number + 1;
                } else {
                    new_se_number = 1;
                }

                console.log(new_se_number);

                var newSeNumber = {};
                newSeName = {};
                newSeLink = {};
                newSeLogo = {};
                newSeStatus = {};
                newSeNumber[se_repo.itemName + "_CustomChildrenNumber"] = new_se_number;
                newSeName[se_repo.itemName + "_CustomChild_" + new_se_number + "_name"] = se_name;
                newSeLink[se_repo.itemName + "_CustomChild_" + new_se_number + "_link"] = se_link;
                newSeLogo[se_repo.itemName + "_CustomChild_" + new_se_number + "_logo"] = se_logo;
                newSeStatus[se_repo.itemName + "_CustomChild_" + new_se_number + "_enabled"] = true;

                chrome.storage.local.set(newSeNumber, function(response) {
                    //console.log("social number set");
                });
                chrome.storage.local.set(newSeName, function(response) {
                    //console.log("social name set");
                });
                chrome.storage.local.set(newSeLink, function(response) {
                    //console.log("social link set");
                });
                chrome.storage.local.set(newSeLogo, function(response) {
                    //console.log("social logo set");
                });
                chrome.storage.local.set(newSeStatus, function(response) {
                    //console.log("social status set");
                });

                location.reload();

            })
        } catch (e) {
            alert(e);
        }
    },
    restoreDefaults: function restoreDefaults() {
        try {
            //console.log("yellow");
            chrome.storage.local.clear(function() {
                //somet..
            })
            location.reload();
        } catch (e) {
            alert(e);
        }


    }

}

window.addEventListener("load", function load(event) {
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
        document.getElementById('UpdateItem').addEventListener("click", function() {
            myOpt.UpdateItem(this);
        }, false);
        document.getElementById("restoreDefaults").addEventListener("click", function() {
            myOpt.restoreDefaults();
        }, false);

        chrome.storage.local.get(null, function(data) {
//            console.log(data);
        });
    } catch (e) {
        alert(e);
    }
}, false);


