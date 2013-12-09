chrome.browserAction.onClicked.addListener(function(){
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id}, function(activeTabs) {
      chrome.tabs.executeScript(activeTabs[0].id, {file: 'js/findImages.js', allFrames: true});
    });
  });
});

var ourTab = null;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (!request.urls || !request.urls.length) return;

  var cb = function(tab){
    if (tab){
      chrome.tabs.sendRequest(ourTab, request);
      chrome.tabs.update(ourTab, {selected: true});
    } else {
      chrome.tabs.create({
        'url': chrome.extension.getURL('html/index.html')
      }, function(tab) {
        ourTab = tab.id;
        chrome.tabs.sendRequest(tab.id, request);
      });
    }
  };

  if (ourTab)
    chrome.tabs.get(ourTab, cb);
  else
    cb();
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  if (request.type === 'screenshot'){
    chrome.tabs.captureVisibleTab(function(dataUrl){
      imageToDownload(dataUrl);
    });
  }
});

function imageToDownload(src){
  var image_data = atob(src.split(',')[1]);

  var arraybuffer = new ArrayBuffer(image_data.length);
  var view = new Uint8Array(arraybuffer);
  for (var i=0; i<image_data.length; i++) {
    view[i] = image_data.charCodeAt(i) & 0xff;
  }
  try {
    var blob = new Blob([arraybuffer], {type: 'application/octet-stream'});
  } catch (e) {
    var bb = new window.WebKitBlobBuilder;
    bb.append(arraybuffer);
    var blob = bb.getBlob('application/octet-stream');
  }

  var url = (window.webkitURL || window.URL).createObjectURL(blob);

  chrome.tabs.create({
    'url': url
  });
}

