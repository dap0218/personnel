"""Shared cleaning rules for old Personnel pages."""
import re
from bs4 import NavigableString, Comment

SIZE_RE = re.compile(r"\(?\s*([\d.]+)\s*(kb|mb|gb|k|m)\b\s*\)?", re.I)


def norm_size(text):
    m = SIZE_RE.search(text or "")
    if not m:
        return None
    unit = {"k": "KB", "kb": "KB", "m": "MB", "mb": "MB", "gb": "GB"}[m.group(2).lower()]
    return f"{m.group(1)} {unit}"


def file_type(href):
    ext = href.lower().rsplit(".", 1)[-1] if "." in href.rsplit("/", 1)[-1] else ""
    return {"pdf": "PDF", "doc": "DOC", "docx": "DOCX", "xls": "XLS", "xlsx": "XLSX", "jpg": "JPG", "png": "PNG"}.get(ext)


def clean(content, soup, fname):
    # comments, scripts, old styling
    for c in content.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for t in content.find_all(["script", "style"]):
        t.decompose()
    for t in content.find_all(["font", "center", "strong"] if False else ["font", "center"]):
        t.unwrap()
    for t in content.find_all(True):
        for a in ("style", "align", "bgcolor", "border", "cellpadding", "cellspacing", "valign", "color", "face"):
            t.attrs.pop(a, None)
        if t.name in ("table", "td", "th", "tr", "col"):
            t.attrs.pop("width", None)
            t.attrs.pop("height", None)
        if t.name != "img":
            t.attrs.pop("class", None)

    # PDF icon + size  ->  "(PDF, 3 MB)" after the link
    for icon in content.find_all("img", src=re.compile(r"pdficon|download", re.I)):
        size = None
        sib = icon.next_sibling
        while sib is not None and size is None:
            nxt = sib.next_sibling
            txt = sib.get_text() if hasattr(sib, "get_text") else str(sib)
            s = norm_size(txt)
            if s:
                size = s
                if isinstance(sib, NavigableString):
                    sib.replace_with(NavigableString(SIZE_RE.sub("", str(sib), count=1)))
                else:
                    sib.decompose()
            elif txt.strip():
                break
            sib = nxt
        link = icon.find_previous("a")
        label = soup.new_tag("span", attrs={"class": "file-type"})
        ftype = file_type(link["href"]) if link and link.get("href") else "PDF"
        label.string = f"({ftype or 'PDF'}{', ' + size if size else ''})"
        icon.replace_with(label)

    # sizes written without an icon, e.g.  <a ...pdf>Title</a> (3 Mb)
    for a in content.find_all("a", href=True):
        ft = file_type(a["href"])
        if not ft or ft in ("JPG", "PNG"):
            continue
        nxt = a.find_next_sibling()
        if nxt is not None and "file-type" in (nxt.get("class") or []):
            continue
        sib = a.next_sibling
        if isinstance(sib, NavigableString) and norm_size(str(sib)):
            size = norm_size(str(sib))
            sib.replace_with(NavigableString(SIZE_RE.sub("", str(sib), count=1)))
            label = soup.new_tag("span", attrs={"class": "file-type"})
            label.string = f"({ft}, {size})"
            a.insert_after(label)
            a.insert_after(" ")

    # any remaining document link without a label still gets its type (size unknown in the source)
    for a in content.find_all("a", href=True):
        ft = file_type(a["href"])
        if not ft or ft in ("JPG", "PNG") or a.find(class_="file-type"):
            continue
        nxt = a.find_next_sibling()
        if nxt is not None and "file-type" in (nxt.get("class") or []):
            continue
        label = soup.new_tag("span", attrs={"class": "file-type missing-size"})
        label.string = f"({ft})"
        a.insert_after(label)
        a.insert_after(" ")

    # links: new-window behaviour stated, safe rel
    for a in content.find_all("a", href=True):
        href = a["href"].strip()
        a["href"] = href
        external = href.startswith("http") and "personnel.meghalaya.gov.in" not in href
        if a.get("target") == "_blank" or external:
            if href.endswith(".html") and not external:
                a.attrs.pop("target", None)       # internal pages open in the same window
                a.attrs.pop("title", None)
                continue
            a["target"] = "_blank"
            a["rel"] = "noopener"
            a["title"] = ("External website that opens in a new window" if external
                          else "Opens in a new window")

    # images: responsive, keep alt
    for img in content.find_all("img"):
        img.attrs.pop("width", None)
        img.attrs.pop("height", None)
        img["class"] = "inline-icon" if re.search(r"stock_|/(white|black|default)\.png", img.get("src", "")) else "content-img"
        if not img.get("alt"):
            img["alt"] = ""

    # tables: wrap so they scroll on phones, first row as header if it has <th> or bold cells
    for tbl in content.find_all("table"):
        tbl["class"] = "data-table"
        wrap = soup.new_tag("div", attrs={"class": "table-wrap", "tabindex": "0", "role": "region"})
        cap = tbl.find("caption")
        wrap["aria-label"] = cap.get_text(" ", strip=True) if cap else "Table"
        tbl.wrap(wrap)
        first = tbl.find("tr")
        if first and not first.find("th"):
            cells = first.find_all("td")
            if cells and all(c.find(["strong", "b"]) or c.get_text(strip=True).isupper() for c in cells):
                for c in cells:
                    c.name = "th"
                    c["scope"] = "col"

    # empty paragraphs / stray breaks
    for p in content.find_all("p"):
        if not p.get_text(strip=True) and not p.find("img"):
            p.decompose()


