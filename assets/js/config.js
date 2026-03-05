export async function loadConfig() {
  // Always resolve config.json from site root
  const base = `${location.origin}${location.pathname.startsWith("/leaderboard") || location.pathname.startsWith("/admin") ? "/" : "/"}`;
  const res = await fetch(`${base}config.json`, { cache: "no-store" });
  const cfg = await res.json();

  const bar = document.getElementById("announcement");
  if (bar && cfg.announcement?.enabled) {
    bar.style.display = "block";
    if (cfg.announcement.link) {
      bar.innerHTML = `<a href="${cfg.announcement.link}" target="_blank" rel="noopener">${cfg.announcement.text}</a>`;
    } else {
      bar.textContent = cfg.announcement.text;
    }
  }

  document.body.dataset.season = cfg.season || "winter";
  return cfg;
}

export function fmtToken(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return num.toFixed(2); // keep 2 decimals like now
}