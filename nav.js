/* Shared hamburger nav: restructures an existing .top-nav into a
   collapsible toggle + menu, then wires up open/close behavior.
   Handles both flat navs (links/cta direct children of .top-nav) and
   navs that wrap their row in a .top-nav__inner container. */
(function () {
  function init() {
    const nav = document.querySelector(".top-nav");
    if (!nav) return;

    const host = nav.querySelector(".top-nav__inner") || nav;
    const logo = host.querySelector(".top-nav__logo");
    const linksEl = host.querySelector(".top-nav__links");
    const ctaEl = host.querySelector(".top-nav__cta");

    let toggle = host.querySelector(".top-nav__toggle");
    let menu = host.querySelector(".top-nav__menu");

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "top-nav__toggle";
      toggle.id = "nav-toggle";
      toggle.setAttribute("aria-label", "Toggle menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "nav-menu");
      toggle.innerHTML = "<span></span><span></span><span></span>";
      if (logo && logo.nextSibling) host.insertBefore(toggle, logo.nextSibling);
      else if (logo) host.appendChild(toggle);
      else host.insertBefore(toggle, host.firstChild);
    }

    if (!menu) {
      menu = document.createElement("div");
      menu.className = "top-nav__menu";
      menu.id = "nav-menu";
      host.appendChild(menu);
      if (linksEl) menu.appendChild(linksEl);
      if (ctaEl) menu.appendChild(ctaEl);
    }

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    window.addEventListener("resize", () => { if (window.innerWidth > 900) close(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
