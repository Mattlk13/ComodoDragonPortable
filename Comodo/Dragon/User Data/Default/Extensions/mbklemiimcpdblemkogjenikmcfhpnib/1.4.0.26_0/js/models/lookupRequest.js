define(function(require) { exports = {};

;(function() {

  var Model = require('../frameworks/backbone-schema').SchemaAwareModel;

  // Lookup Request model holding data for Site Information Lookup request.
  //
  // The main function to use it is the `set` data, that sets data on the model
  // and makes sure the model is schema-consistent all the time.
  //
  // Call `get` function to access properties, or use `attributes` property of
  // the model once building of the request is complete.
  //
  // Example usage:
  //
  //     var request = new LookupRequest({}, {schema: ...});
  //
  //     request.set(...);
  //     ...
  //     request.get(...);
  //
  exports.LookupRequest = Model.extend({

    validate: function(attributes) {

      var obj = _.extend({}, this.attributes, attributes);
      var error = Model.prototype.validate.call(this, attributes);
      if (error) {
        return error;
      }
      if (obj.Lookup && // not empty --> (schema-) valid object
        obj.Lookup.NumSearchRecords != obj.Lookup.Record.length) {

        return 'Model schema validation failed: ' +
          'NumSearchRecords != Record.length';
      }

    }

  });

}).call(this);

return exports;});