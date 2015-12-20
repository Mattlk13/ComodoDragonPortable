; (function () {
    var popups = [];

    var HelperFunctions = {
        _invokeApi: function (name, input_args) {
            var nameSegments = name.split('.');
            var api = chrome;
            var context; // this is the context used when invoking the API function
            for (var i = 0; i < nameSegments.length; i++) {
                context = api;
                api = api[nameSegments[i]];
            }
    
            return api.apply(context, input_args);
        },

        _invokeBackgroundApi: function (name, input_args) {
            if ("tabs" in chrome) { // Non-hacky way to do this?
                return this._invokeApi.apply(this, arguments);
            }
    
            // arguments serializes to an associative array in JSON, so we convert to a normal array first
            var args = Array.prototype.slice.call(input_args);
            var request = {name: name, arguments: args};
            if (typeof (args[args.length - 1]) === "function") {
                var callback = args[args.length - 1];
                args.splice(args.length - 1);
            } else {
                callback = null;
            }
            if (callback) {
                chrome.extension.sendRequest({cmd: "InvokeAPI", data: request}, callback);
            } else {
                chrome.extension.sendRequest({cmd: "InvokeAPI", data: request});
            }
        }
    }

  salsita = {
    extension: {
        // wrapper for chrome.extension.sendRequest(string extensionId, any request, function responseCallback)
        sendRequest: function () {
            HelperFunctions._invokeApi("extension.sendRequest", arguments);
        },

        // wrapper for chrome.extension.onRequest.addListener(function(any request, MessageSender sender, function sendResponse) {...});
        onRequest: {
            addListener: function () {
                HelperFunctions._invokeApi("extension.onRequest.addListener", arguments);
            },

            removeListener: function() {
                HelperFunctions._invokeApi("extension.onRequest.removeListener", arguments);
            }
        },

        // wrapper for chrome.extension.connect(string extensionId, object connectInfo)
        connect: function () {
            HelperFunctions._invokeApi("extension.connect", arguments);
        },

        // wrapper for chrome.extension.onConnect.addListener(function(Port port) {...});
        onConnect: {
            addListener: function () {
                HelperFunctions._invokeApi("extension.onConnect.addListener", arguments);
            }
        },

      // wrapper for string chrome.extension.getURL(string path)
        getURL: function () {
            return HelperFunctions._invokeApi("extension.getURL", arguments);
        }
    },

    tabs: {
        getCurrent: function () {
            HelperFunctions._invokeBackgroundApi("tabs.getCurrent", arguments);
        },

        getSelected: function () {
            HelperFunctions._invokeBackgroundApi("tabs.getSelected", arguments);
        },

      // wrapper for chrome.tabs.create(object createProperties, function callback)
        create: function () {
            HelperFunctions._invokeBackgroundApi("tabs.create", arguments);
        },

      // wrapper for chrome.tabs.update(integer tabId, object updateProperties, function callback)
        update: function () {
            HelperFunctions._invokeBackgroundApi("tabs.update", arguments);
        },

      // wrapper for chrome.tabs.sendRequest(integer tabId, any request, function responseCallback)
        sendRequest: function () {
            HelperFunctions._invokeBackgroundApi("tabs.sendRequest", arguments);
        },

      // wrapper for chrome.tabs.executeScript(integer tabId, object executeScriptProperties, function responseCallback)
        executeScript: function () {
            HelperFunctions._invokeBackgroundApi("tabs.executeScript", arguments);
        },

        // wrapper for chrome.tabs.onRemoved.addListener(function(integer tabId, object removeInfo) {...});
        onActivated: {
            addListener: function () {
                HelperFunctions._invokeBackgroundApi("tabs.onActivated.addListener", arguments);
            }
        },

        // wrapper for chrome.tabs.onRemoved.addListener(function(integer tabId, object removeInfo) {...});
        onRemoved: {
            addListener: function () {
                HelperFunctions._invokeBackgroundApi("tabs.onRemoved.addListener", arguments);
            }
        }
    },

    windows: {
        _screenToViewportX: function (x) {
            return Math.floor(x - window.screenLeft + $(window).scrollLeft());
        },

        _screenToViewportY: function (y) {
            return Math.floor(y - window.screenTop + $(window).scrollTop());
        },

        getCurrent: function (getInfo, callback) {
            var match = document.location.href.match(/[^#]*#__borderless__(\d+)$/);
            if (match) {
                callback({id: match[1]});
            } else {
                HelperFunctions._invokeBackgroundApi("windows.getCurrent", arguments);
            }
        },

        create: function (createData, callback) {
            var self = this;
            if (createData.borderless) {
                // Tell the background window about the new popup and get the next free ID.
                chrome.extension.sendRequest({ cmd: "RegisterPopup" }, function (borderlessId) {
                // Can't create borderless window using the chrome.windows.create API, so
                // we simulate using a floating div containing an iframe.
                    var div = document.createElement("div");

                    div.id = borderlessId;
                    div.style.position = "absolute";
                    div.style.left = self._screenToViewportX(createData.left) + "px";
                    div.style.top = self._screenToViewportY(createData.top) + "px";
                    div.style.zIndex = "3000";
                    div.style.backgroundColor = "white";
                    div.style.border = "none";
                    div.style.display = "inline-block";
                    div.style.width = "width" in createData ? createData.width : 100;
                    div.style.height = "height" in createData ? createData.height : 100;

                    var iframe = document.createElement("iframe");
                    iframe.style.border = "none";
                    // TODO: What happens if the URL already has a fragment identifier?
                    iframe.src = createData.url + "#__borderless__" + div.id;
                    iframe.style.height = "100%";
                    iframe.style.width = "100%";
    
                    window.addEventListener("message", function (event) {
                        var data = JSON.parse(event.data);
                        var updateInfo = data.updateInfo;
                        var winId = data.id;
                        var listeners = salsita.windows.onUpdated._listeners;

                        if (updateInfo.height) {
                            iframe.style.height = div.style.height = updateInfo.height + "px";
                        }
                        if (updateInfo.width) {
                            iframe.style.width = div.style.width = updateInfo.width + "px";
                        }
                        if (updateInfo.left) {
                            div.style.left = self._screenToViewportX(updateInfo.left) + "px";
                        }
                        if (updateInfo.top) {
                            div.style.top = self._screenToViewportY(updateInfo.top) + "px";
                        }
                        // See comment in onUpdated. This belongs in the background window.
                        
                        for (var i = 0; i < listeners.length; i++) {
                            listener = listeners[i];
                            listener(winId, updateInfo);
                        }
                    });

                    div.appendChild(iframe);

                    document.body.appendChild(div);
                    document.body.addEventListener("click", function (event) {
                        document.body.removeEventListener("click", arguments.callee, false);
                        // Tell the background window to unregister the popup.
                        // This will cause it to be closed.
                        chrome.extension.sendRequest({cmd: "UnregisterPopup", id: div.id});
                    }, false);

                    // Remember the popup so we can unregister it when we unload.
                    popups.push(div);

                    if (callback) {
                        callback({id: div.id});
                    }
                });
            } else {
                HelperFunctions._invokeBackgroundApi("windows.create", arguments);
            }
        },

        remove: function (id) {
            chrome.extension.sendRequest({cmd: "IsPopup", id: id}, function (isPopup) {
                if (isPopup) {
                    chrome.extension.sendRequest({cmd: "UnregisterPopup", id: id});
                } else {
                    HelperFunctions._invokeBackgroundApi("window.remove", arguments);
                }
            });
        },

        update: function (winId, updateInfo, callback) {
            chrome.extension.sendRequest({cmd: "IsPopup", id: winId}, function (isPopup) {
                if (isPopup) {
                // TODO: Implement winId parameter.
                // Right now it only works for the current window.
                    window.top.postMessage(JSON.stringify({id: winId, updateInfo: updateInfo}), "*");
                } else {
                    HelperFunctions._invokeBackgroundApi("window.update", arguments);
                }
            });
        },

        onRemoved: {
            // We maintain our own list of listeners as well for borderless popups.
            _listeners: [],

            addListener: function (listener) {
                this._listeners.push(listener);
                HelperFunctions._invokeBackgroundApi("windows.onRemoved.addListener", arguments);
            },

            removeListener: function (listener) {
                var index = this._listeners.indexOf(listener);
                if (index !== -1) {
                    this._listeners.splice(index, 1);
                }
                HelperFunctions._invokeBackgroundApi("windows.onRemoved.removeListener", arguments);
            }
        },

        onUpdated: {
        // We maintain our own list of listeners since Chrome doesn't support this event
        // currently.
        // Note that this will only alert the window that makes the windows.update() call
        // since we are maintaining a separate list of listeners for each instance of the salsita
        // object (i.e. each window).
        // The right solution is to have the background dispatcher maintain the list of listeners
        // and notify them when appropriate. This isn't entirely trivial since you can't pass
        // functions (like listeners) in requests between windows. I imagine we can fix this by
        // having each salsita object register with the background and receive a request whenever
        // there is a message it might be interested in.
            _listeners: [],

            addListener: function (listener) {
                this._listeners.push(listener);
            },

            removeListener: function (listener) {
                var index = this._listeners.indexOf(listener);
                if (index !== -1) {
                    this._listeners.splice(index, 1);
                }
            }
        }
    },

    localStorage: {
        getItem: function (key) {
            if (this.hasValue(key)) {
                return window.localStorage.getItem(key);
            }
        },
        setItem: function (key, value) {
            window.localStorage.setItem(key, value);
        },
        hasValue: function (key) {
            return key in window.localStorage;
        },
        removeItem: function (key) {
            window.localStorage.removeItem(key);
        },
        getKeys: function () {
            return window.localStorage;
        },
        addLocalStorageReadyFn: function (callback) {
            // IE implementation requires this waiting callback for background.js code.
            // TODO: make it unnecessary.
            callback(this); // We have window.localStorage always ready on Chrome.
        }
    },

    toolbar: {
        show: function (options) {
            chrome.browserAction.setPopup({popup: options.html});
            if (options.icon) {
                chrome.browserAction.setIcon({path: options.icon});
            }

            if (options.title) {
                chrome.browserAction.setTitle({title: options.title});
            }
        },

        hide: function () {
            chrome.browserAction.setPopup({popup: ''});

            var iconPath = '../images/action_none.png';
            chrome.browserAction.setIcon({path: iconPath});
            chrome.browserAction.setTitle({title: ' '}); // workaround for bug #31811409
        }
    },

  };

    if (typeof(exports) !== "undefined") {
        exports.salsita = salsita;
    } else if (typeof(window) != "undefined") {
        window.salsita = salsita;
    }

    chrome.extension.onRequest.addListener(function (request, sender) {
        if (("cmd" in request) && (request.cmd === "ClosePopup")) {
            var element = document.getElementById(request.id);
            var index = popups.indexOf(element);
            if (index !== -1) {
                popups.splice(index, 1);
            }
            if (element) {
                document.body.removeChild(element);
                // Alert listeners that the window has been removed.
                var listeners = salsita.windows.onRemoved._listeners
                for (var i = 0; i < listeners.length; i++) {
                    listener = listeners[i];
                    listener(request.id);
                }
            }
        }
  });

    window.addEventListener("unload", function (event) {
        // Unregister all the popups so the background window can free the associated
        // metadata.
        for (var index = 0; index < popups.length; index++) {
            chrome.extension.sendRequest({cmd: "UnregisterPopup", id: popups[index].id});
        }

        popups = null;

    }, false);

}).call(this);
