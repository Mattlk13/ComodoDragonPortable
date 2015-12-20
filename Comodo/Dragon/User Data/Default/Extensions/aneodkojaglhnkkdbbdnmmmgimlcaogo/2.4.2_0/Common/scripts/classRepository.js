if ("undefined" === typeof (MySidebar)) {
    var MySidebar = {};
}
;

var dndClass = function(methods) {
    var klass = function() {
        this.initialize.apply(this, arguments);
    };
    var property;
    for (property in methods) {
        klass.prototype[property] = methods[property];
    }
    if (!klass.prototype.initialize)
        klass.prototype.initialize = function() {
        };

    return klass;

};


var dndRepository = dndClass({
    initialize: function(itemName, defaultElements) {
        this.itemName = itemName;
        this.defaultElements = defaultElements;
    },
    getElements: function() {
        var children = this.defaultElements;
        return children;
    },
    getImagePath: function (imgName) {
        var imgPath; 
        if (MySidebar.dndBrowser === "Firefox") {
                imgPath = "resource://DnDlogos2/" + imgName;
        } else {
                imgPath = chrome.extension.getURL("images/" + imgName);
        }
        return imgPath;
    }
});


var searchRepository = function() {
    var defaultElements = [
        {
            name: "googleSearch",
            status: true,
            type: "search",
            textUrl: "https://www.google.ro/search?q=",
            imgIcon: "webSearch.png",
            bgHoverColor: "#5595fb",
            imgHoverIcon: "webSearchh.png",
            id: "side_google_search",
            acceptType: "text",
            content: "Google Search"
        },
        {
            name: "wikipediaSearch",
            status: true,
            type: "search",
            textUrl: "http://wikipedia.org/w/index.php?search=",
            imgIcon: "wikipedia.png",
            bgHoverColor: "#1d1f1f",
            imgHoverIcon: 'wikipediah.png',
            id: "side_wikipedia_search",
            acceptType: "text",
            content: "Wikipedia Search"
        },
        {
            name: "youtubeSearch",
            status: true,
            type: "search",
            textUrl: "http://www.youtube.com/results?search_query=",
            imgIcon: "youtube.png",
            bgHoverColor: "#c62f2c",
            imgHoverIcon: 'youtubeh.png',
            id: "side_youtube_search",
            acceptType: "text",
            content: "Youtube Search"
        },
        {
            name: "translateSearch",
            status: true,
            type: "search",
            textUrl: "http://translate.google.com/?langpair=en/ro&text=",
            imgIcon: "translate.png",
            bgHoverColor: "#5595fb",
            imgHoverIcon: 'translateh.png',
            id: "side_translate_search",
            acceptType: "text",
            content: "Translate Search"
        },
        {
            name: "imageSearch",
            status: true,
            type: "search",
            textUrl: "https://www.google.com/search?tbm=isch&q=",
            imageUrl: "http://images.google.com/searchbyimage?image_url=",
            imgIcon: "imageSearch.png",
            bgHoverColor: "#5595fb",
            imgHoverIcon: 'imageSearchh.png',
            id: "side_image_search",
            acceptType: "all",
            content: "Image Search"
        }
    ];
    var repository = new dndRepository('searchRepository', defaultElements);
    return repository;

};

var shareRepository = function() {
    var defaultElements = [
        {
            name: "facebookShare",
            status: true,
            type: "share",
            textUrl: "https://www.google.ro/search?q=",
            imgIcon: "facebook.png",
            bgHoverColor: "#3b5998",
            imgHoverIcon: "facebookh.png",
            id: "side_facebook",
            acceptType: "images",
            content: "Facebook Share"
        },
        {
            name: "twitterShare",
            status: true,
            type: "share",
            textUrl: "http://wikipedia.org/w/index.php?search=",
            imgIcon: "twitter.png",
            bgHoverColor: "#00acee",
            imgHoverIcon: "twitterh.png",
            id: "side_twitter",
            acceptType: "images",
            content: "Twitter Share"
        },
        {
            name: "googlePlusShare",
            status: true,
            type: "share",
            textUrl: "http://www.youtube.com/results?search_query=",
            imgIcon: "google+.png",
            bgHoverColor: "#dd4b39",
            imgHoverIcon: 'google+h.png',
            id: "side_googleplus",
            acceptType: "images",
            content: "Google Plus Share"
        },
        {
            name: "pinterestShare",
            status: true,
            type: "share",
            textUrl: "http://translate.google.com/?langpair=en/ro&text=",
            imgIcon: "pinterest.png",
            bgHoverColor: "#c8232c",
            imgHoverIcon: 'pinteresth.png',
            id: "side_pinterest",
            acceptType: "images",
            content: "Pinterest Share"
        },
        {
            name: "linkedinShare",
            status: true,
            type: "share",
            textUrl: "https://www.google.com/search?tbm=isch&q=",
            imgIcon: "linkedin.png",
            bgHoverColor: "#0e76a8",
            imgHoverIcon: 'linkedinh.png',
            id: "side_linkedin",
            acceptType: "images",
            content: "Linkedin Share"
        }
    ];
    var repository = new dndRepository('shareRepository', defaultElements);

    return repository;

};