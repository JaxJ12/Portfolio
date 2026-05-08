(function () {
  const TRANSITION_KEY = "__pt_pending";
  const TRANSITION_DURATION = 120;

  function ensureOverlay() {
    let wrap = document.querySelector(".page-transition");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "page-transition";
      wrap.setAttribute("aria-hidden", "true");
      const panel = document.createElement("div");
      panel.className = "page-transition__panel";
      wrap.appendChild(panel);
      document.body.appendChild(wrap);
    }
    if (!wrap.querySelector(".page-transition__panel")) {
      const panel = document.createElement("div");
      panel.className = "page-transition__panel";
      wrap.appendChild(panel);
    }
    return wrap;
  }

  function shouldHandleLink(link, event) {
    if (!link || !link.getAttribute) return false;
    const href = link.getAttribute("href");
    if (!href) return false;
    if (href.startsWith("#")) return false;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
    if (href.startsWith("http")) return false;
    if (link.target === "_blank") return false;
    if (link.hasAttribute("download")) return false;
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return false;
    if (event && event.button !== 0) return false;
    return true;
  }

  const overlay = ensureOverlay();

  if (sessionStorage.getItem(TRANSITION_KEY) === "1") {
    sessionStorage.removeItem(TRANSITION_KEY);
    overlay.classList.add("is-entering");
    requestAnimationFrame(() => {
      overlay.classList.remove("is-entering");
    });
  }

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
      if (!shouldHandleLink(link, event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      if (!overlay.classList.contains("is-leaving")) {
        overlay.classList.add("is-leaving");
        document.body.classList.add("is-transitioning");
        sessionStorage.setItem(TRANSITION_KEY, "1");
        window.setTimeout(() => {
          window.location.href = link.getAttribute("href");
        }, TRANSITION_DURATION);
      }
    },
    true
  );
})();
