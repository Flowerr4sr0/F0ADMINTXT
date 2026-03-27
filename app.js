let token = "";
let username = "";
let gistData = {};
let saveTimeout;

const GIST_ID = "YOUR_GIST_ID_HERE";

function openLogin() {
  loginModal.style.display = "block";
}

async function login() {
  token = tokenInput.value;

  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: "token " + token }
  });

  if (!userRes.ok) return alert("Invalid token");

  const user = await userRes.json();
  username = user.login;

  const allowed = await fetch("allowed_users.txt").then(r => r.text());

  if (!allowed.includes(username)) {
    alert("F0-ACCESS-DENIED");
    return;
  }

  const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: { Authorization: "token " + token }
  });

  if (!gistRes.ok) {
    alert("Error F0-TOKEN-NO-GIST-ACCESS");
    return;
  }

  gistData = await gistRes.json();

  setupEditor();

  loginModal.style.display = "none";
  editorModal.style.display = "block";
}

function setupEditor() {
  fileSelect.innerHTML = "";

  for (let file in gistData.files) {
    let opt = document.createElement("option");
    opt.value = file;
    opt.textContent = file;
    fileSelect.appendChild(opt);
  }

  loadFile();
}

function loadFile() {
  const file = fileSelect.value;
  editor.value = atob(gistData.files[file].content);
}

function addFile() {
  const name = newFileName.value;
  if (!name) return;

  gistData.files[name] = { content: btoa("") };
  setupEditor();
}

editor.addEventListener("input", () => {
  status.textContent = "Typing...";

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(autoSave, 1200);
});

async function autoSave() {
  status.textContent = "Saving...";

  const file = fileSelect.value;
  gistData.files[file].content = btoa(editor.value);

  let filesPayload = {};

  for (let f in gistData.files) {
    filesPayload[f] = {
      content: gistData.files[f].content
    };
  }

  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: "token " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ files: filesPayload })
  });

  status.textContent = res.ok ? "Saved ✅" : "Save Failed ❌";
}

function closeEditor() {
  editorModal.style.display = "none";
}
