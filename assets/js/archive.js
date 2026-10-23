/*!
 * Archive page – ONE page for every tab of the What's New section.
 * Personnel & Administrative Reforms Department, Meghalaya.
 * Reads ALL items (current and archived) from data/whats_new.xlsx and shows them as a
 * tabbed, searchable, sortable, paginated table.
 *
 *   Tabs:    "All" + one tab per row of the workbook's Settings sheet
 *            (tab label and Tab ID come from there, in the same order).
 *   Search:  works across every tab; each tab shows how many items match, and if the open
 *            tab has nothing, the page offers the tab that does.
 *   Order:   a sheet's row order is newest → oldest (new items go at the top). On the
 *            "All" tab items are ordered by year, then by their position in the sheet.
 *
 * Page markup (one page for everything):
 *     <div id="archive"></div>
 * Link straight to a tab with ?tab=<Tab ID>, e.g. notifications-a.html?tab=notices
 *
 * The old one-sheet pages keep working – the sheet becomes the tab that opens first:
 *     <div id="archive" data-sheet="Tenders and EOIs"></div>
 * Add data-tabs="off" to show that one sheet only, with no tabs.
 *
 * Needs SheetJS first:  <script src="assets/js/xlsx.full.min.js"></script>
 *
 * Accessibility (GIGW / DBIM / WCAG 2.1 AA): ARIA tabs with arrow-key navigation, labelled
 * search and filters, results count announced to screen readers, real table with caption and
 * column headers, pagination inside a labelled <nav> with aria-current, keyboard operable,
 * focus moved to results after changing page, state kept in the URL so results can be
 * bookmarked or shared.
 */
(function () {
  "use strict";

  var EXCEL_URL = "data/whats_new.xlsx";        // same file as the homepage What's New
  var PER_PAGE_OPTIONS = [10, 25, 50, 100];
  var DEFAULT_PER_PAGE = 10;
  var ALL = "all";
  var NON_CONTENT_SHEETS = ["how to use", "settings"];

  /* ---------- helpers ---------- */
  function str(v) { return v == null ? "" : String(v).trim(); }
  function encodeLink(link) {
    if (/^https?:\/\//i.test(link)) return link;
    var d; try { d = decodeURIComponent(link); } catch (e) { d = link; }
    return encodeURI(d).replace(/'/g, "%27").replace(/&/g, "%26").replace(/#/g, "%23");
  }
  function guessType(link) {
    var l = link.toLowerCase().split("?")[0];
    if (/\.pdf$/.test(l)) return "PDF";
    if (/\.xlsx?$/.test(l)) return "Excel";
    if (/\.docx?$/.test(l)) return "Word";
    if (/\.dwg$/.test(l)) return "DWG";
    if (/^https?:\/\//.test(l)) return "External link";
    return "Web page";
  }
  var TYPES = { "pdf": "PDF", "excel": "Excel", "word": "Word", "dwg": "DWG", "web page": "Web page", "external link": "External link" };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === true) n.setAttribute(k, "");
      else if (v != null && v !== false) n.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }
  // Lower-case, strip accents, collapse spaces – used for searching.
  function fold(s) {
    s = s.toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/\s+/g, " ");
  }
  // "26-02-2025" / "26/02/2025" / "2025-02-26" -> 20250226 (0 if not a date)
  function dateNum(v) {
    var m = v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
    if (m) return +m[3] * 10000 + +m[2] * 100 + +m[1];
    m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : 0;
  }
  function slug(s) { return fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // Title text with the searched words wrapped in <mark>.
  function highlight(text, words) {
    if (!words.length) return [text];
    var re = new RegExp("(" + words.map(escRe).join("|") + ")", "ig");
    var out = [];
    text.split(re).forEach(function (part, i) {
      if (!part) return;
      out.push(i % 2 ? el("mark", null, [part]) : part);
    });
    return out;
  }

  /* ---------- data ---------- */
  // Tabs come from the Settings sheet: Sheet | Tab label | Tab ID | 'More' text | 'More' URL
  function readTabs(wb) {
    var tabs = [], settings = wb.Sheets["Settings"];
    if (settings) {
      XLSX.utils.sheet_to_json(settings, { header: 1, defval: "", raw: false }).slice(1).forEach(function (r) {
        var sheet = str(r[0]);
        if (sheet && wb.Sheets[sheet]) tabs.push({ sheet: sheet, label: str(r[1]) || sheet, id: str(r[2]) || slug(sheet) });
      });
    }
    if (!tabs.length) {                            // no Settings sheet: use every content sheet
      wb.SheetNames.forEach(function (name) {
        if (NON_CONTENT_SHEETS.indexOf(name.toLowerCase()) < 0) tabs.push({ sheet: name, label: name, id: slug(name) });
      });
    }
    return tabs;
  }

  function readSheet(wb, sheet, tab) {
    var ws = wb.Sheets[sheet];
    if (!ws) throw new Error("No sheet named '" + sheet + "' in the workbook");
    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }).slice(1);
    var items = [];
    rows.forEach(function (r) {
      var title = str(r[0]), link = str(r[1]);
      if (!title || !link) return;
      var date = str(r[5]);
      var m = date.match(/(19|20)\d\d/) || link.match(/\/((?:19|20)\d\d)\//);
      var year = m ? (m[1] && m[1].length === 4 ? m[1] : m[0]) : "";
      items.push({
        title: title,
        link: link,
        type: TYPES[str(r[2]).toLowerCase()] || guessType(link),
        date: date,
        year: year,
        size: str(r[7]),
        dateNum: dateNum(date),                   // yyyymmdd for sorting, 0 if no date
        order: items.length,                      // sheet position: 0 = newest
        tab: tab ? tab.id : "",
        tabLabel: tab ? tab.label : sheet,
        tabIndex: tab ? tab.index : 0,
        search: fold(title + " " + date + " " + year)
      });
    });
    // A row without a Date Added sorts with the dated row above it (sheets are newest first),
    // as on the homepage. The Date column still shows "–" for it.
    var lastNum = 0, lastYear = "";
    items.forEach(function (it) {
      if (it.dateNum) { lastNum = it.dateNum; lastYear = it.year; }
      else if (lastNum) { it.dateNum = lastNum; if (!it.year) it.year = lastYear; }
    });
    return items;
  }

  // Kept for pages/scripts that used the old one-sheet API.
  function readArchive(wb, sheet) { return readSheet(wb, sheet, null); }

  /* ---------- URL state ---------- */
  function readState(defaultTab) {
    var p = new URLSearchParams(location.search);
    var per = parseInt(p.get("per"), 10);
    return {
      tab: p.get("tab") || defaultTab,
      q: p.get("q") || "",
      year: p.get("year") || "",
      page: Math.max(1, parseInt(p.get("page"), 10) || 1),
      sort: p.get("sort") === "oldest" ? "oldest" : "newest",
      per: PER_PAGE_OPTIONS.indexOf(per) >= 0 ? per : DEFAULT_PER_PAGE
    };
  }
  function writeState(s, defaultTab) {
    if (!window.history || !history.replaceState) return;
    var p = new URLSearchParams();
    if (s.tab !== defaultTab) p.set("tab", s.tab);
    if (s.q) p.set("q", s.q);
    if (s.year) p.set("year", s.year);
    if (s.page > 1) p.set("page", s.page);
    if (s.per !== DEFAULT_PER_PAGE) p.set("per", s.per);
    if (s.sort === "oldest") p.set("sort", "oldest");
    var qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  /* ---------- UI ---------- */
  // tabs: [{id,label,sheet}] – an empty list means "no tab strip, one sheet only".
  function build(root, items, label, tabs, defaultTab) {
    tabs = tabs || [];
    var showTabs = tabs.length > 0;
    var allTabs = showTabs ? [{ id: ALL, label: "All" }].concat(tabs) : [];
    defaultTab = defaultTab || (showTabs ? ALL : "");
    var state = readState(defaultTab);
    if (showTabs && !allTabs.some(function (t) { return t.id === state.tab; })) state.tab = defaultTab;
    var uid = "archive-" + Math.random().toString(36).slice(2, 7);

    var years = items.map(function (i) { return i.year; })
      .filter(function (y, i, a) { return y && a.indexOf(y) === i; })
      .sort().reverse();

    // Controls
    var q = el("input", { type: "search", id: uid + "-q", "class": "form-control", autocomplete: "off",
      placeholder: "Type a word, e.g. quotation", "aria-describedby": uid + "-status" });
    q.value = state.q;

    var yearSel = el("select", { id: uid + "-year", "class": "form-select" },
      [el("option", { value: "" }, ["All years"])].concat(years.map(function (y) {
        return el("option", { value: y }, [y]);
      })));
    yearSel.value = years.indexOf(state.year) >= 0 ? state.year : "";

    var perSel = el("select", { id: uid + "-per", "class": "form-select" },
      PER_PAGE_OPTIONS.map(function (n) { return el("option", { value: String(n) }, [String(n)]); }));
    perSel.value = String(state.per);

    var sortSel = el("select", { id: uid + "-sort", "class": "form-select" }, [
      el("option", { value: "newest" }, ["Newest first"]),
      el("option", { value: "oldest" }, ["Oldest first"])
    ]);
    sortSel.value = state.sort;

    var reset = el("button", { type: "reset", "class": "btn btn-outline-secondary" }, ["Clear"]);

    var form = el("form", { "class": "archive-controls row g-3 align-items-end mb-3", role: "search",
      "aria-label": label + " archive" }, [
      el("div", { "class": "col-lg-4 col-md-12" }, [
        el("label", { "for": q.id, "class": "form-label" }, [showTabs ? "Search all sections" : "Search"]), q ]),
      el("div", { "class": "col-6 col-lg-2" }, [
        el("label", { "for": yearSel.id, "class": "form-label" }, ["Year"]), yearSel ]),
      el("div", { "class": "col-6 col-lg-2" }, [
        el("label", { "for": sortSel.id, "class": "form-label" }, ["Sort"]), sortSel ]),
      el("div", { "class": "col-6 col-lg-2" }, [
        el("label", { "for": perSel.id, "class": "form-label" }, ["Items per page"]), perSel ]),
      el("div", { "class": "col-6 col-lg-2" }, [
        el("span", { "class": "form-label", "aria-hidden": "true" }, [" "]), reset ])
    ]);

    // Tab strip (Bootstrap nav-tabs styling, ARIA tabs behaviour)
    var tabButtons = {}, tabCounts = {};
    var tablist = null;
    if (showTabs) {
      tablist = el("div", { "class": "nav nav-tabs archive-tabs mb-3", role: "tablist", "aria-label": "Archive sections" });
      allTabs.forEach(function (t) {
        var count = el("span", { "class": "badge rounded-pill archive-count ms-1" });
        var b = el("button", { type: "button", role: "tab", id: uid + "-tab-" + t.id, "class": "nav-link",
          "aria-controls": uid + "-panel", "data-tab": t.id }, [t.label, " ", count]);
        b.addEventListener("click", function () { selectTab(t.id, false); });
        tabButtons[t.id] = b; tabCounts[t.id] = count;
        tablist.appendChild(b);
      });
      tablist.addEventListener("keydown", function (e) {
        var ids = allTabs.map(function (t) { return t.id; });
        var i = ids.indexOf(state.tab), n = ids.length, next = null;
        if (e.key === "ArrowRight") next = ids[(i + 1) % n];
        else if (e.key === "ArrowLeft") next = ids[(i - 1 + n) % n];
        else if (e.key === "Home") next = ids[0];
        else if (e.key === "End") next = ids[n - 1];
        if (next) { e.preventDefault(); selectTab(next, true); }
      });
    }

    var status = el("p", { id: uid + "-status", "class": "archive-status", role: "status", "aria-live": "polite", tabindex: "-1" });
    var suggestion = el("p", { "class": "archive-suggest" });

    var caption = el("caption", { "class": "visually-hidden" });
    var headRow = el("tr");
    var tbody = el("tbody");
    var table = el("table", { "class": "table table-bordered table-striped archive-table" }, [
      caption, el("thead", null, [headRow]), tbody
    ]);

    var pager = el("nav", { "aria-label": "Archive pages", "class": "archive-pager" });

    var panel = el("div", showTabs ? { id: uid + "-panel", role: "tabpanel" } : null,
      [status, suggestion, el("div", { "class": "table-responsive" }, [table]), pager]);

    root.replaceChildren.apply(root, [form, tablist, panel].filter(Boolean));

    var filtered = [], base = [];

    function tabLabel(id) {
      for (var i = 0; i < allTabs.length; i++) if (allTabs[i].id === id) return allTabs[i].label;
      return label;
    }
    function onAll() { return showTabs && state.tab === ALL; }

    function selectTab(id, focus) {
      state.tab = id; state.page = 1;
      apply(false);
      if (focus) tabButtons[id].focus();
    }

    function apply(resetPage) {
      state.q = q.value.trim();
      state.year = yearSel.value;
      state.per = parseInt(perSel.value, 10) || DEFAULT_PER_PAGE;
      state.sort = sortSel.value;
      if (resetPage) state.page = 1;

      var words = fold(state.q).split(" ").filter(Boolean);
      // 1. search + year, across every tab
      base = items.filter(function (it) {
        if (state.year && it.year !== state.year) return false;
        for (var i = 0; i < words.length; i++) if (it.search.indexOf(words[i]) < 0) return false;
        return true;
      });
      // 2. the open tab
      filtered = showTabs && state.tab !== ALL
        ? base.filter(function (it) { return it.tab === state.tab; })
        : base.slice();

      var dir = state.sort === "oldest" ? -1 : 1;
      filtered.sort(function (a, b) {
        if (onAll()) {
          if (a.dateNum && b.dateNum && a.dateNum !== b.dateNum) return dir * (b.dateNum - a.dateNum);
          var ya = a.year || "0000", yb = b.year || "0000";
          if (ya !== yb) return dir * (ya < yb ? 1 : -1);
          if (a.tabIndex !== b.tabIndex) return a.tabIndex - b.tabIndex;
        }
        return dir * (a.order - b.order);
      });

      var pages = Math.max(1, Math.ceil(filtered.length / state.per));
      if (state.page > pages) state.page = pages;
      drawTabs();
      draw(pages, words);
      writeState(state, defaultTab);
    }

    function drawTabs() {
      if (!showTabs) return;
      var counts = {}; counts[ALL] = base.length;
      base.forEach(function (it) { counts[it.tab] = (counts[it.tab] || 0) + 1; });
      allTabs.forEach(function (t) {
        var b = tabButtons[t.id], on = t.id === state.tab, n = counts[t.id] || 0;
        b.className = "nav-link" + (on ? " active" : "") + (n ? "" : " archive-empty");
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.setAttribute("tabindex", on ? "0" : "-1");
        tabCounts[t.id].textContent = String(n);
        tabCounts[t.id].className = "badge rounded-pill archive-count ms-1 " + (on ? "bg-light text-dark" : "bg-secondary");
        b.setAttribute("aria-label", t.label + ", " + n + " item" + (n === 1 ? "" : "s"));
      });
      panel.setAttribute("aria-labelledby", tabButtons[state.tab].id);
    }

    function draw(pages, words) {
      var start = (state.page - 1) * state.per;
      var slice = filtered.slice(start, start + state.per);
      var withCategory = onAll();
      var cols = withCategory ? 4 : 3;
      var section = showTabs ? tabLabel(state.tab) : label;

      // Header + caption
      caption.textContent = (showTabs ? (state.tab === ALL ? "All sections" : section) : label) + " archive";
      headRow.replaceChildren.apply(headRow, [
        el("th", { scope: "col", "class": "archive-sno" }, ["S. No."]),
        el("th", { scope: "col" }, ["Title"]),
        withCategory ? el("th", { scope: "col", "class": "archive-section" }, ["Section"]) : null,
        el("th", { scope: "col", "class": "archive-date" }, ["Date"])
      ].filter(Boolean));

      // Rows
      var rows = slice.map(function (it, i) {
        var a = el("a", { href: encodeLink(it.link) }, highlight(it.title, words));
        var info = it.size ? it.type + ", " + it.size : it.type;
        if (it.type === "PDF" || it.type === "External link") {
          a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener noreferrer");
        } else if (it.type === "Excel" || it.type === "Word" || it.type === "DWG") {
          a.setAttribute("download", "");
        }
        if (it.type !== "Web page" && it.type !== "External link") {
          a.appendChild(document.createTextNode(" "));
          a.appendChild(el("span", { "class": "file-type" }, ["(" + info + ")"]));
        }
        if (a.getAttribute("target")) a.appendChild(el("span", { "class": "visually-hidden" }, [" (opens in a new window)"]));
        var sectionCell = null;
        if (withCategory) {
          var go = el("button", { type: "button", "class": "btn btn-link p-0 archive-section-link",
            "aria-label": "Show only " + it.tabLabel }, [it.tabLabel]);
          go.addEventListener("click", function () { selectTab(it.tab, true); });
          sectionCell = el("td", { "class": "archive-section" }, [go]);
        }
        return el("tr", null, [
          el("td", { "class": "archive-sno" }, [String(start + i + 1)]),
          el("td", null, [a]),
          sectionCell,
          el("td", { "class": "archive-date" }, [it.date || "–"])
        ].filter(Boolean));
      });
      if (!rows.length) {
        rows = [el("tr", null, [el("td", { colspan: String(cols), "class": "text-center" }, [
          items.length ? "No items match your search." : "No items at present."
        ])])];
      }
      tbody.replaceChildren.apply(tbody, rows);

      // Status line
      var total = filtered.length;
      var where = showTabs ? (state.tab === ALL ? " across all sections" : " in " + section) : "";
      status.textContent = total
        ? "Showing " + (start + 1) + "–" + (start + slice.length) + " of " + total + " item" + (total === 1 ? "" : "s") +
          where + (state.q || state.year ? " (filtered)" : "") + "."
        : (items.length ? "No items found" + where + "." : "");

      // Nothing here but matches elsewhere: offer the tab that has them
      suggestion.replaceChildren();
      if (!total && showTabs && state.tab !== ALL && base.length) {
        var others = {};
        base.forEach(function (it) { others[it.tab] = (others[it.tab] || 0) + 1; });
        suggestion.appendChild(document.createTextNode("Found in: "));
        Object.keys(others).forEach(function (id, i) {
          if (i) suggestion.appendChild(document.createTextNode(" · "));
          var b = el("button", { type: "button", "class": "btn btn-link p-0 align-baseline" },
            [tabLabel(id) + " (" + others[id] + ")"]);
          b.addEventListener("click", function () { selectTab(id, true); });
          suggestion.appendChild(b);
        });
      }

      // Pagination
      pager.replaceChildren();
      if (pages <= 1) return;
      var ul = el("ul", { "class": "pagination flex-wrap justify-content-center" });
      function pageItem(text, page, opts) {
        opts = opts || {};
        var li = el("li", { "class": "page-item" + (opts.active ? " active" : "") + (opts.disabled ? " disabled" : "") });
        if (opts.ellipsis) {
          li.appendChild(el("span", { "class": "page-link", "aria-hidden": "true" }, ["…"]));
        } else {
          var b = el("button", { type: "button", "class": "page-link",
            "aria-label": opts.label || ("Page " + page),
            "aria-current": opts.active ? "page" : null,
            disabled: opts.disabled ? true : null }, [text]);
          b.addEventListener("click", function () {
            state.page = page; draw(pages, words); writeState(state, defaultTab);
            status.focus();                       // tell screen-reader users the results changed
          });
          li.appendChild(b);
        }
        return li;
      }
      ul.appendChild(pageItem("« Previous", state.page - 1, { label: "Previous page", disabled: state.page === 1 }));
      windowed(state.page, pages).forEach(function (p) {
        ul.appendChild(p === "…" ? pageItem("", 0, { ellipsis: true })
                                  : pageItem(String(p), p, { active: p === state.page }));
      });
      ul.appendChild(pageItem("Next »", state.page + 1, { label: "Next page", disabled: state.page === pages }));
      pager.appendChild(ul);
    }

    // 1 … 4 5 [6] 7 8 … 20
    function windowed(cur, total) {
      var out = [], from = Math.max(2, cur - 2), to = Math.min(total - 1, cur + 2);
      out.push(1);
      if (from > 2) out.push("…");
      for (var p = from; p <= to; p++) out.push(p);
      if (to < total - 1) out.push("…");
      if (total > 1) out.push(total);
      return out;
    }

    var timer;
    q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { apply(true); }, 250); });
    yearSel.addEventListener("change", function () { apply(true); });
    perSel.addEventListener("change", function () { apply(true); });
    sortSel.addEventListener("change", function () { apply(true); });
    form.addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(timer); apply(true); status.focus(); });
    form.addEventListener("reset", function () { setTimeout(function () { perSel.value = String(DEFAULT_PER_PAGE); sortSel.value = "newest"; apply(true); q.focus(); }, 0); });

    apply(false);
  }

  function showError(root, reason) {
    console.warn("Archive: " + reason);
    var msg = ["The archive could not be loaded. Please try again later."];
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      msg.push(el("br"), el("small", null, ["Developer note (only shown on localhost): " + reason]));
    }
    root.replaceChildren(el("p", { "class": "archive-status" }, msg));
  }

  // Turns a workbook into the page. Exposed so it can be tested or reused.
  function render(root, wb) {
    var sheet = root.getAttribute("data-sheet");
    var tabsOff = /^(off|false|no|0)$/i.test(root.getAttribute("data-tabs") || "");
    var tabs = readTabs(wb);
    tabs.forEach(function (t, i) { t.index = i; });

    if (sheet && tabsOff) {                         // old behaviour: one sheet, no tabs
      var only = tabs.filter(function (t) { return t.sheet === sheet; })[0] || { sheet: sheet, label: sheet, id: slug(sheet), index: 0 };
      return build(root, readSheet(wb, sheet, only), root.getAttribute("data-label") || only.label, [], "");
    }
    var items = [];
    tabs.forEach(function (t) { items = items.concat(readSheet(wb, t.sheet, t)); });
    var start = sheet ? (tabs.filter(function (t) { return t.sheet === sheet; })[0] || {}).id : ALL;
    build(root, items, root.getAttribute("data-label") || "What's New", tabs, start || ALL);
  }

  function load() {
    var root = document.getElementById("archive");
    if (!root) return;
    if (location.protocol === "file:") return showError(root, "the page was opened as a file – open it through a web server instead.");
    if (typeof XLSX === "undefined") return showError(root, "SheetJS (xlsx.full.min.js) is not loaded – check its <script> path.");
    fetch(EXCEL_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " for " + EXCEL_URL);
        return res.arrayBuffer();
      })
      .then(function (buf) { render(root, XLSX.read(buf, { type: "array" })); })
      .catch(function (err) { showError(root, "could not load " + EXCEL_URL + " – " + (err && err.message ? err.message : err)); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();

  window.WhatsNewArchive = { build: build, render: render, readArchive: readArchive, readTabs: readTabs };
})();
