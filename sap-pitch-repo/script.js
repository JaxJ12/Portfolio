document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  const assistant = document.querySelector("[data-assistant]");
  if (assistant) {
    const openButton = assistant.querySelector("[data-assistant-toggle]");
    const closeButton = assistant.querySelector("[data-assistant-close]");
    const panel = assistant.querySelector("[data-assistant-panel]");

    const setAssistantState = (isOpen) => {
      if (!panel || !openButton) return;
      panel.hidden = !isOpen;
      openButton.setAttribute("aria-expanded", String(isOpen));
      openButton.textContent = isOpen ? "Close" : "Open Assistant";
    };

    setAssistantState(false);

    if (openButton) {
      openButton.addEventListener("click", () => {
        const isOpen = panel.hidden;
        setAssistantState(isOpen);
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => setAssistantState(false));
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setAssistantState(false);
    });

    document.addEventListener("click", (event) => {
      if (!panel || panel.hidden) return;
      if (assistant.contains(event.target)) return;
      setAssistantState(false);
    });
  }

  const homeScene = document.querySelector("[data-home-scene]");
  if (homeScene) {
    const updateHomeScene = () => {
      const rect = homeScene.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const rawProgress = 1 - rect.top / viewportHeight;
      const progress = Math.min(Math.max(rawProgress, 0), 1.35);
      const shift = Math.min(Math.max((progress - 0.08) * 120, 0), 90);
      const scale = 1 + Math.min(progress * 0.04, 0.04);

      homeScene.style.setProperty("--hero-progress", progress.toFixed(3));
      homeScene.style.setProperty("--hero-shift", `${shift.toFixed(2)}px`);
      homeScene.style.setProperty("--hero-scale", scale.toFixed(3));
    };

    updateHomeScene();
    window.addEventListener("scroll", updateHomeScene, { passive: true });
    window.addEventListener("resize", updateHomeScene);
  }

  const transitionWrap = document.querySelector(".page-transition");
  const panel = transitionWrap?.querySelector(".page-transition__panel");
  const hasGSAP = typeof gsap !== "undefined";

  if (!transitionWrap || !panel) return;

  const pageNodes = Array.from(document.body.children).filter(
    (node) => !node.classList?.contains("page-transition")
  );

  const setCompactPanel = () => {
    panel.style.opacity = "0";
    panel.style.width = "min(34vw, 460px)";
    panel.style.height = "min(22vw, 300px)";
    panel.style.borderRadius = "28px";
    panel.style.transform = "translate(-50%, -50%) scale(0.88)";
  };

  const setExpandedPanel = () => {
    panel.style.opacity = "1";
    panel.style.width = "100vw";
    panel.style.height = "100vh";
    panel.style.borderRadius = "0px";
    panel.style.transform = "translate(-50%, -50%) scale(1)";
  };

  const cleanupPageNodes = () => {
    pageNodes.forEach((node) => {
      node.style.removeProperty("opacity");
      node.style.removeProperty("transform");
      node.style.removeProperty("filter");
    });
  };

  const playEntrance = () => {
    document.body.classList.remove("is-transitioning");

    if (hasGSAP) {
      gsap.set(panel, {
        opacity: 1,
        width: "min(34vw, 460px)",
        height: "min(22vw, 300px)",
        borderRadius: 28,
        scale: 0.88,
        xPercent: -50,
        yPercent: -50
      });

      gsap.set(pageNodes, {
        opacity: 0,
        scale: 0.9,
        y: 34,
        filter: "blur(10px)",
        transformOrigin: "50% 50%"
      });

      const tl = gsap.timeline({
        onComplete: () => {
          transitionWrap.classList.remove("is-entering", "is-leaving");
          setCompactPanel();
          cleanupPageNodes();
        }
      });

      tl.to(panel, {
        width: "min(90vw, 1320px)",
        height: "min(86vh, 920px)",
        borderRadius: 18,
        scale: 1,
        duration: 0.68,
        ease: "power3.inOut"
      }).to(panel, {
        opacity: 0,
        scale: 1.02,
        duration: 0.22,
        ease: "power2.out"
      }, "-=0.08").to(pageNodes, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.82,
        ease: "power3.out",
        stagger: 0.02
      }, "-=0.5");
    } else {
      panel.style.opacity = "1";
      panel.style.width = "min(34vw, 460px)";
      panel.style.height = "min(22vw, 300px)";
      panel.style.borderRadius = "28px";
      panel.style.transform = "translate(-50%, -50%) scale(0.88)";
      pageNodes.forEach((node) => {
        node.style.opacity = "0";
        node.style.transform = "translateY(34px) scale(0.9)";
        node.style.filter = "blur(10px)";
      });

      requestAnimationFrame(() => {
        panel.style.transition = "width 0.68s cubic-bezier(0.65, 0, 0.35, 1), height 0.68s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.68s cubic-bezier(0.65, 0, 0.35, 1), transform 0.68s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.22s ease";
        panel.style.width = "min(90vw, 1320px)";
        panel.style.height = "min(86vh, 920px)";
        panel.style.borderRadius = "18px";
        panel.style.transform = "translate(-50%, -50%) scale(1.02)";
        setTimeout(() => {
          panel.style.opacity = "0";
          transitionWrap.classList.remove("is-entering", "is-leaving");
        }, 520);

        pageNodes.forEach((node) => {
          node.style.transition = "opacity 0.82s ease, transform 0.82s cubic-bezier(0.22, 1, 0.36, 1), filter 0.82s ease";
          node.style.opacity = "1";
          node.style.transform = "translateY(0) scale(1)";
          node.style.filter = "blur(0px)";
        });
      });
    }
  };

  const playExit = (targetURL) => {
    transitionWrap.classList.add("is-leaving");
    document.body.classList.add("is-transitioning");

    if (hasGSAP) {
      gsap.set(panel, {
        opacity: 1,
        width: "min(34vw, 460px)",
        height: "min(22vw, 300px)",
        borderRadius: 28,
        scale: 0.88,
        xPercent: -50,
        yPercent: -50
      });

      const tl = gsap.timeline({
        onComplete: () => {
          window.location.href = targetURL;
        }
      });

      tl.to(pageNodes, {
        opacity: 0.2,
        scale: 0.985,
        y: -10,
        filter: "blur(4px)",
        duration: 0.38,
        ease: "power2.inOut",
        stagger: 0.01
      }, 0).to(panel, {
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        scale: 1,
        duration: 0.72,
        ease: "power3.inOut"
      }, 0.05);
    } else {
      panel.style.opacity = "1";
      panel.style.width = "min(34vw, 460px)";
      panel.style.height = "min(22vw, 300px)";
      panel.style.borderRadius = "28px";
      panel.style.transform = "translate(-50%, -50%) scale(0.88)";

      requestAnimationFrame(() => {
        panel.style.transition = "width 0.72s cubic-bezier(0.65, 0, 0.35, 1), height 0.72s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.72s cubic-bezier(0.65, 0, 0.35, 1), transform 0.72s cubic-bezier(0.65, 0, 0.35, 1)";
        panel.style.width = "100vw";
        panel.style.height = "100vh";
        panel.style.borderRadius = "0px";
        panel.style.transform = "translate(-50%, -50%) scale(1)";
        setTimeout(() => {
          window.location.href = targetURL;
        }, 760);
      });
    }
  };

  const isInternalLink = (anchor) => {
    if (!anchor || !anchor.href) return false;
    if (anchor.target === "_blank") return false;
    if (anchor.hasAttribute("download")) return false;

    try {
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.hash) return false;
      if (anchor.protocol === "javascript:" || anchor.protocol === "mailto:") return false;
      return true;
    } catch {
      return false;
    }
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor || !isInternalLink(anchor)) return;

    try {
      const target = new URL(anchor.href, window.location.origin);
      if (target.pathname === window.location.pathname) return;
    } catch {
      return;
    }

    event.preventDefault();
    sessionStorage.setItem("__pt_pending", "1");
    playExit(anchor.href);
  });

  const shouldEnter = sessionStorage.getItem("__pt_pending") === "1";
  if (shouldEnter) {
    sessionStorage.removeItem("__pt_pending");
    playEntrance();
  } else {
    setCompactPanel();
    cleanupPageNodes();
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      transitionWrap.classList.remove("is-leaving");
      setCompactPanel();
      cleanupPageNodes();
    }
  });
});
