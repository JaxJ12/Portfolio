document.addEventListener("DOMContentLoaded", () => {
  const assistant = document.querySelector("[data-site-assistant]");
  if (!assistant) return;

  const toggle = assistant.querySelector("[data-site-assistant-toggle]");
  const close = assistant.querySelector("[data-site-assistant-close]");
  const panel = assistant.querySelector("[data-site-assistant-panel]");
  const frame = assistant.querySelector("[data-site-assistant-frame]");
  const frameSrc = frame?.getAttribute("data-src");

  if (!toggle || !close || !panel || !frame) return;

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("site-assistant-open", isOpen);

    if (isOpen && frameSrc && !frame.getAttribute("src")) {
      frame.setAttribute("src", frameSrc);
    }
  };

  toggle.addEventListener("click", () => {
    setOpen(panel.hidden);
  });

  close.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (panel.hidden) return;
    if (assistant.contains(event.target)) return;
    setOpen(false);
  });

  setOpen(false);
});
