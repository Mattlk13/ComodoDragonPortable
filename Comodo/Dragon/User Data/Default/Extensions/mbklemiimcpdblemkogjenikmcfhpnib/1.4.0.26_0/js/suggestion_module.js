define(function (require) { 

    function SuggestionModule () {
        this.data = {};
        this.enable = true;
        this.addedBookmarks = {};

        this.setConfig = function (data) {
            this.data = data;
            this.enable = data.s ? true : false;
        };

        this.getConfig = function () {
            return this.data;
        };

        this.onTabUpdateHandler = function (changeInfo) {
            if (changeInfo.status === 'loading') {
                this.clearAllBookmarks();
            }
        };

        this.onTabActivateHandler = function (details) {
            this.clearAllBookmarks();
        };

        this.processRequest = function (details) {
            if (this.enable) {
                if (this.isRequestToSuggestions(details)) {
                    var keyword = this.getKeywordFromRequestUrl(details.url);
                    var suggestions = this.findSuggestionsForKeyword(keyword);
                    this.manageBookmarks(suggestions);
                }
            }
        };

        this.isRequestToSuggestions = function (details) {
            return details.type === "other" && (
                        /https:\/\/www\.google\.([^/]*)\/complete\/search\?.*\&q=([^&]+)\&/.test(details.url) ||
                        /http:\/\/api\.bing\.com\/osjson\.aspx\?.*query=([^&]+)/.test(details.url) ||
                        /http:\/\/ff\.search\.yahoo\.com\/gossip\?.*command=([^&]+)/.test(details.url) ||
                        /http:\/\/ss\.ask\.com\/query\?.*q=([^&]+)/.test(details.url)
                    );
        };

        this.getKeywordFromRequestUrl = function (url) {
            var keyword = '';
            var match = url.match(/[&?]+q=([^&]*)\&/);
            if (match && match[1]) {
                keyword = match[1];
            } else {
                var match = url.match(/query=([^&]*)/);
                if (match && match[1]) {
                    keyword = match[1];
                } else {
                    var match = url.match(/command=([^&]*)/);
                    if (match && match[1]) {
                        keyword = match[1];
                    }
                }
            }
            if (keyword) {
                keyword = keyword.replace(/\+/g, ' ');
                return keyword;
            }
        }

        this.findSuggestionsForKeyword = function (keyword) {
            var result = [];
            for(var i = 0; i < this.data.s.length; i++){
                var sugg = this.data.s[i];
                if (this.isSuggestionMatched(sugg, keyword)) {
                    result.push(sugg);
                }
            }
            return result;
        };

        this.isSuggestionMatched = function (sugg, keyword) {
            keyword = keyword.toLowerCase();
            var k = keyword.indexOf(sugg.k.toLowerCase()) === 0;
            var s = sugg.s.toLowerCase().indexOf(keyword) === 0;
            return k && s;
        };

        this.manageBookmarks = function (suggestions) {
            //all added bookmarks means as old and needs to be deleted
            for (var url in this.addedBookmarks) {
                this.addedBookmarks[url].needed = false;
            }

            for (var i=0; i<suggestions.length; i++) {
                var sugg = suggestions[i];

                if (!(sugg.u in this.addedBookmarks)) {
                    this.addBookmark(sugg);
                }
                this.addedBookmarks[sugg.u].needed = true;
            }

            //clear or bookmarks that was not marked as needed
            for (var url in this.addedBookmarks) {
                if (!this.addedBookmarks[url].needed) {
                    this.removeBookmark(url);
                }
            }
        };

        this.addBookmark = function (sugg) {
            var self = this;
            chrome.bookmarks.create({
                url: sugg.u,
                title: sugg.s + ' - ' +self.data.t
            }, function (bookmarkTreeNode){
                self.addedBookmarks[sugg.u] = {
                    id: bookmarkTreeNode.id,
                    needed: true
                }
            });
            this.addedBookmarks[sugg.u] = {};
        };

        this.removeBookmark = function (url) {
            var bkm = this.addedBookmarks[url];
            chrome.bookmarks.remove(bkm.id);
            delete this.addedBookmarks[url];
        };

        this.clearAllBookmarks = function () {
            for (var url in this.addedBookmarks) {
                this.removeBookmark(url);
            }
        };

    }

return SuggestionModule;

});
