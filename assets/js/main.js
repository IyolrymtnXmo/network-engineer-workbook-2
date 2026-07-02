/* ============================================================
   Network Engineer Workbook — shared behaviour
   - theme toggle (light/dark, persisted)
   - TOC scroll-spy on lab pages
   - task checkbox persistence per page
   - lab completion tracking + index progress dashboard
   - answer <details> open-all on print
   - back-to-top button
   ============================================================ */
(function () {
  "use strict";

  var THEME_KEY = "wb-theme";
  var PROGRESS_KEY = "wb-lab-progress"; // JSON: { lab01: true, ... }
  var pageId = document.body.getAttribute("data-page") || "";

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    applyTheme(theme);
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
      });
    }
  }

  /* ---------- progress store ---------- */
  function readProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function writeProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  }

  /* ---------- TOC scroll-spy ---------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
    if (!links.length) return;
    var sections = links
      .map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); })
      .filter(Boolean);
    function onScroll() {
      var pos = window.scrollY + 120;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= pos) current = sections[i];
      }
      links.forEach(function (a) {
        a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- mobile TOC toggle ---------- */
  function initTocToggle() {
    var btn = document.querySelector(".toc-mobile-toggle");
    var toc = document.querySelector(".toc");
    if (!btn || !toc) return;
    btn.addEventListener("click", function () {
      toc.classList.toggle("open");
    });
    toc.addEventListener("click", function (e) {
      if (e.target.closest("a")) toc.classList.remove("open");
    });
  }

  /* ---------- task checkboxes (persist per page) ---------- */
  function initTaskChecks() {
    if (!pageId) return;
    var key = "wb-tasks-" + pageId;
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
    var boxes = document.querySelectorAll(".task-check");
    boxes.forEach(function (box, i) {
      var id = box.getAttribute("data-task") || String(i);
      box.checked = !!saved[id];
      box.closest("li") && box.closest("li").classList.toggle("done", box.checked);
      box.addEventListener("change", function () {
        saved[id] = box.checked;
        try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
        box.closest("li") && box.closest("li").classList.toggle("done", box.checked);
      });
    });
  }

  /* ---------- lab complete button ---------- */
  function renderCompleteBtn(btn, done) {
    btn.classList.toggle("done-state", done);
    btn.classList.toggle("primary", !done);
    btn.textContent = done ? "✓ ทำ Lab นี้เสร็จแล้ว (คลิกเพื่อยกเลิก)" : "ทำ Lab นี้เสร็จแล้ว";
  }
  function initCompleteBtn() {
    var btn = document.querySelector("[data-complete-btn]");
    if (!btn || !pageId) return;
    var progress = readProgress();
    renderCompleteBtn(btn, !!progress[pageId]);
    btn.addEventListener("click", function () {
      var p = readProgress();
      p[pageId] = !p[pageId];
      writeProgress(p);
      renderCompleteBtn(btn, !!p[pageId]);
    });
  }

  /* ---------- index dashboard ---------- */
  function initIndexProgress() {
    var fill = document.querySelector(".progress-fill");
    var text = document.querySelector(".progress-text");
    var cards = document.querySelectorAll(".lab-card[data-lab]");
    if (!cards.length) return;
    var progress = readProgress();
    var done = 0;
    cards.forEach(function (card) {
      var id = card.getAttribute("data-lab");
      var isDone = !!progress[id];
      if (isDone) done++;
      card.classList.toggle("completed", isDone);
      var check = card.querySelector(".lc-check");
      if (check) check.textContent = isDone ? "✓" : "";
    });
    var pct = Math.round((done / cards.length) * 100);
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = "ทำเสร็จแล้ว " + done + " จาก " + cards.length + " Labs (" + pct + "%)";
  }

  /* ---------- print: open all answers ---------- */
  function initPrintAnswers() {
    window.addEventListener("beforeprint", function () {
      document.querySelectorAll("details.answer").forEach(function (d) {
        d.setAttribute("data-was-open", d.open ? "1" : "0");
        d.open = true;
      });
    });
    window.addEventListener("afterprint", function () {
      document.querySelectorAll("details.answer").forEach(function (d) {
        if (d.getAttribute("data-was-open") === "0") d.open = false;
        d.removeAttribute("data-was-open");
      });
    });
  }

  /* ---------- back to top ---------- */
  function initBackTop() {
    var btn = document.querySelector(".back-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initScrollSpy();
    initTocToggle();
    initTaskChecks();
    initCompleteBtn();
    initIndexProgress();
    initPrintAnswers();
    initBackTop();
  });
})();
