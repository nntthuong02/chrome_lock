const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm");
const title = document.getElementById("title");
const error = document.getElementById("error");

chrome.storage.local.get(["passwordHash"], (res) => {
  if (res.passwordHash) {
    title.innerText = "Unlock Chrome";
    confirmInput.style.display = "none";
  } else {
    title.innerText = "Set Password";
  }
});

// Hàm xử lý submit password
async function handleSubmit() {
  const pwd = passwordInput.value;
  const confirm = confirmInput.value;

  if (!pwd) return showError("Password required");

  const hash = await sha256(pwd);

  chrome.storage.local.get(["passwordHash"], (res) => {
    // Setup password
    if (!res.passwordHash) {
      if (pwd !== confirm) return showError("Password mismatch");

      chrome.storage.local.set({
        passwordHash: hash,
        locked: false
      }, () => {
        // Mở tab trống sau khi set password
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const lockUrl = chrome.runtime.getURL("lock.html");
          let currentLockTab = null;
          
          // Tìm tab đang chứa lock.html
          for (let tab of tabs) {
            if (tab.url === lockUrl) {
              currentLockTab = tab;
              break;
            }
          }
          
          // Nếu tìm thấy tab lock.html, redirect nó về tab trống
          if (currentLockTab && currentLockTab.id) {
            chrome.tabs.update(currentLockTab.id, { url: "chrome://newtab/" });
          } else if (tabs[0] && tabs[0].id) {
            // Nếu không tìm thấy, redirect tab active
            chrome.tabs.update(tabs[0].id, { url: "chrome://newtab/" });
          } else {
            // Nếu không có tab nào, tạo tab mới
            chrome.tabs.create({ url: "chrome://newtab/" });
          }
        });
      });
    } 
    // Unlock
    else {
      if (res.passwordHash !== hash) {
        return showError("Wrong password");
      }
      
      // Set unlocked trước, đợi lưu xong rồi mới redirect
      chrome.storage.local.set({ locked: false }, () => {
        // Lấy tab hiện tại (tab đang chứa lock.html)
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const lockUrl = chrome.runtime.getURL("lock.html");
          let currentLockTab = null;
          
          // Tìm tab đang chứa lock.html
          for (let tab of tabs) {
            if (tab.url === lockUrl) {
              currentLockTab = tab;
              break;
            }
          }
          
          // Nếu tìm thấy tab lock.html, redirect nó về tab trống
          if (currentLockTab && currentLockTab.id) {
            chrome.tabs.update(currentLockTab.id, { url: "chrome://newtab/" });
          } else if (tabs[0] && tabs[0].id) {
            // Nếu không tìm thấy, redirect tab active
            chrome.tabs.update(tabs[0].id, { url: "chrome://newtab/" });
          } else {
            // Nếu không có tab nào, tạo tab mới
            chrome.tabs.create({ url: "chrome://newtab/" });
          }
        });
      });
    }
  });
}

// Xử lý khi click vào nút OK
document.getElementById("submit").onclick = handleSubmit;

// Xử lý khi nhấn Enter trên các input field
passwordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
});

confirmInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSubmit();
  }
});

function showError(msg) {
  error.innerText = msg;
}

async function sha256(text) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}
