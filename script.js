(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme ---------- */
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem("theme", t); } catch (e) {}
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.setAttribute("aria-label", root.getAttribute("data-theme") === "dark" ? "Switch to light theme" : "Switch to dark theme");
    toggle.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------- top bar border on scroll ---------- */
  var bar = document.querySelector(".topbar");
  if (bar) {
    var onScroll = function () { bar.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- hero pipeline ---------- */
  var pipe = document.querySelector("[data-pipe]");
  if (pipe) {
    var tabs = Array.prototype.slice.call(pipe.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    var fill = pipe.querySelector(".rail-fill");
    var pulse = pipe.querySelector(".rail-pulse");
    var timers = [];
    var running = false;

    var select = function (i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].classList.toggle("is-active", on);
      });
      if (focus) tabs[i].focus();
    };

    var setProgress = function (i, ms) {
      var pct = (i / (tabs.length - 1)) * 100;
      var tr = ms ? "width " + ms + "ms cubic-bezier(.45,0,.25,1), left " + ms + "ms cubic-bezier(.45,0,.25,1)" : "none";
      fill.style.transition = tr;
      pulse.style.transition = tr;
      fill.style.width = pct + "%";
      pulse.style.left = pct + "%";
    };

    var markDone = function (upto) {
      tabs.forEach(function (t, j) { t.classList.toggle("is-done", j <= upto); });
    };

    var clear = function () { timers.forEach(clearTimeout); timers = []; };

    var play = function () {
      clear();
      running = true;
      pipe.classList.add("is-running");
      markDone(-1);
      setProgress(0, 0);
      var gate = 4;
      var t = 120;
      var step = 190;
      for (var k = 0; k < tabs.length; k++) {
        (function (k) {
          timers.push(setTimeout(function () {
            markDone(k);
            if (k === gate) tabs[k].classList.add("is-checking");
          }, t));
          if (k < tabs.length - 1) {
            timers.push(setTimeout(function () { setProgress(k + 1, step); }, t + (k === gate ? 420 : 20)));
            t += step + (k === gate ? 420 : 20);
          }
        })(k);
      }
      timers.push(setTimeout(function () {
        tabs[gate].classList.remove("is-checking");
        pipe.classList.remove("is-running");
        running = false;
        select(gate, false);
      }, t + 220));
    };

    var finish = function () {
      clear();
      running = false;
      pipe.classList.remove("is-running");
      tabs.forEach(function (t) { t.classList.remove("is-checking"); });
      markDone(tabs.length - 1);
      setProgress(tabs.length - 1, 0);
    };

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { if (running) finish(); select(i, false); });
      t.addEventListener("mouseenter", function () { if (running) return; select(i, false); });
      t.addEventListener("focus", function () { if (running) finish(); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); if (running) finish(); select(n, true); }
      });
    });

    var replay = pipe.querySelector("[data-replay]");
    if (replay) replay.addEventListener("click", function () {
      if (reduced) { finish(); select(4, false); return; }
      play();
    });

    if (reduced) { finish(); } else { play(); }
  }

  /* ---------- waffle (report extraction) ---------- */
  var MODES = {
    ocr: { ok: 14, flag: 0, silent: 0 },
    trial: { ok: 87, flag: 3, silent: 0 },
    delivered: { ok: 87, flag: 1, silent: 2 }
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-waffle]"), function (w) {
    var cells = w.querySelectorAll(".waffle i");
    var num = w.querySelector("[data-w-num]");
    var note = w.querySelector("[data-w-note]");
    var btns = Array.prototype.slice.call(w.querySelectorAll("[data-mode]"));
    var apply = function (mode) {
      var m = MODES[mode];
      for (var i = 0; i < cells.length; i++) {
        var c = i < m.ok ? "ok" : i < m.ok + m.flag ? "flag" : i < m.ok + m.flag + m.silent ? "silent" : "";
        cells[i].className = c;
      }
      if (num) num.textContent = m.ok;
      btns.forEach(function (b) {
        var on = b.getAttribute("data-mode") === mode;
        b.setAttribute("aria-checked", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      if (note) note.textContent = w.querySelector('[data-note="' + mode + '"]').textContent;
    };
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-mode")); });
      b.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % btns.length;
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + btns.length) % btns.length;
        if (n !== null) { e.preventDefault(); apply(btns[n].getAttribute("data-mode")); btns[n].focus(); }
      });
    });
  });

  /* ---------- scroll spy for side nav and case-study contents ---------- */
  function spy(navSel, targetsSel) {
    var nav = document.querySelector(navSel);
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var targets = Array.prototype.slice.call(document.querySelectorAll(targetsSel)).filter(function (el) { return map[el.id]; });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      for (var i = 0; i < targets.length; i++) { if (visible[targets[i].id]) { current = targets[i].id; break; } }
      if (!current) return;
      links.forEach(function (a) { a.setAttribute("aria-current", a === map[current] ? "true" : "false"); });
    }, { rootMargin: "-35% 0px -55% 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }
  spy(".toc", ".prose h2[id]");
})();
