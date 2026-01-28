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

document.getElementById("submit").onclick = async () => {
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
      });
      window.close();
    } 
    // Unlock
    else {
      if (res.passwordHash !== hash) {
        return showError("Wrong password");
      }
      chrome.storage.local.set({ locked: false });
      window.close();
    }
  });
};

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
