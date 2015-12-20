define(function(require) { exports = {};

;(function() {

  // schema language: http://tools.ietf.org/html/draft-zyp-json-schema-03

  exports.SCHEMA = {
    type: 'object',
    properties: {
      'Results': {
        type: 'object',
        properties: {
          'NumSearchRecords': {
            type: 'integer',
            minimum: 0,
            required: true
          },
          'SearchRecords': {
            type: 'object',
            properties: {
              'Record': {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    'Search': {
                      type: 'integer',
                      required: true
                    },
                    'BkColor': {
                      type: 'string',
                      required: true
                    },
                    'icon': {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          'image': {
                            type: 'integer',
                            minimum: 1,
                            maximum: 4,
                            required: true
                          },
                          'nav_url': {
                            type: 'string',
                            format: 'url'
                          },
                          'popup_url': {
                            type: 'string',
                            format: 'url'
                          },
                          'ShowOnTB': {
                            type: 'string',
                            'enum': ['Yes', 'No']
                          }
                        }
                      },
                      required: true
                    }
                  }
                }
              }
            },
            required: true
          }
        },
        required: true
      }
    }
  };

}).call(this);

return exports;});