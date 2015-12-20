define(function(require) { exports = {};

;(function() {

  // schema language: http://tools.ietf.org/html/draft-zyp-json-schema-03

  exports.SCHEMA = {
    type: 'object',
    properties: {
      'Lookup': {
        type: 'object',
        properties: {
          'NumSearchRecords': {
            type: 'integer',
            minimum: 0,
            required: true
          },
          'SETerm': {
            type: 'string',
            required: true
          },
          'Lang': {
            type: 'string',
            required: true
          },
          'VendorID': {
            type: 'string',
            required: true
          },
          'Record': {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                'id': {
                  type: 'integer',
                  required: true
                },
                'search': {
                  type: 'string',
                  required: true
                }
              }
            },
            required: true
          }
        }
      }
    }
  };

}).call(this);

return exports;});