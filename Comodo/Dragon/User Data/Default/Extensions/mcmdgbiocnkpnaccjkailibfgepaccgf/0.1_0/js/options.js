var DEFAULT_TIMEOUT = 750;

/**
 * Show notification message
 * @param message - message
 * @param timeot - timeout(optional)
 */
function showNotification(message, timeout) {
  var label = document.getElementById('notification_label');
  label.style.visibility = 'visible';
  label.style.display = 'block';
  label.innerHTML = message;

  if (undefined !== timeout) {
    setTimeout(function() {
      label.style.visibility = 'hidden';
      label.style.display = 'none';
    }, timeout);
  }
}

function checkInput(inputElement) {
  if (inputElement.value.length == 0) {
    inputElement.setAttribute('id', 'error');
    return false;
  } else if (inputElement.getAttribute('class') == 'url') {
    if (!isUrl(inputElement.value)
        || inputElement.value.indexOf('=%s') == -1) {
      inputElement.setAttribute('id', 'error');
      return false;
    }
  }
  
  return true;
}

/**
 * Generate config from table element
 */
function generateConfig(tableCellElement) {
  var inputCorrect = true;
  var config = {};
  var itemName = '';
  var imageUrl = '';

  for (var i = 0; i != tableCellElement.length; i++) {
    var element = tableCellElement[i].firstChild;
    if (element.tagName.toLowerCase() == 'input' && element.type == 'text') {
      // Remove error notification
      if (element.getAttribute('id') == 'error') {
        element.removeAttribute('id');
      }

      if (!checkInput(element)) {
        inputCorrect = false;
        continue;
      }

      if (element.getAttribute('class') == 'name') {
        itemName = element.value;
        config[itemName] = [];
        config[itemName].push({});

        // if we have default icon for this service
        if (undefined !== imageUrl) {
          config[itemName][0]['image'] = imageUrl;
          imageUrl = undefined;
        }
      } else if (element.getAttribute('class') == 'url') {
        config[itemName][0]['url'] = element.value;
      }
    } else if (element.tagName.toLowerCase() == 'img') {
      var src = element.getAttribute('src');
      if (src.indexOf('chrome://') == -1) {
        imageUrl = src;
      }
    }
  }

  if (!inputCorrect) {
    return undefined;
  }

  return JSON.stringify(config);
}

function onSave() {
  var mainContent = document.getElementById('main_content');
  var config = generateConfig(mainContent.getElementsByTagName('td'));  
  if (undefined !== config) {
    saveConfig(config);

    // Reload page content and show user notification.
    clearItems();
    loadConfig(addItem, false);
    showNotification(chrome.i18n.getMessage('save'), DEFAULT_TIMEOUT);
  } else {
    showNotification(chrome.i18n.getMessage('incorrectInput'));
  }
}

function onRemove() {
  // TODO(akandul): Change confirm to div.
  // TODO(akandul): Check selection and show this message.
  if (confirm(chrome.i18n.getMessage('deleteItems'))) {
    var mainContent = document.getElementById('main_content');
    var buffer = document.querySelectorAll('input');
    var flag = false;
  
    for (var i = 0; i != buffer.length; i++) {
      if (buffer[i].type == 'checkbox' && buffer[i].checked) {
        flag = true;
        var parent = getParentByTagName(buffer[i], 'tr');
        if (parent) {
          mainContent.removeChild(parent);
        }
      }
    }
  
    if (!flag) {
      showNotification(chrome.i18n.getMessage('selectionError'), DEFAULT_TIMEOUT);
    }
  }
}

/**
 * Create empty elements for new item
 */
function onAdd() {
  var elements = [];
  elements.push(createInput('checkbox', 'selector'));
  elements.push(createImage('chrome://favicon/iconurl/undefined', 'image'));
  elements.push(createInput('text', 'name', '20'));
  elements.push(createInput('text', 'url', '50'));
  
  document.getElementById('main_content').appendChild(createTr(elements));
}

/**
 * Cleare current table items
 */
function clearItems() {
  var nodes = document.getElementById('main_content');
  if (nodes.hasChildNodes()) {
    while (nodes.childNodes.length >= 1) {
      nodes.removeChild(nodes.firstChild);
    }
  }
}

/**
 * loadConfig callback
 */
function addItem(value, url, image) {
  var elements = [];
  elements.push(createInput('checkbox', 'selector'));

  // We have icons for default services
  if (undefined !== image) {
    elements.push(createImage(image, 'image'));
  } else {
    var imageUrl = 'chrome://favicon/http://' + getHostname(url);
    elements.push(createImage(imageUrl, 'image'));
  }
  elements.push(createInput('text', 'name', '20', value));
  elements.push(createInput('text', 'url', '50', url));
  
  document.getElementById('main_content').appendChild(createTr(elements));
}

function onLoad() {
  // TODO(akandul): Add localization for options page here.
  document.getElementById('add').value = chrome.i18n.getMessage('addText');
  document.getElementById('save').value = chrome.i18n.getMessage('saveText');
  document.getElementById('remove').value = chrome.i18n.getMessage('removeText');
  document.getElementById('reset').value = chrome.i18n.getMessage('resetText');
  document.getElementById('image').innerHTML = chrome.i18n.getMessage('imageText');
  document.getElementById('name').innerHTML = chrome.i18n.getMessage('nameText');
  document.getElementById('url').innerHTML = chrome.i18n.getMessage('urlText');

  loadConfig(addItem, false);
}

function onReset() {
  // TODO(akandul): Change confirm to div.
  if (confirm(chrome.i18n.getMessage('reset'))) {
    showNotification(chrome.i18n.getMessage('resetComplete'), DEFAULT_TIMEOUT);
    clearItems();
    loadConfig(addItem, true);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('save').addEventListener('click', onSave);
  document.getElementById('add').addEventListener('click', onAdd);
  document.getElementById('remove').addEventListener('click', onRemove);
  document.getElementById('reset').addEventListener('click', onReset);
  
  onLoad();
});
