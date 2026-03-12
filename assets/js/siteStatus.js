// assets/js/siteStatus.js
// Global status redirect controlled by /config.json
//
// siteStatus values:
// - live
// - maintenance
// - launchingsoon
// - end

export async function enforceSiteStatus(opts = {}) {
  const {
    allow = [],
  } = opts;

  const normalize = (p) => (p.endsWith("/") ? p : p + "/");
  const path = normalize(location.pathname);

  if (path.startsWith("/assets/")) return;

  const allowed = new Set([
    "/",
    "/leaderboard/",
    "/profile/",
    "/giveaway/",
    "/admin/",
    "/maintenance/",
    "/launchingsoon/",
    "/theend/",
    "/404.html/",
    ...allow.map(normalize),
  ]);

  let cfg;
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    cfg = await res.json();
  } catch {
    return;
  }

  const status = String(cfg.siteStatus || "live").toLowerCase();

  const targets = {
    live: "/",
    maintenance: "/maintenance/",
    launchingsoon: "/launchingsoon/",
    end: "/theend/",
  };

  const target = targets[status] || "/";

  if (!allowed.has(path) && !path.startsWith("/admin/")) {
    return;
  }

  if (status === "live") {
    if (
      path === "/maintenance/" ||
      path === "/launchingsoon/" ||
      path === "/theend/"
    ) {
      location.replace("/");
    }
    return;
  }

  if (path !== target) {
    location.replace(target);
  }
}
