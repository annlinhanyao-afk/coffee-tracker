chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (err) {
    // Restricted pages (chrome://, the Web Store, etc.) can't be injected into.
    console.warn('webclip: could not inject into this tab', err);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_TAB') {
    const windowId = sender.tab && sender.tab.windowId;
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, dataUrl => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    return true; // keep the message channel open for the async callback
  }

  if (msg.type === 'DOWNLOAD_IMAGE') {
    chrome.downloads.download({ url: msg.dataUrl, filename: msg.filename, saveAs: false }, downloadId => {
      sendResponse({ downloadId, error: chrome.runtime.lastError && chrome.runtime.lastError.message });
    });
    return true;
  }
});
