$(window).load(function() {
    $(document).on("click", "#addNew_searchRepository", function() {
        displayBox("#NewSearchWrap");
    });
    $(document).on("click", "#addNew_shareRepository", function() {
        displayBox("#NewShareWrap");
    });
    $(document).on("click", "#bckgCover", function() {
        hideBox("#NewSearchWrap");
        hideBox("#NewShareWrap");
    });
    $(document).on("click", ".cancelAdd", function() {
        hideBox("#NewSearchWrap");
        hideBox("#NewShareWrap");
    });

    setTimeout(function() {
//        var shareHeight = parseInt($("#shareRepo .opt_repo_item").size()/2) *200 + 40 ;
        var searchHeight = parseInt($("#searchRepo .opt_repo_item").size() / 2) * 200 + 40;
        if (searchHeight < $(window).height()) {
//            $("#searchRepWrap").height($(window).height());
            searchHeight = $(window).height() - 51;
            $("#searchRepWrap").animate({height: searchHeight}, 100);
        }
    }, 500);



});

function displayBox(id, name, link, logo, repoInfo) {
    centerBox(id);
    clearInputs(id);
    var update= false;
    if (name !== undefined) {
        $(id + " input").eq(0).val(name);
        update= true;
    }
    if (link !== undefined) {
        $(id + " input").eq(1).val(link);
        update= true;
    }
    if (logo !== undefined) {
        $(id + " input").eq(2).val(logo);
        update= true;
    }
    if(update === true){
        $("#addNewNetwork").hide();
        $("#UpdateItem").show();
        $(id+ " h3").html("Edit Item");
    }else{
        $("#addNewNetwork").show();
        $("#UpdateItem").hide();
        $(id+ " h3").html("Add new Item");
    }
    if(repoInfo !== undefined){
        $(id).attr("data-repoInfo", repoInfo);
//        document.getElementById(id).setAttribute("data-repoInfo", repoInfo);    
    }
    $("#bckgCover").fadeIn(100);
    $(id).fadeIn(400);
}

function centerBox(id) {
    var marginTop = 250;
    var marginLeft = ($(window).width() / 2 - $(id).width() / 2);
    $(id).css("position", "fixed");
    $(id).css("top", marginTop);
    $(id).css("left", marginLeft);

}

function hideBox(id) {
    $("#bckgCover").fadeOut(400);
    if ($(id).is(":visible")) {
        $(id).fadeOut(100);
    }
}

function clearInputs(id) {
    $(id + " input[type=text]").each(function() {
        $(this).val('');
    });
}

var Communicate = {
    sendRequest: function sendRequest(data, callback) {
        chrome.runtime.sendMessage(null, data, callback);
    },
    waitRequest: function() {
        chrome.runtime.onMessage.addListener(
                function(request, sender, sendResponse) {
                    if (request.method === 'ShowDetails') {
                        displayBox("#NewShareWrap", request.name, request.link, request.logo, request.repoInfo);
                    }else if (request.method === 'HideBox'){
                        hideBox("#NewShareWrap");
                    }
                    return true;
                });
    }
};

//Communicate.waitRequest();


window.addEventListener("load", function() {
    //ContentScript.oninit();
    Communicate.waitRequest();
}, false);