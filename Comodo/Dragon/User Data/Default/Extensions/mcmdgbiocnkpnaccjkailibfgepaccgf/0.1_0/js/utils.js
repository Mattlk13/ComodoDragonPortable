var default_config = {
  'Facebook': [{
    'url': 'http://www.facebook.com/sharer.php?u=%s',
    'image': 'icons/default_services/facebook.png'
  }],
  'LinkedIn': [{
    'url': 'http://www.linkedin.com/shareArticle?mini=true&url=%s',
    'image': 'icons/default_services/linkedin.png'
  }],
  'Twitter': [{
    'url': 'http://twitter.com/share?url=%s',
    'image': 'icons/default_services/twitter.png'
  }]
};

/**
 * Get parent element by parent tag name
 * @param element - html element
 * @param name - parent tag name
 * @return parent element or false
 */
function getParentByTagName(element, name) {
  var parent = element.parentNode;
  if (!parent) {
    return false;
  }
  if (parent.tagName.toLowerCase() == name) {
    return parent;
  } else {
    return getParentByTagName(parent, name);
  }
}

// TODO: Remove isUrl from background.js
function isUrl(url) {
  var re = new RegExp('http(s?)\://*/*');
  return re.test(url);
}

function getHostname(str) {
  var re = new RegExp('^http(?:s)?\://(?:www.)?([^/]+)', 'im');
  return str.match(re)[1].toString();
}

/**
* Load config from localStorage or use default
* @param callback - callback for current item
* @param reset - use default config.
*/
function loadConfig(callback, reset) {
  var config = localStorage['share_page_config'];
  if (config !== undefined && !reset) {
    var items = JSON.parse(config);
    for (i in items) {
      if (undefined !== items[i][0].image) {
        callback(i, items[i][0].url, items[i][0].image);
      } else {
        callback(i, items[i][0].url);
      }
    }
  } else {
    for (i in default_config) {
      if (undefined !== default_config[i][0].image) {
        callback(i, default_config[i][0].url, default_config[i][0].image);
      } else {
        callback(i, default_config[i][0].url);
      }
    }
  }
}

function saveConfig(config) {
	localStorage['share_page_config'] = config;
}

/**
* Create <input> element
* @param type - element type
* @param className - css class name(optional)
* @param size - element size(optional)
* @param value - element value(optional)
* @return created element
*/
function createInput(type, className, size, value) {
  var element = document.createElement('input');
  element.setAttribute('type', type);
  if (undefined !== className) {
    element.setAttribute('class', className);
  }  
  if (undefined !== size) {
    element.setAttribute('size', size);
  }
  if (undefined !== value) {
    element.setAttribute('value', value);
  }
  return element;
}

/**
* Create <img> element
* @param url - src
* @param className - css class name(optional)
* @return created element
*/
function createImage(url, className) {
  var element = document.createElement('img');
  element.setAttribute('src', url);
  if (undefined !== className) {
    element.setAttribute('class', className);
  }

  return element;
}

/**
* Create <a> element
* @param href - href
* @param onClick - callback
* @param innerText - innerText
* @return created element
*/
function createLink(href, onClick, innerText) {
  var element = document.createElement('a');
  element.setAttribute('href', href);
  element.addEventListener('click', onClick);
  element.innerText = innerText;
  return element;
}

/**
* Create <tr> element
* @param elements - child element
* @return created element
*/
function createTr(elements) {
  var tr = document.createElement('tr');
  for (var i = 0; i != elements.length; i++) {
    var td = document.createElement('td');
    td.appendChild(elements[i]);
    tr.appendChild(td);
  }
  return tr;
}

/**
* Append <hr> and options menu item to browser action menu
*/
function addOptionsMenuItem() {
  var elements = [];
  elements['image'] = createImage('icons/options.png');
  elements['span'] = createSpan('text', onOptionClick, 'Options');
  document.getElementById('menu').appendChild(document.createElement('hr'));
  document.getElementById('menu').appendChild(appendMenuItem(elements));
}

/**
* Create <span> element
* @param className - class name for css
* @param callback - click callback
* @param text - visible text
* @param value - url(optional)
* @return - new element
*/
function createSpan(className, callback, text, value) {
  var span = document.createElement('span');
  span.addEventListener('click', callback);
  if (undefined !== value) {
    span.setAttribute('value', value);
  }
  span.setAttribute('class', className);
  span.innerHTML = text;
  return span;
}

/**
* Append new item to browser action menu.
* @param elements - contain 'image' and 'span' HTML elements
* @return - new menu item
*/
function appendMenuItem(item) {
  var li = document.createElement('li');
  li.appendChild(item);
  return li;
}
