// assets/js/caseWidget.js

export function initCaseWidget(options = {}) {
  const cases = options.cases || [];
  const rotateMs = Number(options.rotateMs || 4000);

  if (!cases.length) return;

  const root = document.createElement("div");
  root.className = "case-widget";

  root.innerHTML = `
    <div class="case-widget-inner">
      <div class="case-widget-header">
        <div class="case-widget-badge" id="caseWidgetBadge">HOT CASE</div>

        <div class="case-widget-collapsed-label">
          <div class="case-widget-mini-left">
            <div class="case-widget-mini-title">
              <img id="caseWidgetMiniImage" alt="case icon">
              <div class="case-widget-mini-text">
                <div class="case-widget-mini-badge" id="caseWidgetMiniBadge">HOT CASE</div>
                <span id="caseWidgetMiniTitle">Case</span>
              </div>
            </div>
          </div>
        </div>

        <button class="case-widget-toggle" id="caseWidgetToggle" aria-label="Hide widget">
          <span class="case-widget-toggle-icon" aria-hidden="true"></span>
        </button>
      </div>

      <div class="case-widget-body">
        <div class="case-widget-media">
          <img id="caseWidgetImage" alt="case image">
        </div>

        <div class="case-widget-title" id="caseWidgetTitle"></div>

        <div class="case-widget-price" id="caseWidgetPrice"></div>

        <div class="case-widget-actions">
          <a id="caseWidgetButton" class="case-widget-btn primary" target="_blank" rel="noopener">
            Check Case →
          </a>
        </div>

        <div class="case-widget-progress">
          <div class="case-widget-progress-bar" id="caseWidgetProgress"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const badgeEl = root.querySelector("#caseWidgetBadge");
  const miniBadgeEl = root.querySelector("#caseWidgetMiniBadge");
  const imageEl = root.querySelector("#caseWidgetImage");
  const miniImageEl = root.querySelector("#caseWidgetMiniImage");
  const titleEl = root.querySelector("#caseWidgetTitle");
  const miniTitleEl = root.querySelector("#caseWidgetMiniTitle");
  const priceEl = root.querySelector("#caseWidgetPrice");
  const buttonEl = root.querySelector("#caseWidgetButton");
  const progressEl = root.querySelector("#caseWidgetProgress");
  const toggleEl = root.querySelector("#caseWidgetToggle");

  let current = 0;
  let intervalId = null;
  let progressId = null;
  let progressStart = 0;
  let isCollapsed = false;

  function tokenPriceHTML(price) {
    return `
      <img src="/assets/images/token.png" alt="token">
      <span>${price}</span>
    `;
  }

  function applyBadgeColors(item) {
    const badgeColor = item.badgeColor || {};

    root.style.setProperty("--case-badge-color", badgeColor.text || "#7ef3b8");
    root.style.setProperty("--case-badge-bg", badgeColor.bg || "rgba(62,210,135,.14)");
    root.style.setProperty("--case-badge-border", badgeColor.border || "rgba(62,210,135,.20)");
  }

  function renderCase(item) {
    const badge = item.badge || "HOT CASE";

    badgeEl.textContent = badge;
    miniBadgeEl.textContent = badge;

    applyBadgeColors(item);

    imageEl.src = item.image;
    imageEl.alt = item.title;

    miniImageEl.src = item.image;
    miniImageEl.alt = item.title;

    titleEl.textContent = item.title;
    miniTitleEl.textContent = item.title;

    priceEl.innerHTML = tokenPriceHTML(item.price);
    buttonEl.href = item.url;
  }

  function stopTimers() {
    clearInterval(intervalId);
    cancelAnimationFrame(progressId);
    intervalId = null;
    progressId = null;
  }

  function restartProgress() {
    cancelAnimationFrame(progressId);
    progressStart = performance.now();

    function tick(now) {
      if (isCollapsed) return;

      const elapsed = now - progressStart;
      const pct = Math.min(100, (elapsed / rotateMs) * 100);
      progressEl.style.width = `${pct}%`;

      if (pct < 100) {
        progressId = requestAnimationFrame(tick);
      }
    }

    progressEl.style.width = "0%";
    progressId = requestAnimationFrame(tick);
  }

  function showCurrent() {
    const item = cases[current];
    root.classList.remove("fade-out");
    renderCase(item);
    restartProgress();
  }

  function nextCase() {
    if (isCollapsed) return;

    root.classList.add("fade-out");

    setTimeout(() => {
      current = (current + 1) % cases.length;
      showCurrent();
    }, 220);
  }

  function startRotation() {
    stopTimers();
    if (isCollapsed) return;

    showCurrent();
    intervalId = setInterval(nextCase, rotateMs);
  }

  function setCollapsed(collapsed) {
    isCollapsed = collapsed;

    if (isCollapsed) {
      root.classList.add("collapsed");
      toggleEl.setAttribute("aria-label", "Show widget");
      stopTimers();
      progressEl.style.width = "0%";
    } else {
      root.classList.remove("collapsed");
      toggleEl.setAttribute("aria-label", "Hide widget");
      showCurrent();
      intervalId = setInterval(nextCase, rotateMs);
    }
  }

  toggleEl.addEventListener("click", () => {
    setCollapsed(!isCollapsed);
  });

  root.addEventListener("mouseenter", () => {
    if (!isCollapsed) stopTimers();
  });

  root.addEventListener("mouseleave", () => {
    if (!isCollapsed) {
      restartProgress();
      intervalId = setInterval(nextCase, rotateMs);
    }
  });

  renderCase(cases[current]);

  requestAnimationFrame(() => {
    root.classList.add("show");
    startRotation();
  });
}
