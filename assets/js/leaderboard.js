// assets/js/leaderboard.js
import { loadConfig, fmtToken } from "./config.js";
import { setupFxCanvas } from "./effects.js";

const fx = setupFxCanvas();

let cfg;
const lastSnapshotKey = "lb_last_snapshot_v2";

// IMPORTANT: leaderboard page pathing
// leaderboard/index.html loads: /assets/js/leaderboard.js
// so images should be absolute for reliability
const TOKEN_IMG = "/assets/images/token.png";

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (!el) return;

  el.textContent = text;

  // add green live pulse dot when connected/updated
  el.classList.add("status-live");

  // if message indicates an error, remove the green dot
  if (/error|failed|offline|reconnect/i.test(text)) {
    el.classList.remove("status-live");
  }
}

function tokenHTML(value) {
  return `
    <span class="token-num">
      ${value}
      <img src="${TOKEN_IMG}" alt="token">
    </span>
  `;
}

function computeRange(rangeDays) {
  const to = new Date();
  const from = new Date(to.getTime() - (rangeDays || 7) * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildProxyUrl() {
  const { from, to } = computeRange(cfg.api.rangeDays);
  const qs = new URLSearchParams({
    token: cfg.api.token,
    skip: "0",
    take: String(cfg.api.take || 30),
    order: cfg.api.order || "DESC",
    from,
    to,
  });
  return `${cfg.api.proxyBase}/api/leaderboard?${qs.toString()}`;
}

function buildSseUrl() {
  const { from, to } = computeRange(cfg.api.rangeDays);
  const qs = new URLSearchParams({
    token: cfg.api.token,
    skip: "0",
    take: String(cfg.api.take || 30),
    order: cfg.api.order || "DESC",
    from,
    to,
  });
  return `${cfg.api.proxyBase}/sse/leaderboard?${qs.toString()}`;
}

/**
 * Worker JSON:
 * {
 *   totalCount: 19,
 *   filteredCount: 2,
 *   list: [
 *     { user: { id, username, avatarUrl }, earned, wagered, ... }
 *   ]
 * }
 */
function normalizePlayers(apiJson) {
  const list = apiJson?.list || apiJson?.items || [];
  return list.map((row) => ({
    id: row?.user?.id ?? row?.userId ?? row?.id ?? row?.user?.username ?? cryptoRandomId(),
    name: row?.user?.username ?? row?.username ?? "Unknown",
    avatar: row?.user?.avatarUrl ?? row?.avatarUrl ?? "",
    earned: Number(row?.earned ?? 0),
    wagered: Number(row?.wagered ?? 0),
  }));
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2);
}

function getPrize(rank) {
  const p = cfg.prizes?.find((x) => Number(x.rank) === Number(rank));
  return p ? tokenHTML(fmtToken(p.amount)) : "-";
}

function loadPrevRanks() {
  try {
    return JSON.parse(localStorage.getItem(lastSnapshotKey) || "{}");
  } catch {
    return {};
  }
}

function saveRanks(players) {
  const map = {};
  players.forEach((p, i) => (map[p.id] = i + 1));
  localStorage.setItem(lastSnapshotKey, JSON.stringify(map));
}

function rankDelta(prevMap, playerId, newRank) {
  const prev = prevMap[playerId];
  if (!prev) return { cls: "same", txt: "•" };
  const diff = prev - newRank;
  if (diff > 0) return { cls: "up", txt: `▲ ${diff}` };
  if (diff < 0) return { cls: "down", txt: `▼ ${Math.abs(diff)}` };
  return { cls: "same", txt: "•" };
}

function avatarUrl(a, name) {
  if (a && typeof a === "string" && a.trim().length > 0) return a;
  return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(name || "user")}`;
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

    const days = document.getElementById("days");
    const hours = document.getElementById("hours");
    const minutes = document.getElementById("minutes");
    const seconds = document.getElementById("seconds");

    if (days) days.textContent = d;
    if (hours) hours.textContent = h;
    if (minutes) minutes.textContent = m;
    if (seconds) seconds.textContent = s;
  }
  tick();
  setInterval(tick, 1000);
}

function render(players) {
  const podium = document.getElementById("podium");
  const rows = document.getElementById("rows");
  if (!podium || !rows) return;

  podium.innerHTML = "";
  rows.innerHTML = "";

  const prev = loadPrevRanks();

  // esports podium: 2nd, 1st, 3rd
  const top3 = players.slice(0, 3);
  const displayOrder = [1, 0, 2];

  const podiumCard = (p, rank) => {
    const medalClass = rank === 1 ? "medal-1" : rank === 2 ? "medal-2" : "medal-3";
    const cardClass =
      rank === 1 ? "podium-card first" : rank === 2 ? "podium-card second" : "podium-card third";

    return `
      <div class="${cardClass}">
        ${rank === 1 ? `<div class="gold-glow"></div>` : ``}
        <div class="rank-medal ${medalClass}">#${rank}</div>
        <div class="avatar">
          <img src="${avatarUrl(p.avatar, p.name)}" alt="">
        </div>
        <div class="podium-name">${escapeHtml(p.name)}</div>
        <div class="podium-metrics">
          <div class="metric"><span>Earned</span><b>${tokenHTML(fmtToken(p.earned))}</b></div>
          <div class="metric"><span>Wagered</span><b>${tokenHTML(fmtToken(p.wagered))}</b></div>
        </div>
        <div class="prize">Prize ${getPrize(rank)}</div>
      </div>
    `;
  };

  for (const idx of displayOrder) {
    const p = top3[idx];
    if (!p) continue;
    podium.insertAdjacentHTML("beforeend", podiumCard(p, idx + 1));
  }

  // gold burst on #1
  fx.burstGoldAtElement(podium.querySelector(".podium-card.first"));

  // TABLE: start at #4 because podium already shows #1-#3
  const rest = players.slice(3);

  rest.forEach((p, idx) => {
    const rank = idx + 4; // ranks: 4, 5, 6...
    const delta = rankDelta(prev, p.id, rank);

    rows.insertAdjacentHTML(
      "beforeend",
      `
      <div class="trow">
        <div class="rankbox">
          <div>#${rank}</div>
          <div class="rankdelta ${delta.cls}">${delta.txt}</div>
        </div>

        <div class="playercell">
          <div class="pfp"><img src="${avatarUrl(p.avatar, p.name)}" alt=""></div>
          <div>
            <div class="playername">${escapeHtml(p.name)}</div>
            <div class="small">User ID: <span class="muted">${escapeHtml(String(p.id))}</span></div>
          </div>
        </div>

        <div class="num">${tokenHTML(fmtToken(p.earned))}</div>
        <div class="num hide-sm">${tokenHTML(fmtToken(p.wagered))}</div>
        <div class="num" style="color:var(--gold)">${getPrize(rank)}</div>
      </div>
      `
    );
  });

  // Save full snapshot ranks for next update comparisons
  saveRanks(players);
  setStatus(`Updated: ${new Date().toLocaleTimeString()}`);
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchOnce() {
  const url = buildProxyUrl();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const json = await res.json();
  return normalizePlayers(json);
}

function startPolling() {
  setStatus("Polling every 60s…");
  const run = async () => {
    try {
      const players = await fetchOnce();
      render(players);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
      console.error(e);
    }
  };
  run();
  setInterval(run, 60000);
}

function startSSE() {
  const sseUrl = buildSseUrl();
  setStatus("Live stream connected…");

  const es = new EventSource(sseUrl);

  es.addEventListener("leaderboard", (ev) => {
    try {
      const json = JSON.parse(ev.data);
      const players = normalizePlayers(json);
      render(players);
    } catch (e) {
      console.error("SSE parse error", e);
    }
  });

  es.addEventListener("error", () => {
    setStatus("Live stream failed → fallback polling");
    es.close();
    startPolling();
  });
}

(async () => {
  cfg = await loadConfig();

  const nameEl = document.getElementById("siteName");
  if (nameEl) nameEl.textContent = cfg.siteName || "RALF1Q Rewards";

  startCountdown(cfg.countdownEnd);
  fx.setMode(cfg.season || "winter");

  if (!cfg.api?.proxyBase) {
    setStatus("Missing api.proxyBase in config.json");
    return;
  }

  if (cfg.api.useSSE) startSSE();
  else startPolling();
})();