define(function (require) {

     var exports = {};

(function () {

  var Session = require('./contentSession').Session;
  var contentUtils = require('./contentUtils');

  // Available content-script request handlers:
  // + SearchUpdate
  // + ExecuteScript
  //
  // See messaging.js for more details.
  //
  exports.handlers = {

    handleSearchUpdate: function (args, sender, sendResponse) {
      Session.updateSearchTerm(args.url);
      // close request
      sendResponse({});
    },

    // needed for IE implementation
    handleExecuteScript: function (args, sender, sendResponse) {
      // TODO: handle it internally in the IE implementation
      chrome.tabs.executeScript(-1, { code: args.code });
      sendResponse({});
    },

    handleInjectScript: function (args, sender, sendResponse) {
      if(args.code){
        contentUtils.injectScript(args.code, 'ajaxScript');
      }

      sendResponse({});
    }

  };


}).call(this);

return exports;

});