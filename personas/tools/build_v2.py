"""Build the Personnel & AR site pages in the Sericulture (megseriloom) DBIM template.

Usage: python3 -I build_v2.py <old_personnel_site> <new_site>
 - converts the old Personnel pages (content inside .bann-right .banner) into the template's
   inner-page layout (banner + breadcrumb, article.page-content .grid, sidebar)
 - adapts the template's own policy pages (terms, help, accessibility...) to Personnel
 - writes sitemap.html
"""
import re
import sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString

sys.path.insert(0, str(Path(__file__).parent))
import cleaning as bp  # shared cleaning rules (file-type labels, tables, images)

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
NW = '<span class="visually-hidden"> (opens in a new window)</span>'
DEPT = "Personnel &amp; Administrative Reforms Department, Government of Meghalaya"
APR = "https://megedistrict.gov.in/directApply.do?serviceId=1287"

SECTIONS = {
    "About Us": [("about-us.html", "About the Department"), ("organisation.html", "Organisation Set Up"),
                 ("who.html", "Who is Who")],
    "Officers": [("ias-list.html", "IAS List"), ("mcs-list.html", "MCS List")],
    "Services": [("ipr.html", "Property Returns (IPR and APR)"), ("ipr-mcs.html", "APR – MCS Officers"),
                 ("ipr-mss.html", "APR – MSS Officers"), ("public-grievance.html", "State Public Grievance Redressal"),
                 ("rti.html", "Right to Information")],
    "Documents": [("rules.html", "Rules, Orders and Circulars"), ("notifications.html", "Notifications"),
                  ("notifications-a.html", "Notifications Archive"), ("forms.html", "Forms"),
                  ("forms-ias.html", "IAS Pension Forms"), ("forms-mcs.html", "MCS Pension Forms"),
                  ("forms-mss.html", "MSS and Steno Pension Forms")],
    "Contact Us": [("contact-us.html", "Contact Details"), ("help.html", "Help"), ("sitemap.html", "Sitemap")],
    "Website Policies": [("terms.html", "Terms of Use"), ("accessibility-statement.html", "Accessibility Statement"),
                         ("accessibility-browsers.html", "Accessibility Options in Browsers"),
                         ("screen_reader.html", "Screen Reader Access"), ("help.html", "Help")],
}
EXTRA = {"rules_old.html": "Documents", "ipr-mcs-2022.html": "Services", "ipr-mss-2022.html": "Services"}
KEY_OFFERINGS = [("rules.html", "Rules, Orders and Circulars"), ("notifications.html", "Notifications"),
                 ("forms.html", "Forms"), ("ipr.html", "Property Returns"),
                 ("public-grievance.html", "Public Grievance Redressal"), ("rti.html", "Right to Information")]

page_section = {}
for s, items in SECTIONS.items():
    for f, _ in items:
        page_section.setdefault(f, s)
page_section.update(EXTRA)
page_label = {f: l for items in SECTIONS.values() for f, l in items}

TEMPLATE_HEAD = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | {dept}</title>
    <meta name="description" content="{desc}">
    <link rel="canonical" href="https://personnel.meghalaya.gov.in/{fname}">
    <link href="../assets/css/boostrap.min.css" rel="stylesheet">
    <link href="../assets/css/style.css" rel="stylesheet">
    <link href="../assets/css/theme.css" rel="stylesheet">
    <link href="../assets/css/footer.css" rel="stylesheet">
    <link href="../assets/css/accessibility-style.css" rel="stylesheet">
    <link href="../assets/css/inner-page.css" rel="stylesheet">
  </head>

  <body>

    <!-- Header -->
    <div id="header" data-include="components/header.html"></div>

    <!-- Banner: page title and breadcrumb -->
    <div class="banner">
      <div class="banner_inner">
        <div class="banner_content">
          <div class="banner_logo">
            <p class="fw-bold fs-4">{title}</p>
          </div>
          <nav aria-label="Breadcrumb">
            <ol class="breadcrumb-trail">
              {crumbs}
            </ol>
          </nav>
        </div>
      </div>
    </div>

    <main id="main-content" tabindex="-1">
      <section class="waw inner-page">
        <div class="custom-container position-relative">
          <div class="waw-inner has-sidebar">
            <article class="waw-left page-content">
              <div class="explore_head">
                <h1><span>{title}</span></h1>
              </div>
              <div class="grid">
{body}
              </div>
            </article>
{aside}
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <div data-include="components/footer.html"></div>

    <script src="assets/js/boostrap.bundle.min.js"></script>
    <script src="assets/js/jquery.min.js"></script>
    <script src="assets/js/components.js"></script>
    <script src="assets/js/menu.js"></script>
    <script src="assets/js/navbar_scroll.js"></script>
    <script src="assets/js/accessibility.js"></script>
    <script src="assets/js/weights.js"></script>
  </body>
</html>
"""


def aside_for(fname):
    section = page_section.get(fname, "Website Policies")
    boxes = [(section, SECTIONS[section])]
    if section not in ("Documents",):
        boxes.append(("Key Offerings", KEY_OFFERINGS))
    out = ['        <aside class="page-sidebar" aria-label="Related pages">']
    for i, (title, items) in enumerate(boxes, 1):
        lis = "\n".join(
            f'              <li><a href="{f}"{" aria-current=\"page\"" if f == fname else ""}>{l}</a></li>'
            for f, l in items)
        out.append(f'''          <nav class="sidebar-box" aria-labelledby="sidebar-{i}">
            <h2 class="sidebar-title" id="sidebar-{i}">{title}</h2>
            <ul>
{lis}
            </ul>
          </nav>''')
    out.append("        </aside>")
    return "\n".join(out)


def crumbs_for(fname, title):
    section = page_section.get(fname, "Website Policies")
    first = SECTIONS[section][0][0]
    c = '<li><a href="index.html">Home</a></li>'
    if first != fname:
        c += f'<li><a href="{first}">{section}</a></li>'
    c += f'<li><span aria-current="page">{title}</span></li>'
    return c


def template_links(content, soup):
    """Match the template: file type inside the link, 'opens in a new window' for screen readers."""
    for a in content.find_all("a", href=True):
        a.attrs.pop("title", None)
        nxt = a.find_next_sibling()
        if nxt is not None and "file-type" in (nxt.get("class") or []):
            between = a.next_sibling
            if isinstance(between, NavigableString) and not between.strip():
                between.extract()
            a.append(" ")
            a.append(nxt.extract())
        if a.get("target") == "_blank":
            a["rel"] = "noopener noreferrer"
            a.append(BeautifulSoup(NW, "html.parser"))
        # old page names -> new
        a["href"] = {"index.html": "index.html", "screen.html": "screen_reader.html"}.get(a["href"], a["href"])
    for ft in content.select(".missing-size"):
        ft["class"] = "file-type"


def build_content_page(fname):
    soup = BeautifulSoup((SRC / fname).read_text(encoding="utf-8"), "html.parser")
    right = soup.select_one(".bann-right")
    content = right.select_one(".banner") or right
    for rm in content.select("#rightmenu"):
        rm.decompose()

    heading = content.find(["h1", "h2"])
    if heading is not None and heading.name == "h2" and fname in page_label:
        heading = None
    title = heading.get_text(" ", strip=True) if heading else page_label.get(fname, fname)
    title = re.sub(r"\s+", " ", title).strip()
    title = {"notifications-a.html": "Notifications Archive",
             "rules_old.html": "Rules, Orders and Circulars (Older)"}.get(fname, title)
    if title.lower().startswith("about the"):
        title = "About the Department"
    if heading is not None:
        heading.decompose()
    for h in content.find_all("h1"):
        h.name = "h2"

    bp.clean(content, soup, fname)
    for tbl in content.find_all("table"):
        tbl["class"] = "table"
    template_links(content, soup)

    body = "".join(str(c) for c in content.contents).strip()
    body = re.sub(r"\n\s*\n+", "\n", body)
    text = BeautifulSoup(body, "html.parser").get_text(" ", strip=True)
    desc = (re.sub(r"\s+", " ", text)[:155].rsplit(" ", 1)[0] + "...") if len(text) > 160 else (text or title)
    desc = desc.replace('"', "&quot;")

    page = TEMPLATE_HEAD.format(title=title, dept=DEPT, desc=desc, fname=fname, crumbs=crumbs_for(fname, title),
                                body=body, aside=aside_for(fname))
    (OUT / fname).write_text(page, encoding="utf-8")
    return title


POLICY_REPLACE = [
    ("Directorate of Sericulture and Weaving, Government of Meghalaya", DEPT),
    ("Directorate of Sericulture and Weaving, Meghalaya", "Personnel &amp; Administrative Reforms Department, Meghalaya"),
    ("Directorate of Sericulture and Weaving", "Personnel &amp; Administrative Reforms Department"),
    ("Department of Sericulture and Weaving", "Personnel &amp; Administrative Reforms Department"),
    ("Sericulture and Weaving Meghalaya", "Personnel and Administrative Reforms Meghalaya"),
    ("Sericulture and Weaving, Government of Meghalaya", DEPT),
    ("Sericulture and Weaving, Shillong, Meghalaya", "Personnel &amp; Administrative Reforms Department, Shillong, Meghalaya"),
    ("megseriloom.gov.in/screen.html", "personnel.meghalaya.gov.in/screen_reader.html"),
    ("megseriloom.gov.in", "personnel.meghalaya.gov.in"),
    ('href="contacts.html"', 'href="contact-us.html"'),
    ('href="screen.html"', 'href="screen_reader.html"'),
    ('href="about_us.html"', 'href="about-us.html"'),
    ("the Directorate", "the Department"), ("The Directorate", "The Department"), ("Directorate's", "Department's"),
]


def adapt_policy_page(fname):
    p = OUT / fname
    s = p.read_text(encoding="utf-8")
    for a, b in POLICY_REPLACE:
        s = s.replace(a, b)
    if "<aside" in s:
        s = re.sub(r"\s*<aside class=\"page-sidebar\".*?</aside>", "\n" + aside_for(fname), s, flags=re.S)
    p.write_text(s, encoding="utf-8")
    left = re.findall(r"[^>]{0,40}(?:Sericulture|Weaving|megseriloom|silk|Silk)[^<]{0,40}", s)
    return left


def build_sitemap():
    groups = [("Home", [("index.html", "Home")])] + [(s, items) for s, items in SECTIONS.items()]
    groups.insert(4, ("Services for You", [(f"personas/{p}.html", n) for p, n in [
        ("employee", "For Government Employees"), ("officer", "For IAS and MCS Officers"),
        ("jobseeker", "For Job Seekers"), ("pensioner", "For Pensioners"), ("citizen", "For Citizens")]]))
    body = ['<p>All pages of this website, grouped as in the main menu.</p>']
    for title, items in groups:
        seen = []
        lis = "".join(f'\n                  <li><a href="{f}">{l}</a></li>' for f, l in items if not (f in seen or seen.append(f)))
        body.append(f'''<div class="sitemap-group">
                <h2>{title}</h2>
                <ul>{lis}
                </ul>
              </div>''')
    body.append(f'''<div class="sitemap-group">
                <h2>External services</h2>
                <ul>
                  <li><a href="{APR}" target="_blank" rel="noopener noreferrer">File Annual Property Return (e-District){NW}</a></li>
                </ul>
              </div>''')
    page = TEMPLATE_HEAD.format(title="Sitemap", dept=DEPT, desc="All pages of the Personnel and Administrative Reforms Department website.",
                                fname="sitemap.html", crumbs=crumbs_for("sitemap.html", "Sitemap"),
                                body="\n              ".join(body), aside=aside_for("sitemap.html"))
    (OUT / "sitemap.html").write_text(page, encoding="utf-8")


# ---------------------------------------------------------------------------
# Searchable archive pages (same system as the Education / Sericulture sites)
# ---------------------------------------------------------------------------
ARCHIVE_HEAD_EXTRA = '    <link href="../assets/css/archive.css" rel="stylesheet">\n  </head>'
ARCHIVE_SCRIPTS = '''    <script src="assets/js/xlsx.full.min.js"></script>
    <script src="assets/js/archive.js"></script>
    <script src="assets/js/menu.js"></script>'''


def noscript_list(sheet_rows):
    lis = []
    for title, link, size in sheet_rows:
        ft = f'(PDF, {size})' if size else '(PDF)'
        lis.append(f'<li><a href="{link}" target="_blank" rel="noopener noreferrer">{title} '
                   f'<span class="file-type">{ft}</span>{NW}</a></li>')
    return "<ol>\n" + "\n".join(lis) + "\n</ol>"


def build_archive_page(fname, title, sheet, intro, rows):
    import html as _h
    data_sheet = f' data-sheet="{sheet}"' if sheet else ""
    body = f'''<p class="archive-intro">{intro}</p>

              <!-- Filled in by assets/js/archive.js from data/whats_new.xlsx – the same file as the homepage
                   What's New. To add or change items, edit the Excel file and upload it again. Keep id="archive".
                   Open a section directly with ?tab=notices (Notifications) or ?tab=tenders (Rules and Orders). -->
              <div id="archive" data-label="{title}"{data_sheet}>
                <p class="archive-status">Loading…</p>
              </div>
              <noscript>
                <p>JavaScript is off, so search and filters are not available. All items are listed below.</p>
                {noscript_list(rows)}
              </noscript>'''
    page = TEMPLATE_HEAD.format(title=title, dept=DEPT, desc=_h.escape(re.sub("<[^>]+>", "", intro)), fname=fname,
                                crumbs=crumbs_for(fname, title), body=body, aside="")
    page = page.replace("  </head>", ARCHIVE_HEAD_EXTRA, 1)
    page = page.replace('<section class="waw inner-page">', '<section class="waw inner-page archive-page" aria-labelledby="archive-heading">')
    page = page.replace('<div class="waw-inner has-sidebar">', '<div class="waw-inner no-sidebar">')
    page = page.replace('<h1><span>', '<h1 id="archive-heading"><span>')
    page = page.replace('<div class="grid">\n', '').replace('\n              </div>\n            </article>', '\n            </article>')
    page = page.replace('    <script src="assets/js/menu.js"></script>', ARCHIVE_SCRIPTS)
    (OUT / fname).write_text(page, encoding="utf-8")


def build_archives():
    import openpyxl
    wb = openpyxl.load_workbook(OUT / "data" / "whats_new.xlsx", read_only=True)
    def rows(sheet):
        return [(r[0], r[1], r[7] or "") for r in wb[sheet].iter_rows(min_row=2, values_only=True) if r[0] and r[1]]
    import html as _h
    esc = lambda rs: [(_h.escape(t, quote=False), _h.escape(l), s) for t, l, s in rs]
    n, r = esc(rows("Notifications")), esc(rows("Rules and Orders"))
    build_archive_page("notifications.html", "Notifications", "Notifications",
        'All notifications of the Department, newest first. Search by keyword, filter by year or change the sort order. '
        'Rules and orders are under the <a href="rules.html">Rules and Orders</a> tab.', n)
    build_archive_page("rules.html", "Rules, Orders and Circulars", "Rules and Orders",
        'Service rules, orders, circulars and reports. Search by keyword or change the sort order. '
        'Notifications are under the <a href="notifications.html">Notifications</a> tab.', r)
    build_archive_page("notifications-a.html", "Notifications Archive", None,
        'Every notification, rule and order on this website, current and older. Choose a section, search by keyword, '
        'filter by year or change the sort order. The latest items are also listed under '
        '<a href="index.html#whats-new-heading">What\'s New</a> on the homepage.', n + r)
    # rules_old.html is now covered by rules.html
    build_archive_page("rules_old.html", "Rules, Orders and Circulars", "Rules and Orders",
        'This page has moved to <a href="rules.html">Rules, Orders and Circulars</a>.', r)
    print("archive pages: notifications.html, rules.html, notifications-a.html, rules_old.html")


if __name__ == "__main__":
    policy = ["terms.html", "help.html", "accessibility-statement.html", "accessibility-browsers.html",
              "screen_reader.html", "404.html", "error.html"]
    for f in sorted(p.name for p in SRC.glob("*.html")):
        if f in ("index.html", "sitemap.html") or f in policy:
            continue
        print(f, "|", build_content_page(f))
    for f in policy:
        left = adapt_policy_page(f)
        print(f, "| policy page", "| CHECK: " + "; ".join(left) if left else "")
    build_sitemap()
    print("sitemap.html | written")
    build_archives()

