(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");

  const setNavigation = (open) => {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    const label = navToggle.querySelector(".sr-only");
    if (label) label.textContent = open ? "Cerrar navegación" : "Abrir navegación";
  };

  navToggle?.addEventListener("click", () => {
    setNavigation(navToggle.getAttribute("aria-expanded") !== "true");
  });

  nav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNavigation(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setNavigation(false);
  });

  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const filterButtons = document.querySelectorAll("[data-filter]");
  const skillCards = document.querySelectorAll("[data-domains]");
  const filterStatus = document.querySelector("[data-filter-status]");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;
      let visible = 0;

      filterButtons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });

      skillCards.forEach((card) => {
        const domains = card.dataset.domains?.split(" ") ?? [];
        const show = selected === "all" || domains.includes(selected);
        card.classList.toggle("is-hidden", !show);
        if (show) visible += 1;
      });

      if (filterStatus) {
        filterStatus.textContent = `${visible} competencias visibles para el filtro ${button.textContent.trim()}.`;
      }
    });
  });

  const copyButton = document.querySelector("[data-copy-url]");
  const copyStatus = document.querySelector("[data-copy-status]");
  copyButton?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("https://krakaur.github.io/");
      if (copyStatus) copyStatus.textContent = "Enlace copiado al portapapeles.";
    } catch {
      if (copyStatus) copyStatus.textContent = "Enlace: https://krakaur.github.io/";
    }
  });

  document.querySelectorAll("[data-copy-value]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copyValue ?? "";
      const feedback = button.parentElement?.querySelector("[data-copy-feedback]");
      try {
        await navigator.clipboard.writeText(value);
        if (feedback) feedback.textContent = "Número copiado al portapapeles.";
      } catch {
        if (feedback) feedback.textContent = `Número para copiar: ${value}`;
      }
    });
  });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
