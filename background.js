chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url) return;

  chrome.storage.local.get(["locked", "passwordHash"], (res) => {
    // Chưa setup password → cho vào lock screen
    if (!res.passwordHash || res.locked === true) {
      if (!tab.url.includes("lock.html")) {
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL("lock.html")
        });
      }
    }
  });
});
