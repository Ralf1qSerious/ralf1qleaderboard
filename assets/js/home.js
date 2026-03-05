// assets/js/home.js
import { loadConfig } from "./config.js";
import { setupFxCanvas } from "./effects.js";

const fx = setupFxCanvas();

(async () => {
  const cfg = await loadConfig(); // <-- this sets announcement bar (with link) automatically

  const nameEl = document.getElementById("siteName");
  if (nameEl) nameEl.textContent = cfg.siteName || "RALF1Q Rewards";

  // seasonal FX on home too
  // season values supported now: winter, summer, autumn, spring
  fx.setMode(cfg.season || "winter");
})();