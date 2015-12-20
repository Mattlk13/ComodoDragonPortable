define(function(require) { exports = {};

;(function() {

  var Model = require('../frameworks/backbone-schema').SchemaAwareModel;

  // Lookup Response model for processing JSON data obtained as a result of Site
  // Information Lookup request. Schema against which to validate incoming data
  // must be provided as constructor option.
  //
  // The main function to use it is the `fetch` function of `Backbone.Model`
  // object, which gets `url` of the Information Lookup server, and string
  // `data` representing stringified JSON request data as function parameters.
  //
  // The model emits `change` event when the response is downloaded and
  // validated (using `validate` function).
  //
  // Call `get` function to access the response properties.
  //
  // Example usage:
  //
  //     var response = new LookupResponse({}, {schema: ...});
  //
  //     response.bind("change", function() {
  //       /* use response.get( <cfg_property> ) here */
  //     });
  //
  //     response.fetch({
  //       url: ...,
  //       data: ...
  //     });
  //
  exports.LookupResponse = Model.extend({

    validate: function(attributes) {

      var obj = _.extend({}, this.attributes, attributes);
      var error = Model.prototype.validate.call(this, attributes);
      if (error) {
        return error;
      }
      if (obj.Results && // not empty --> (schema-) valid object
        obj.Results.NumSearchRecords !=
          obj.Results.SearchRecords.Record.length ) {

        return 'Model schema validation failed: ' +
          'NumSearchRecords != Record.length';
      }

    }

  });

}).call(this);

return exports;});