function onMenuClick() {
  if (window.event.type != 'load') {
    var element = window.event.toElement;
    
    // Find current element on selected tab
    chrome.tabs.getSelected(null, function(tab) {
			var server_url = element.getAttribute('href');
			server_url = server_url.replace(/%s/g, tab.url);
      chrome.tabs.create({url: server_url})
    });
  }
}

function onOptionClick() {
  chrome.tabs.create({url: 'options.html'})
}

/**
 * loadConfig callback
 */
function addMenuItem(text, url, image) {
  var item = createLink(url, onMenuClick, text);
  var imageUrl = '';
  if (undefined !== image) {
    imageUrl = 'url(' + image + ')';
  } else {
    imageUrl = 'url(chrome://favicon/http://' + getHostname(url) + ')';
  }
  
  
  item.style.backgroundImage = imageUrl;
  document.getElementById('menu').appendChild(appendMenuItem(item));
}

function onLoad(config) {
  document.getElementById('options').addEventListener('click', onOptionClick);
  loadConfig(addMenuItem, false);
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('options').innerHTML = chrome.i18n.getMessage('optionsText');
  document.getElementById('logo').innerHTML = chrome.i18n.getMessage('logoText');
  onLoad();
});

