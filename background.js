// Biến để track các tab đang được xử lý (tránh xử lý trùng lặp)
const processingTabs = new Set();

// Reset lock khi Chrome khởi động lại
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(["passwordHash"], (res) => {
    if (res.passwordHash) {
      // Có password thì lock lại khi khởi động
      chrome.storage.local.set({ locked: true }, () => {
        showLockPage();
      });
    }
  });
});

// Reset lock khi extension được cài đặt/cập nhật
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["passwordHash"], (res) => {
    if (res.passwordHash) {
      chrome.storage.local.set({ locked: true });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;
  if (!tab.url) return;

  const lockUrl = chrome.runtime.getURL("lock.html");
  
  // Bỏ qua nếu đang ở trang lock.html (tránh vòng lặp)
  if (tab.url === lockUrl) {
    processingTabs.delete(tabId);
    return;
  }

  // Tránh xử lý trùng lặp cho cùng một tab
  if (processingTabs.has(tabId)) {
    return;
  }

  chrome.storage.local.get(["locked", "passwordHash"], (res) => {
    // Nếu đã unlock, bỏ qua các URL đặc biệt (chrome://, chrome-extension://, about:)
    if (res.locked === false && res.passwordHash) {
      if (tab.url.startsWith("chrome://") || 
          tab.url.startsWith("chrome-extension://") || 
          tab.url.startsWith("about:")) {
        processingTabs.delete(tabId);
        return;
      }
    }

    // 1. Chưa có password → luôn vào màn setup
    if (!res.passwordHash) {
      processingTabs.add(tabId);
      redirectToLock(tabId, tab.url);
      return;
    }

    // 2. Có password nhưng đang lock
    if (res.locked === true) {
      processingTabs.add(tabId);
      redirectToLock(tabId, tab.url);
      return;
    }

    // 3. Đã unlock → cho đi, xóa khỏi processing set
    processingTabs.delete(tabId);
  });
});

// Xóa tab khỏi processing set khi tab bị đóng
chrome.tabs.onRemoved.addListener((tabId) => {
  processingTabs.delete(tabId);
});

function showLockPage() {
  const lockUrl = chrome.runtime.getURL("lock.html");
  chrome.tabs.query({}, (allTabs) => {
    const lockTab = allTabs.find(t => t.url === lockUrl);
    
    if (lockTab) {
      chrome.tabs.update(lockTab.id, { active: true });
    } else {
      chrome.tabs.create({ url: lockUrl }, (newTab) => {
        // Sau khi tạo trang khóa, đóng các trang "New Tab" trống
        allTabs.forEach(tab => {
          if (tab.url === "chrome://newtab/" || tab.url === "about:newtab") {
            chrome.tabs.remove(tab.id);
          }
        });
      });
    }
  });
}

function redirectToLock(tabId, currentUrl) {
  const lockUrl = chrome.runtime.getURL("lock.html");

  if (currentUrl !== lockUrl) {
    chrome.tabs.update(tabId, { url: lockUrl });
  }
}
