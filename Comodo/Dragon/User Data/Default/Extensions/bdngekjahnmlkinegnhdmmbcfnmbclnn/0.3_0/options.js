document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('save').addEventListener('click', onClick);
  onLoad();
});

function onLoad() {
  // Set localized text for options page
  document.getElementById('scanText').outerHTML = chrome.i18n.getMessage("scan");
  document.getElementById('navigateText').outerHTML = chrome.i18n.getMessage("scanNavigate");
  document.getElementById('notification-label').innerHTML = chrome.i18n.getMessage("notificationLabelText");
  document.getElementById('title').innerHTML = chrome.i18n.getMessage("titleText");
  document.getElementById('save').value = chrome.i18n.getMessage("saveText");

  // restore user options
  var scan = restoreOptions();
  if (scan) {
    document.getElementById('scan').checked = true;
  } else {
    document.getElementById('navigate').checked = true;
  }
  
  settingsChanged(scan);
}

function onClick() {
  saveOptions(document.getElementById('scan').checked);
  
  var label = document.getElementById('notification-label');
  label.style.visibility = 'visible';
  label.style.display = 'block';
  setTimeout(function() {
    label.style.visibility = 'hidden';
    label.style.display = 'none';
  }, 750);
}

function saveOptions(isShown) {
  localStorage['checkWithSI'] = isShown;
  settingsChanged(isShown);
}

function restoreOptions() {
  return localStorage['checkWithSI'] == 'true';
}

function settingsChanged(scan) {
  chrome.extension.sendRequest({
    scan: scan.toString()
  });
}
