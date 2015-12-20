define(function (require) { 

   var exports = {};

(function () {

  var URI = require('./frameworks/uri').URI;

  var sessionData = {
    engine: '',    // engine-related code in a wrapper object
    search: '',    // search term
    result: [],    // array of result URLs
    iconConfig: {}, // object (num_show, icon) with icon-related configuration
    instanceId: ''
  };


  exports.Session = {

    updateSearchTerm: function (url) {

    }

  };

}).call(this);

return exports;

});