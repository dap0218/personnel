/*!
 * What's New (Personnel & AR Department homepage)
 *
 * Reads data/whats_new.xlsx and shows the 5 LATEST items in the What's New list.
 *  - Every sheet named on the 'Settings' sheet is read (e.g. Notices, Tenders and Quotations)
 *    and the rows are merged into ONE list.
 *  - Rows with Show = No are left out (they stay in the Excel file for the archive page).
 *  - Newest first, by the 'Date Added' column (dd-mm-yyyy). A row without a date takes the
 *    date of the row above it in the same sheet (sheets are kept oldest-first), so always
 *    add new items in the first empty row at the BOTTOM of their sheet.
 *
 * Needs SheetJS loaded first:  <script src="assets/js/xlsx.full.min.js"></script>
 * The items already written in #whatsNewList stay on the page if the Excel file cannot be
 * read (or JavaScript is off), so the section is never empty.
 *
 * To change the content: edit whats_new.xlsx and upload it to the data/ folder.
 */
(function () {
  "use strict";

  var EXCEL_URL = "data/whats_new.xlsx";            // path of the Excel file
  var MAX_ITEMS = 5;                                // how many items the homepage shows
  var ICON = "../assets/icons/chevron_right.svg";   // chevron before each item
  var TYPES = { "pdf": "PDF", "excel": "Excel", "word": "Word", "dwg": "DWG", "web page": "Web page", "external link": "External link" };

  function str(v) { return v == null ? "" : String(v).trim(); }

  function isYes(v, dflt) {
    v = str(v).toLowerCase();
    if (!v) return dflt;
    return v === "yes" || v === "y" || v === "true" || v === "1";
  }

  // "26-02-2025" / "26/02/2025" / "2025-02-26" -> sortable number (yyyymmdd); anything else -> null
  function dateNum(v) {
    v = str(v);
    var m = v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
    if (m) return +m[3] * 10000 + +m[2] * 100 + +m[1];
    m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return +m[1] * 10000 + +m[2] * 100 + +m[3];
    return null;
  }

  // Readable path ("/documents/My Notice.pdf") -> safe URL; already-encoded links are left alone.
  function encodeLink(link) {
    if (/^https?:\/\//i.test(link)) return link;
    var decoded;
    try { decoded = decodeURIComponent(link); } catch (e) { decoded = link; }
    return encodeURI(decoded).replace(/'/g, "%27").replace(/#/g, "%23");
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

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === true) n.setAttribute(k, "");
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return n;
  }

  // Same markup as the items written in index.html:
  // li.wn-item > a > img.wn-icon + span.wn-text (title, New badge, file type)
  function itemLi(it) {
    var info = it.size ? it.type + ", " + it.size : it.type;
    var attrs = { href: encodeLink(it.link) };
    var kids = [it.title];
    if (it.isNew) kids.push(" ", el("span", { "class": "badge-new" }, ["New"]));

    if (it.type === "Excel" || it.type === "Word" || it.type === "DWG") {   // files that download
      attrs.download = true;
      kids.push(" ", el("span", { "class": "file-type" }, ["(" + info + ")"]));
    } else if (it.type === "PDF") {
      attrs.target = "_blank"; attrs.rel = "noopener noreferrer";
      kids.push(" ", el("span", { "class": "file-type" }, ["(" + info + ")"]),
                el("span", { "class": "visually-hidden" }, [" (opens in a new window)"]));
    } else if (it.type === "External link") {
      attrs.target = "_blank"; attrs.rel = "noopener noreferrer";
      kids.push(el("span", { "class": "visually-hidden" }, [" (opens in a new window)"]));
    }
    var icon = el("img", { src: ICON, "class": "wn-icon", alt: "", "aria-hidden": "true", width: "16", height: "16" });
    return el("li", { "class": "wn-item" }, [el("a", attrs, [icon, el("span", { "class": "wn-text" }, kids)])]);
  }

  function rows(wb, name) {
    var ws = wb.Sheets[name];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false }).slice(1);
  }

  // Sheets to read = column A of the Settings sheet
  function sheetNames(wb) {
    if (!wb.Sheets["Settings"]) throw new Error("No 'Settings' sheet in the workbook");
    var names = [];
    rows(wb, "Settings").forEach(function (r) {
      var s = str(r[0]);
      if (s && wb.Sheets[s]) names.push(s);
    });
    if (!names.length) throw new Error("No sheets listed on the Settings sheet");
    return names;
  }

  // Columns: Title | Link | Type | New | Show | Date Added | Note | File Size
  function readItems(wb) {
    var all = [];
    sheetNames(wb).forEach(function (sheet, sheetIndex) {
      var list = [];
      rows(wb, sheet).forEach(function (r) {
        var title = str(r[0]), link = str(r[1]);
        if (!title || !link) return;
        list.push({
          title: title, link: link,
          type: TYPES[str(r[2]).toLowerCase()] || guessType(link),
          isNew: isYes(r[3], false),
          show: isYes(r[4], true),
          date: dateNum(r[5]),
          size: str(r[7])
        });
      });
      // undated row -> date of the nearest dated row above it (else below it)
      var last = null;
      list.forEach(function (it) { if (it.date == null) it.date = last; else last = it.date; });
      last = null;
      for (var i = list.length - 1; i >= 0; i--) { if (list[i].date == null) list[i].date = last; else last = list[i].date; }
      // row position: the LAST row of a sheet is the newest
      list.forEach(function (it, i) { it.sheet = sheetIndex; it.row = i; all.push(it); });
    });
    return all
      .filter(function (it) { return it.show; })
      .sort(function (a, b) {
        return ((b.date || 0) - (a.date || 0))       // newest date first
          || (a.sheet - b.sheet)                      // same date: Settings order of the sheets
          || (b.row - a.row);                         // same sheet: lower row = newer
      })
      .slice(0, MAX_ITEMS);
  }

  function load() {
    var list = document.getElementById("whatsNewList");
    if (!list) return;
    if (typeof XLSX === "undefined") { console.warn("What's New: SheetJS (xlsx.full.min.js) is not loaded."); return; }
    if (location.protocol === "file:") { console.warn("What's New: open the page through a web server to read " + EXCEL_URL); return; }

    fetch(EXCEL_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status + " for " + EXCEL_URL);
        return res.arrayBuffer();
      })
      .then(function (buf) {
        var items = readItems(XLSX.read(buf, { type: "array" }));
        if (!items.length) return;                     // keep the written items
        list.replaceChildren.apply(list, items.map(itemLi));
      })
      .catch(function (err) {
        console.warn("What's New: could not load " + EXCEL_URL + " – " + (err && err.message ? err.message : err));
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();

  window.WhatsNew = { readItems: readItems, itemLi: itemLi };   // exposed for testing
})();
