import { loadConfig } from "./config.js";
import { setupFxCanvas } from "./effects.js";

const fx = setupFxCanvas();

function fmtToken(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0.00";
  return num.toFixed(2);
}

function tokenHTML(value) {
  return `
    <span class="profile-token-value">
      <img src="/assets/images/token.png" alt="token">
      <span>${fmtToken(value)}</span>
    </span>
  `;
}

async function loadGiveawayConfig() {
  const res = await fetch("/giveawayconfig.json", { cache: "no-store" });
  return res.json();
}

function startCountdown(endIso) {
  const end = new Date(endIso);

  function tick() {
    const now = new Date();
    let diff = end - now;
    if (!Number.isFinite(diff)) diff = 0;

    const d = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const h = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
    const m = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
    const s = Math.max(0, Math.floor((diff / 1000) % 60));

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    set("days", d);
    set("hours", h);
    set("minutes", m);
    set("seconds", s);
  }

  tick();
  setInterval(tick, 1000);
}

function renderEntries(entries = []) {
  const wrap = document.getElementById("giveawayEntries");
  if (!wrap) return;

  wrap.innerHTML = "";

  entries.forEach((entry, idx) => {
    wrap.insertAdjacentHTML(
      "beforeend",
      `
      <div class="giveaway-entry-row">
        <div>#${idx + 1}</div>
        <div class="giveaway-user-cell">${entry.username}</div>
        <div>${tokenHTML(entry.entryFee)}</div>
        <div class="hide-sm">${entry.joinedAt || "-"}</div>
      </div>
      `
    );
  });
}

(function setupModal() {
  const backdrop = document.getElementById("giveawayModalBackdrop");
  const openBtn = document.getElementById("openGiveawayModal");
  const closeBtn = document.getElementById("closeGiveawayModal");

  if (!backdrop || !openBtn || !closeBtn) return;

  const open = () => backdrop.classList.add("show");
  const close = () => backdrop.classList.remove("show");

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

(async () => {
  const siteCfg = await loadConfig();
  fx.setMode(siteCfg.season || "winter");

  const nameEl = document.getElementById("siteName");
  if (nameEl) nameEl.textContent = siteCfg.siteName || "RALF1Q Rewards";

  const cfg = await loadGiveawayConfig();

  document.getElementById("giveawayTitle").textContent = cfg.title || "Giveaway";
  document.getElementById("giveawaySubtitle").textContent = cfg.subtitle || "";
  document.getElementById("giveawayInfoLine").textContent = cfg.infoLine || "";

  document.getElementById("winnerCount").textContent = cfg.winnerCount || 0;
  document.getElementById("prizePerWinner").innerHTML = tokenHTML(cfg.prizePerWinner || 0);
  document.getElementById("entryFee").innerHTML = tokenHTML(cfg.entryFee || 0);

  const totalPrizePool = Number(cfg.winnerCount || 0) * Number(cfg.prizePerWinner || 0);
  const totalEntries = (cfg.entries || []).length;
  const totalEntryFeesPaid = (cfg.entries || []).reduce((sum, entry) => sum + Number(entry.entryFee || 0), 0);

  document.getElementById("totalPrizePool").innerHTML = tokenHTML(totalPrizePool);
  document.getElementById("totalEntries").textContent = totalEntries;
  document.getElementById("totalEntryFeesPaid").innerHTML = tokenHTML(totalEntryFeesPaid);

  renderEntries(cfg.entries || []);
  startCountdown(cfg.endDate);

  document.getElementById("modalTitle").textContent = cfg.title || "Join Giveaway";
  document.getElementById("modalEntryFee").innerHTML = tokenHTML(cfg.entryFee || 0);
  document.getElementById("modalSkinraveId").textContent = cfg.skinraveId || "";
  document.getElementById("modalDiscordUser").textContent = cfg.discordUsername || "ralf1q";

  const discordBtn = document.getElementById("discordContactBtn");
  if (discordBtn) {
    discordBtn.href = cfg.discordLink || "#";
  }

  const copyBtn = document.getElementById("copySkinraveIdBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(String(cfg.skinraveId || ""));
        copyBtn.textContent = "Copied";
        setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
      } catch {
        // ignore
      }
    });
  }
})();