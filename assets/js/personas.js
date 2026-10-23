/*!
 * Services for You – persona slider (homepage), one persona at a time.
 * Arrows and the persona chips move between slides; each slide links to its
 * persona page (/personas/<name>.html). Slides can also be swiped.
 * Without JavaScript the slides still scroll sideways and every link works.
 */
(function () {
  "use strict";

  function init() {
    var section = document.getElementById("services-for-you");
    if (!section) return;                                   // not the homepage
    var track = section.querySelector(".pc-track");
    var prev = section.querySelector(".pc-prev");
    var next = section.querySelector(".pc-next");
    var count = section.querySelector(".pc-count");
    var chips = Array.prototype.slice.call(section.querySelectorAll(".pc-chip"));
    if (!track || !prev || !next) {
      console.warn("Services for You: slider markup not found (.pc-track / .pc-prev / .pc-next).");
      return;
    }
    var slides = Array.prototype.slice.call(track.querySelectorAll(".pc-slide"));
    if (!slides.length) { console.warn("Services for You: no .pc-slide items found."); return; }
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Which slide is in view: the one whose left edge is nearest the track's scroll position
    function current() {
      var x = track.scrollLeft, best = 0, dist = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.offsetLeft - track.offsetLeft - x);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var left = slides[i].offsetLeft - track.offsetLeft;
      if (typeof track.scrollTo === "function") {
        track.scrollTo({ left: left, behavior: reduce ? "auto" : "smooth" });
      } else {
        track.scrollLeft = left;                            // very old browsers
      }
      window.setTimeout(update, reduce ? 0 : 450);          // in case no scroll event fires
    }

    function update() {
      var i = current();
      prev.disabled = i <= 0;
      next.disabled = i >= slides.length - 1;
      if (count) count.textContent = (i + 1) + " / " + slides.length;
      slides.forEach(function (s, n) {
        var on = n === i;
        s.setAttribute("aria-hidden", on ? "false" : "true");
        Array.prototype.forEach.call(s.querySelectorAll("a"), function (a) {
          if (on) a.removeAttribute("tabindex"); else a.setAttribute("tabindex", "-1");   // hidden slides out of Tab order
        });
      });
      chips.forEach(function (c, n) {
        if (n === i) c.setAttribute("aria-current", "true"); else c.removeAttribute("aria-current");
      });
    }

    prev.addEventListener("click", function (e) { e.preventDefault(); go(current() - 1); });
    next.addEventListener("click", function (e) { e.preventDefault(); go(current() + 1); });
    chips.forEach(function (c) {
      c.addEventListener("click", function (e) { e.preventDefault(); go(parseInt(c.getAttribute("data-slide"), 10) || 0); });
    });

    var t;
    track.addEventListener("scroll", function () { clearTimeout(t); t = setTimeout(update, 80); }, { passive: true });
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(function () { go(current()); }, 150); });

    section.classList.add("pc-js");
    update();
  }

  // Works whether this file is loaded in <head>, before the slider, or at the end of <body>
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
