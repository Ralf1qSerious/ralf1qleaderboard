import { loadConfig } from "./config.js";
import { setupFxCanvas } from "./effects.js";

setupFxCanvas();

const isPanel = location.pathname.includes("/admin/panel");

(async () => {
  const cfg = await loadConfig();

  // login page
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      const input = document.getElementById("pw").value;
      const msg = document.getElementById("msg");
      if (input === cfg.adminPassword) {
        localStorage.setItem("admin_ok", "1");
        location.href = "/admin/panel.html";
      } else {
        msg.textContent = "Wrong password.";
      }
    };
  }

  // panel page
  if (isPanel) {
    if (localStorage.getItem("admin_ok") !== "1") {
      location.href = "/admin/";
      return;
    }

    const editor = document.getElementById("editor");
    const panelMsg = document.getElementById("panelMsg");
    editor.value = JSON.stringify(cfg, null, 2);

    document.getElementById("logoutBtn").onclick = () => {
      localStorage.removeItem("admin_ok");
      location.href = "/admin/";
    };

    document.getElementById("downloadBtn").onclick = () => {
      try {
        // validate JSON
        const parsed = JSON.parse(editor.value);
        const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "config.json";
        a.click();
        panelMsg.textContent = "Downloaded config.json. Upload it to your host to apply changes.";
      } catch (e) {
        panelMsg.textContent = "Invalid JSON. Fix errors before downloading.";
      }
    };
  }
})();