"""Extract every notification / rule from the old Personnel pages into data/whats_new.xlsx.

Usage: python3 -I archive_data.py <old_site> <new_site>
Sheets written (replacing their rows): "Notifications", "Rules and Orders".
Columns: Title | Link | Type | New | Show | Date Added | Note | File Size
"""
import re
import sys
from copy import copy
from pathlib import Path
from bs4 import BeautifulSoup
import openpyxl

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
MONTHS = {m: i for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split(), 1)}
SIZE_RE = re.compile(r"([\d.]+)\s*(kb|mb|gb)\b", re.I)
APPROX = "Date approximate – the old site did not show a date. Put the real date."

# Items that were only on the old homepage, with the dates already agreed for What's New
HOMEPAGE_DATES = {
    "notifications/2026/DSC Exam sequence.pdf": ("01-01-2026", APPROX, True),
    "notifications/2026/Revised Syllabus of Qualifying Paper on Local Language.pdf": ("01-01-2026", APPROX, True),
    "notifications/2025/not-17-09-25.pdf": ("17-09-2025", "Date taken from the file name.", False),
    "notifications/2025/not-16-09-25.pdf": ("16-09-2025", "Date taken from the file name.", False),
    "notifications/2025/not200325.pdf": ("20-03-2025", "Date taken from the file name.", False),
    "notifications/2024/PER-38-2021-91dtd1052024.pdf": ("10-05-2024", "Date taken from the file name.", False),
    "notifications/2024/PER(ARC)-91-2023-153.pdf": ("01-01-2024", APPROX, False),
    "notifications/2024/AdhocPensionaryBenefits.pdf": ("01-01-2024", APPROX, False),
    "notifications/2024/AgeRelaxation.pdf": ("01-01-2024", APPROX, False),
    "Rules/driver-sevice-rules-22-10-25.pdf": ("22-10-2025", "Date taken from the file name.", True),
    "Rules/sevice-rules-16-09-25.pdf": ("16-09-2025", "Date taken from the file name.", False),
}


def norm_size(text):
    m = SIZE_RE.search(text or "")
    if not m:
        return ""
    return f"{m.group(1).rstrip('.')} {m.group(2).upper()}"


def released(text):
    m = re.search(r"Date of Releas\w*\s*:?\s*(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})", text)
    if not m:
        return ""
    mon = MONTHS.get(m.group(2).lower()[:3])
    return f"{int(m.group(1)):02d}-{mon:02d}-{m.group(3)}" if mon else ""


def date_from_name(href):
    name = href.rsplit("/", 1)[-1]
    m = re.search(r"(\d{2})-(\d{2})-(\d{2})\.pdf$", name)          # 22-10-25.pdf
    if m:
        return f"{m.group(1)}-{m.group(2)}-20{m.group(3)}"
    m = re.search(r"dtd(\d{1,2})(\d{2})(\d{4})", name)               # dtd1052024
    if m:
        return f"{int(m.group(1)):02d}-{m.group(2)}-{m.group(3)}"
    return ""


TITLE_FIX = {
    "notifications/2026/DSC Exam sequence.pdf": "District Selection Committees (DSCs) examinations – sequence thereof",
    "notifications/2026/Revised Syllabus of Qualifying Paper on Local Language.pdf": "Syllabus of the Qualifying Paper on Local Language in all District Selection Committees (DSCs)",
    "notifications/2025/not-17-09-25.pdf": "Addition of Water Connection for Non-Municipal Areas to the services notified under Section 3(2) of the Meghalaya Right to Public Services Act, 2020",
    "notifications/2025/not-16-09-25.pdf": "Constitution of an Internal Complaints Committee on Sexual Harassment of Women at Workplace",
    "Rules/driver-sevice-rules-22-10-25.pdf": "Meghalaya Directorates and Districts Drivers' Service Rules, 2025",
    "Rules/sevice-rules-16-09-25.pdf": "The Meghalaya Directorate Establishment (Ministerial) Service Rules, 2010",
}


def clean_title(t):
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"\s+([,.;:)])", r"\1", t)          # no space before punctuation
    t = re.sub(r"\(\s+", "(", t)
    t = re.sub(r"[.:]+$", "", t).strip()            # no trailing full stop / colon
    return t


def items_from(fname):
    soup = BeautifulSoup((SRC / fname).read_text(encoding="utf-8"), "html.parser")
    root = soup.select_one(".bann-right") if fname != "index.html" else soup.select_one(".nam-matis")
    out = []
    for li in root.find_all("li"):
        a = li.find("a", href=True)
        if not a:
            continue
        href = a["href"].strip().lstrip("/")
        if not re.search(r"\.(pdf|docx?|xlsx?)$", href, re.I):
            continue
        text = li.get_text(" ", strip=True)
        rest = text.replace(a.get_text(" ", strip=True), " ")
        out.append({
            "title": TITLE_FIX.get(href, clean_title(a.get_text(" ", strip=True))),
            "link": href,
            "date": released(text) or date_from_name(href),
            "size": norm_size(rest),
            "note": "",
        })
    return out


def merge(*lists):
    seen, out = set(), []
    for lst in lists:
        for it in lst:
            key = it["link"].lower()
            twin = (it["title"].lower(), it["date"], it["size"])   # same notice listed twice under different paths
            if key in seen or twin in seen:
                continue
            seen.add(key)
            seen.add(twin)
            out.append(it)
    return out


def finish(items):
    for it in items:
        if it["link"] in HOMEPAGE_DATES:
            d, note, new = HOMEPAGE_DATES[it["link"]]
            it["date"], it["note"], it["new"] = d, note, new
        else:
            it.setdefault("new", False)
            if it["date"] and not it["note"]:
                it["note"] = "Date from the old website." if "Date of Releas" not in it["note"] else it["note"]
            if not it["date"]:
                y = re.search(r"/(20\d{2})/", "/" + it["link"])
                it["note"] = (f"No date on the old site; year {y.group(1)} from the folder name." if y
                              else "No date on the old site – add one so it sorts and filters correctly.")
    def key(it):
        d = it["date"]
        return (int(d[6:]) * 10000 + int(d[3:5]) * 100 + int(d[:2])) if d else 0
    # newest first; undated rows keep their old order at the end of their year group
    return sorted(items, key=key, reverse=True)


home = items_from("index.html")
notes = finish(merge([i for i in home if i["link"].lower().startswith("notifications/")],
                     items_from("notifications.html"), items_from("notifications-a.html")))
rules = finish(merge([i for i in home if i["link"].lower().startswith("rules/")],
                     items_from("rules.html"), items_from("rules_old.html")))

# undated rules: keep the old page order (it was newest first) directly after the dated ones
wb = openpyxl.load_workbook(OUT / "data" / "whats_new.xlsx")


def write(sheet, items):
    ws = wb[sheet]
    style = [copy(c._style) for c in ws[2]]
    ws.delete_rows(2, ws.max_row)
    for r, it in enumerate(items, start=2):
        vals = [it["title"], it["link"], "PDF" if it["link"].lower().endswith(".pdf") else "",
                "Yes" if it["new"] else "No", "Yes", it["date"], it["note"], it["size"]]
        for c, v in enumerate(vals, start=1):
            cell = ws.cell(row=r, column=c, value=v)
            cell._style = copy(style[c - 1])


write("Notifications", notes)
write("Rules and Orders", rules)
wb.save(OUT / "data" / "whats_new.xlsx")

for name, items in (("Notifications", notes), ("Rules and Orders", rules)):
    print(f"{name}: {len(items)} items | with date {sum(1 for i in items if i['date'])} "
          f"| with size {sum(1 for i in items if i['size'])}")
    for it in items[:3]:
        print("   ", it["date"], "|", it["size"], "|", it["title"][:70])
