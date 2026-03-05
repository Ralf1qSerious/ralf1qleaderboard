// assets/js/siteStatus.js
// Global status redirect controlled by /config.json
//
// siteStatus values:
// - live         -> redirect to "/"
// - maintenance  -> redirect to "/maintenance/"
// - launchingsoon-> redirect to "/launchingsoon/"

export async function enforceSiteStatus(opts = {}) {
  const {
    // allow certain paths even during maintenance (optional)
    allow = [],
  } = opts;

  const normalize = (p) => (p.endsWith("/") ? p : p + "/");
  const path = normalize(location.pathname);

  // Always allow config + assets
  if (path.startsWith("/assets/")) return;

  // Allowed pages (won't be forced away unless "live" redirect rule triggers)
  const allowed = new Set([
    "/",
    "/leaderboard/",
    "/admin/",
    "/maintenance/",
    "/launchingsoon/",
    "/404.html/",
    ...allow.map(normalize),
  ]);

  // If we can't fetch config, do nothing (avoid bricking the site)
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
  };

  const target = targets[status] || "/";

  // If user is on a totally unknown page, do nothing here.
  // (Let your 404 handle it.)
  if (!allowed.has(path) && !path.startsWith("/admin/")) {
    return;
  }

  // Redirect rules:
  // - If status is maintenance or launchingsoon, force EVERY allowed page to that target (except itself)
  // - If status is live, force maintenance/launchingsoon pages back to "/"
  if (status === "live") {
    if (path === "/maintenance/" || path === "/launchingsoon/") {
      location.replace("/");
    }
    return;
  }

  // maintenance / launchingsoon
  if (path !== target) {
    location.replace(target);
  }
}