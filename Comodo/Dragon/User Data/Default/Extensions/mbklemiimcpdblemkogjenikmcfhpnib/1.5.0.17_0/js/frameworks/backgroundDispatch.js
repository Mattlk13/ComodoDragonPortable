; (function () {
  // Map of popup ID to tab containing the popup.
  // Tab ID is null if the popup is in a window that doesn't have tabs.
  // This is used to dispatch the message to close the popup to the right
  // tab (or to all windows).
  // Used for "borderless popups" which are actually divs containing an iframe.
  var popups = {};
  const BORDERLESS_BASE_ID = 50000;
  var currentBorderlessId = BORDERLESS_BASE_ID;

  if (typeof(chrome) === "undefined") {
    return;
  }

  var dispatch = function(request, sender, callback) {
    if (request.cmd === "IsPopup") {
      if (request.id >= BORDERLESS_BASE_ID) {
        callback(true);
      }
      else {
        callback(false);
      }
    }
    else if (request.cmd === "RegisterPopup") {
      var borderlessId = currentBorderlessId++;
      if (("tab" in sender) && (sender.tab.id != -1)) {
        popups[borderlessId] = sender.tab.id;
      }
      callback(borderlessId);
    }
    else if (request.cmd === "UnregisterPopup") {
      if (request.id >= BORDERLESS_BASE_ID) {
        var closeRequest = { cmd: "ClosePopup", id: request.id };
        if (request.id in popups) {
          chrome.tabs.sendRequest(popups[request.id], closeRequest);
        }
        else {
          // Popup is in a window that doesn't have tabs, so dispatch the ClosePopup
          // command to everyone.
          chrome.extension.sendRequest(closeRequest);
        }
      }
      else {
        // TODO: Should be an error.
      }
    }

    if (request.cmd !== "InvokeAPI") {
      return;
    }

    if ("name" in request.data) {
      var nameSegments = request.data.name.split('.');

      // call directly chrome.extension....
      var api = chrome;
      var context; // this is the context used when invoking the API function
      for (var i = 0; i < nameSegments.length; i++) {
        context = api;
        api = api[nameSegments[i]];
      }

      var args = Array.prototype.slice.call(request.data.arguments);
      if (callback) {
        args.push(callback);
      }

      return api.apply(context, args);
    }
  };

  chrome.extension.onRequest.addListener(dispatch);

  if (typeof(exports) != "undefined") {
    exports.dispatch = dispatch;
  }
}).call(this);