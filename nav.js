/* Shared hamburger nav: restructures an existing .top-nav into a
   collapsible toggle + menu, then wires up open/close behavior. */
(function () {
  function init() {
    const nav = document.querySelector(".top-nav");
    if (!nav) return;

    let toggle = nav.querySelector(".top-nav__toggle");
    let menu = nav.querySelector(".top-nav__menu");

    /* Build the toggle + menu wrapper if the page uses the old flat markup */
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "top-nav__toggle";
      toggle.id = "nav-toggle";
      toggle.setAttribute("aria-label", "Toggle menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", "nav-menu");
      toggle.innerHTML = "<span></span><span></span><span></span>";
      const logo = nav.querySelector(".top-nav__logo");
      if (logo && logo.nextSibling) nav.insertBefore(toggle, logo.nextSibling);
      else nav.appendChild(toggle);
    }
    if (!menu) {
      menu = document.createElement("div");
      menu.className = "top-nav__menu";
      menu.id = "nav-menu";
      const movable = Array.from(nav.children).filter(
        (el) => el.classList.contains("top-nav__links") || el.classList.contains("top-nav__cta")
      );
      nav.appendChild(menu);
      movable.forEach((el) => menu.appendChild(el));
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
