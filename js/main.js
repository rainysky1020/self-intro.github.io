(function () {
  "use strict";

  const currentPage = document.body.dataset.page;

  function getBasePath() {
    const path = window.location.pathname;
    if (path.includes("/")) {
      const segments = path.split("/").filter(Boolean);
      if (segments.length > 1) {
        return "../".repeat(segments.length - 1);
      }
    }
    return "";
  }

  const basePath = getBasePath();

  async function loadPartial(elementId, partialPath) {
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      const response = await fetch(basePath + partialPath);
      if (!response.ok) throw new Error("Failed to load " + partialPath);
      el.innerHTML = await response.text();
      fixPartialLinks(el);
    } catch (err) {
      console.warn("Partial load failed:", err.message);
    }
  }

  function fixPartialLinks(container) {
    container.querySelectorAll("a[href]").forEach(function (link) {
      const href = link.getAttribute("href");
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("#")
      ) {
        link.setAttribute("href", basePath + href);
      } else if (href && href.includes(".html#")) {
        const parts = href.split("#");
        link.setAttribute("href", basePath + parts[0] + "#" + parts[1]);
      }
    });
  }

  function setActiveNav() {
    const nav = document.getElementById("site-nav");
    if (!nav) return;

    nav.querySelectorAll("a[data-page]").forEach(function (link) {
      const page = link.dataset.page;
      if (page === currentPage) {
        link.setAttribute("aria-current", "page");
      } else if (page === "contact" && window.location.hash === "#contact") {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function initMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.setAttribute("aria-label", expanded ? "메뉴 열기" : "메뉴 닫기");
      nav.classList.toggle("is-open", !expanded);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "메뉴 열기");
        nav.classList.remove("is-open");
      });
    });
  }

  function initReveal() {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const elements = document.querySelectorAll(".reveal");
    if (prefersReduced) {
      elements.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initFaq() {
    document.querySelectorAll(".faq-item").forEach(function (item) {
      const button = item.querySelector(".faq-question");
      if (!button) return;

      button.addEventListener("click", function () {
        const isOpen = item.classList.contains("is-open");

        document.querySelectorAll(".faq-item.is-open").forEach(function (open) {
          open.classList.remove("is-open");
          const btn = open.querySelector(".faq-question");
          if (btn) btn.setAttribute("aria-expanded", "false");
        });

        if (!isOpen) {
          item.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  function initAnchorScroll() {
    document.querySelectorAll('a[href*="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        const href = link.getAttribute("href");
        if (!href || href.startsWith("mailto:")) return;

        const hashIndex = href.indexOf("#");
        if (hashIndex === -1) return;

        const path = href.slice(0, hashIndex) || window.location.pathname;
        const hash = href.slice(hashIndex);
        const targetId = hash.slice(1);
        const currentFile = window.location.pathname.split("/").pop() || "index.html";
        const linkFile = path.split("/").pop() || "index.html";

        if (linkFile === currentFile || path === "") {
          const target = document.getElementById(targetId);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.pushState(null, "", hash);
            setActiveNav();
          }
        }
      });
    });

    if (window.location.hash) {
      const target = document.getElementById(
        window.location.hash.slice(1)
      );
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }

  async function init() {
    await Promise.all([
      loadPartial("site-header", "partials/header.html"),
      loadPartial("site-footer", "partials/footer.html"),
    ]);

    setActiveNav();
    initMobileNav();
    initReveal();
    initFaq();
    initAnchorScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
