
   (function () {
    "use strict";

    let initialized = false;

    const SITEMAP_URL = "/sitemap.html";
    const EXCEL_URL = new URL("data/whats_new.xlsx", document.baseURI).href;
    const XLSX_SCRIPT = "/assets/js/xlsx.full.min.js";
    const GOOGLE_DOMAIN = "megpersonnel.netlify.app";

    const MAX_PAGES = 300;
    const CONCURRENCY = 5;

    const pageCache = new Map();
    let excelCache = null;
    let excelPromise = null;

    /* -----------------------------------------------------
       DESIGN
       ----------------------------------------------------- */

    function addStyles() {
        if (document.getElementById("combined-search-styles")) return;

        const style = document.createElement("style");
        style.id = "combined-search-styles";

        style.textContent = `
            .search-result-count {
                margin: 0 0 12px !important;
                color: #333 !important;
                font-size: 16px !important;
                font-weight: 400 !important;
            }

            .search-tabs {
                display: flex;
                align-items: center;
                gap: 0;
                border-bottom: 1px solid #ddd;
                margin: 12px 0 16px;
            }

            .search-tab {
                background: transparent !important;
                border: 0 !important;
                border-bottom: 3px solid transparent !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                color: #333 !important;
                padding: 12px 18px !important;
                margin: 0 0 -1px !important;
                font-size: 16px !important;
                font-weight: 400 !important;
                cursor: pointer;
            }

            .search-tab:hover {
                color: #174ea6 !important;
            }

            .search-tab.active {
                color: #174ea6 !important;
                border-bottom-color: #174ea6 !important;
                font-weight: 600 !important;
            }

            .search-tab-panel[hidden] {
                display: none !important;
            }

            .search-result-item {
                padding: 8px 0 !important;
                margin: 0 !important;
                border: 0 !important;
                background: transparent !important;
                box-shadow: none !important;
            }

            .search-result-item h3 {
                margin: 0 !important;
                padding: 0 !important;
                font-size: 21px !important;
                font-weight: 400 !important;
                line-height: 1.5 !important;
            }

            .search-result-item h3 a {
                color: #174ea6 !important;
                text-decoration: none !important;
            }

            .search-result-item h3 a:hover {
                text-decoration: underline !important;
            }

            .search-result-item p {
                margin: 4px 0 !important;
                color: #444 !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
            }

            .search-result-url {
                display: none !important;
            }
        `;

        document.head.appendChild(style);
    }

    /* -----------------------------------------------------
       INITIALISATION
       ----------------------------------------------------- */

    function initSiteSearch() {
        if (initialized) return;

        const form = document.getElementById("siteSearchForm");
        const input = document.getElementById("siteSearchInput");
        const modal = document.getElementById("searchModal");
        const closeButton = document.getElementById("closeSearchModal");
        const queryText = document.getElementById("searchQueryText");
        const resultsBox = document.getElementById("searchResults");

        if (
            !form ||
            !input ||
            !modal ||
            !closeButton ||
            !queryText ||
            !resultsBox
        ) {
            console.error("Search: Required search elements not found.");
            return;
        }

        initialized = true;
        addStyles();

        function openModal() {
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }

        function closeModal() {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
        }

        closeButton.addEventListener("click", closeModal);

        modal.addEventListener("click", function (event) {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", function (event) {
            if (
                event.key === "Escape" &&
                modal.classList.contains("active")
            ) {
                closeModal();
            }
        });

        /* -------------------------------------------------
           TEXT HELPERS
           ------------------------------------------------- */

        function normalise(value) {
            return String(value || "")
                .normalize("NFKC")
                .toLocaleLowerCase()
                .replace(/\s+/g, " ")
                .trim();
        }

        function getTerms(query) {
            return normalise(query).split(/\s+/).filter(Boolean);
        }

        /* -------------------------------------------------
           FUZZY MATCHING + SPELLING CORRECTION
           ------------------------------------------------- */

        function wordsIn(value) {
            return normalise(value)
                .replace(/[^\p{L}\p{N}]+/gu, " ")
                .split(/\s+/)
                .filter(function (word) {
                    return word.length >= 2;
                });
        }

        function editDistance(a, b) {
            if (a === b) return 0;
            if (!a) return b.length;
            if (!b) return a.length;

            const previous = Array.from(
                { length: b.length + 1 },
                function (_, i) {
                    return i;
                }
            );

            for (let i = 1; i <= a.length; i++) {
                let diagonal = previous[0];
                previous[0] = i;

                for (let j = 1; j <= b.length; j++) {
                    const old = previous[j];
                    const cost = a[i - 1] === b[j - 1] ? 0 : 1;

                    previous[j] = Math.min(
                        previous[j] + 1,
                        previous[j - 1] + 1,
                        diagonal + cost
                    );

                    diagonal = old;
                }
            }

            return previous[b.length];
        }

        function tokenSimilarity(a, b) {
            if (a === b) return 1;
            if (!a || !b) return 0;

            if (b.startsWith(a) || a.startsWith(b)) {
                return Math.min(a.length, b.length) /
                    Math.max(a.length, b.length);
            }

            return 1 -
                editDistance(a, b) / Math.max(a.length, b.length);
        }

        function scoreText(fields, terms) {
            let score = 0;
            let matched = 0;

            const fieldWords = fields.map(wordsIn);

            terms.forEach(function (term) {
                let best = 0;

                fields.forEach(function (field, index) {
                    if (normalise(field).includes(term)) {
                        best = Math.max(
                            best,
                            index === 0 ? 20 : 8
                        );
                        return;
                    }

                    fieldWords[index].forEach(function (word) {
                        const similarity = tokenSimilarity(term, word);

                        if (similarity >= 0.72) {
                            best = Math.max(
                                best,
                                Math.round(
                                    similarity * (index === 0 ? 14 : 5)
                                )
                            );
                        }
                    });
                });

                if (best > 0) {
                    score += best;
                    matched++;
                }
            });

            return matched ? score + matched * 6 : 0;
        }

        function buildVocabulary(webResults, documentResults) {
            const vocabulary = new Set();

            documentResults.forEach(function (item) {
                [
                    item.title,
                    item.note,
                    item.type,
                    item.section
                ].forEach(function (value) {
                    wordsIn(value).forEach(function (word) {
                        vocabulary.add(word);
                    });
                });
            });

            webResults.forEach(function (item) {
                [
                    item.title,
                    item.description,
                    item.content
                ].forEach(function (value) {
                    wordsIn(value).forEach(function (word) {
                        vocabulary.add(word);
                    });
                });
            });

            return Array.from(vocabulary);
        }

        function suggestCorrections(terms, vocabulary) {
            const corrected = [];
            let changed = false;

            terms.forEach(function (term) {
                if (term.length < 4 || vocabulary.includes(term)) {
                    corrected.push(term);
                    return;
                }

                let bestWord = "";
                let bestDistance = Infinity;

                vocabulary.forEach(function (word) {
                    if (Math.abs(word.length - term.length) > 2) {
                        return;
                    }

                    const distance = editDistance(term, word);
                    const allowed = term.length >= 8 ? 2 : 1;

                    if (
                        distance <= allowed &&
                        distance < bestDistance
                    ) {
                        bestDistance = distance;
                        bestWord = word;
                    }
                });

                if (bestWord) {
                    corrected.push(bestWord);
                    changed = true;
                } else {
                    corrected.push(term);
                }
            });

            return {
                terms: corrected,
                changed: changed,
                text: corrected.join(" ")
            };
        }

        function createSnippet(content, terms) {
            const text = String(content || "")
                .replace(/\s+/g, " ")
                .trim();

            const lower = normalise(text);
            let position = -1;

            for (const term of terms) {
                position = lower.indexOf(term);
                if (position !== -1) break;
            }

            if (position === -1) {
                return text.slice(0, 220);
            }

            const start = Math.max(0, position - 80);
            const end = Math.min(text.length, position + 150);

            return (start ? "... " : "") +
                text.slice(start, end) +
                (end < text.length ? " ..." : "");
        }

        /* -------------------------------------------------
           LOAD SHEETJS
           ------------------------------------------------- */

        function loadSheetJS() {
            if (window.XLSX) {
                return Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                let script = document.querySelector(
                    'script[src*="xlsx.full.min.js"]'
                );

                if (script) {
                    script.addEventListener("load", resolve, {
                        once: true
                    });

                    script.addEventListener("error", function () {
                        reject(
                            new Error("Excel reader could not be loaded.")
                        );
                    }, {
                        once: true
                    });

                    if (window.XLSX) resolve();
                    return;
                }

                script = document.createElement("script");
                script.src = XLSX_SCRIPT;

                script.onload = resolve;

                script.onerror = function () {
                    reject(
                        new Error(
                            "Excel reader not found: " + XLSX_SCRIPT
                        )
                    );
                };

                document.head.appendChild(script);
            });
        }

        /* -------------------------------------------------
           READ EXCEL WORKBOOK
           ------------------------------------------------- */

        function excelRows(workbook, sheetName) {
            const sheet = workbook.Sheets[sheetName];

            if (!sheet) return [];

            return XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false
            }).slice(1);
        }

        function getSectionNames(workbook) {
            const settings = workbook.Sheets["Settings"];

            if (!settings) {
                throw new Error("Settings sheet not found.");
            }

            const names = [];

            excelRows(workbook, "Settings").forEach(function (row) {
                const name = String(row[0] || "").trim();

                if (name && workbook.Sheets[name]) {
                    names.push(name);
                }
            });

            if (!names.length) {
                throw new Error(
                    "No section sheets listed in Settings."
                );
            }

            return names;
        }

        function isVisible(value) {
            const show = normalise(value);

            if (!show) return true;

            return ["yes", "y", "true", "1"].includes(show);
        }

        function safeURL(link) {
            let value = String(link || "").trim();

            if (!value) return "";

            if (/^(javascript:|data:)/i.test(value)) {
                return "";
            }

            if (/^https?:\/\//i.test(value)) {
                try {
                    return new URL(value).href;
                } catch (_) {
                    return "";
                }
            }

            try {
                let decoded;

                try {
                    decoded = decodeURIComponent(value);
                } catch (_) {
                    decoded = value;
                }

                return new URL(
                    encodeURI(decoded)
                        .replace(/'/g, "%27")
                        .replace(/#/g, "%23"),
                    document.baseURI
                ).href;

            } catch (_) {
                return "";
            }
        }

        function loadExcelDocuments() {
            if (excelCache) {
                return Promise.resolve(excelCache);
            }

            if (excelPromise) return excelPromise;

            excelPromise = loadSheetJS()
                .then(function () {
                    return fetch(EXCEL_URL, {
                        cache: "no-cache"
                    });
                })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error(
                            "Workbook HTTP " + response.status +
                            ": " + EXCEL_URL
                        );
                    }

                    return response.arrayBuffer();
                })
                .then(function (buffer) {
                    const workbook = XLSX.read(buffer, {
                        type: "array"
                    });

                    const documents = [];

                    getSectionNames(workbook).forEach(function (sheetName) {
                        excelRows(workbook, sheetName).forEach(
                            function (row) {
                                const title = String(row[0] || "").trim();
                                const rawLink = String(row[1] || "").trim();

                                if (!title || !rawLink) return;
                                if (!isVisible(row[4])) return;

                                const url = safeURL(rawLink);
                                if (!url) return;

                                documents.push({
                                    kind: "document",
                                    title: title,
                                    url: url,
                                    rawLink: rawLink,
                                    type: String(row[2] || "").trim(),
                                    note: String(row[6] || "").trim(),
                                    size: String(row[7] || "").trim(),
                                    section: sheetName
                                });
                            }
                        );
                    });

                    excelCache = documents;

                    console.log(
                        "Document search: " + documents.length +
                        " visible Excel entries loaded."
                    );

                    return documents;
                })
                .catch(function (error) {
                    excelPromise = null;
                    throw error;
                });

            return excelPromise;
        }

        /* -------------------------------------------------
           SEARCH EXCEL DOCUMENTS
           ------------------------------------------------- */

        async function searchDocuments(terms) {
            const documents = await loadExcelDocuments();

            return documents.map(function (doc) {
                const score = scoreText(
                    [
                        doc.title,
                        doc.note,
                        doc.rawLink,
                        doc.type,
                        doc.section
                    ],
                    terms
                );

                return score
                    ? Object.assign({}, doc, {
                        score: score,
                        snippet: createSnippet(
                            doc.note || doc.rawLink,
                            terms
                        )
                    })
                    : null;
            })
            .filter(Boolean)
            .sort(function (a, b) {
                return b.score - a.score;
            });
        }

        /* -------------------------------------------------
           WEBSITE SITEMAP
           ------------------------------------------------- */

        async function getSitemapLinks() {
            const response = await fetch(SITEMAP_URL, {
                cache: "no-cache"
            });

            if (!response.ok) {
                throw new Error(
                    "Sitemap HTTP " + response.status
                );
            }

            const html = await response.text();

            const sitemap = new DOMParser().parseFromString(
                html,
                "text/html"
            );

            const urls = new Set();

            sitemap.querySelectorAll("a[href]").forEach(function (link) {
                try {
                    const url = new URL(
                        link.getAttribute("href"),
                        window.location.origin
                    );

                    if (url.origin !== window.location.origin) return;

                    if (
                        /\.(pdf|jpg|jpeg|png|gif|webp|svg|doc|docx|xls|xlsx|zip|rar|mp4|mp3)$/i
                            .test(url.pathname)
                    ) {
                        return;
                    }

                    if (
                        url.pathname === "/" ||
                        url.pathname.endsWith("/")
                    ) {
                        url.pathname += "index.htm";
                    }

                    url.hash = "";
                    urls.add(url.href);

                } catch (_) {
                    // Ignore invalid links.
                }
            });

            return Array.from(urls).slice(0, MAX_PAGES);
        }

        /* -------------------------------------------------
           FETCH WEBSITE PAGE CONTENT
           ------------------------------------------------- */

        async function getPageContent(url) {
            if (pageCache.has(url)) {
                return pageCache.get(url);
            }

            try {
                const response = await fetch(url, {
                    cache: "force-cache"
                });

                if (!response.ok) return null;

                const page = new DOMParser().parseFromString(
                    await response.text(),
                    "text/html"
                );

                const title =
                    page.querySelector("title")?.textContent ||
                    page.querySelector("h1")?.textContent ||
                    url;

                const description =
                    page.querySelector('meta[name="description"]')
                        ?.getAttribute("content") || "";

                const main =
                    page.querySelector("main") ||
                    page.querySelector("article") ||
                    page.querySelector("#content") ||
                    page.body;

                if (!main) return null;

                const copy = main.cloneNode(true);

                copy.querySelectorAll(
                    "script,style,noscript,nav,header,footer,form,button"
                ).forEach(function (element) {
                    element.remove();
                });

                const result = {
                    kind: "page",
                    title: title.trim(),
                    description: description.trim(),
                    content: (copy.textContent || "").trim(),
                    url: url
                };

                pageCache.set(url, result);

                return result;

            } catch (error) {
                console.warn(
                    "Could not search page:",
                    url,
                    error
                );
                return null;
            }
        }

        /* -------------------------------------------------
           SEARCH WEBSITE PAGES
           ------------------------------------------------- */

        async function searchWebsite(terms) {
            const urls = await getSitemapLinks();
            const results = [];
            let nextIndex = 0;

            async function worker() {
                while (nextIndex < urls.length) {
                    const index = nextIndex++;
                    const page = await getPageContent(urls[index]);

                    if (!page) continue;

                    const score = scoreText(
                        [
                            page.title,
                            page.description,
                            page.content
                        ],
                        terms
                    );

                    if (score > 0) {
                        results.push(Object.assign({}, page, {
                            score: score,
                            snippet: createSnippet(
                                page.content,
                                terms
                            )
                        }));
                    }
                }
            }

            const workers = [];

            for (
                let i = 0;
                i < Math.min(CONCURRENCY, urls.length);
                i++
            ) {
                workers.push(worker());
            }

            await Promise.all(workers);

            return results.sort(function (a, b) {
                return b.score - a.score;
            });
        }

        /* -------------------------------------------------
           DISPLAY RESULTS
           ------------------------------------------------- */

        function createPanel(results, label, error) {
            const panel = document.createElement("div");
            panel.className = "search-tab-panel";
            panel.setAttribute("role", "tabpanel");

            if (error) {
                const message = document.createElement("p");

                message.textContent =
                    label +
                    " search could not be completed. Please check the source file.";

                panel.appendChild(message);
                return panel;
            }

            if (!results.length) {
                const message = document.createElement("p");

                message.textContent =
                    "No matching " + label.toLowerCase() +
                    " were found. Please try different keywords.";

                panel.appendChild(message);
                return panel;
            }

            results.forEach(function (result) {
                const item = document.createElement("div");
                item.className = "search-result-item";

                const heading = document.createElement("h3");
                const link = document.createElement("a");

                link.href = result.url;
                link.textContent = result.title;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                heading.appendChild(link);
                item.appendChild(heading);

                const description = document.createElement("p");

                if (result.kind === "document") {
                    description.textContent = [
                        result.section,
                        result.type,
                        result.size,
                        result.note
                    ].filter(Boolean).join(" · ");

                } else {
                    description.textContent = result.snippet || "";
                }

                if (description.textContent) {
                    item.appendChild(description);
                }

                panel.appendChild(item);
            });

            return panel;
        }

        /* -------------------------------------------------
           DISPLAY THREE SEARCH TABS
           ------------------------------------------------- */

        function displayResults(
            webResults,
            documentResults,
            webError,
            documentError,
            query,
            suggestion
        ) {
            resultsBox.replaceChildren();

            const total =
                (webError ? 0 : webResults.length) +
                (documentError ? 0 : documentResults.length);

            const count = document.createElement("p");
            count.className = "search-result-count";
            count.textContent = total + " result(s) found.";

            resultsBox.appendChild(count);

            /* SPELLING SUGGESTION */

            if (suggestion && suggestion.changed) {
                const line = document.createElement("p");
                line.className = "search-result-count";
                line.style.fontSize = "14px";
                line.textContent = "Did you mean: ";

                const correction = document.createElement("a");
                correction.href = "#";
                correction.textContent = suggestion.text;
                correction.style.color = "#174ea6";

                correction.addEventListener("click", function (event) {
                    event.preventDefault();
                    input.value = suggestion.text;
                    form.requestSubmit();
                });

                line.appendChild(correction);
                resultsBox.appendChild(line);
            }

            const tabs = document.createElement("div");
            tabs.className = "search-tabs";
            tabs.setAttribute("role", "tablist");

            const webPanel = createPanel(
                webResults,
                "Web Pages",
                webError
            );

            const documentPanel = createPanel(
                documentResults,
                "Documents",
                documentError
            );

            /* MORE RESULTS PANEL */

            const morePanel = document.createElement("div");
            morePanel.className = "search-tab-panel";
            morePanel.setAttribute("role", "tabpanel");
            morePanel.hidden = true;

            const moreMessage = document.createElement("p");

            moreMessage.textContent =
                "Can't find what you're looking for? Search the web for more results.";

            morePanel.appendChild(moreMessage);

            const moreLink = document.createElement("a");

            moreLink.href =
                "https://www.google.com/search?q=" +
                encodeURIComponent(
                    "site:" + GOOGLE_DOMAIN + " " + query
                );

            moreLink.textContent = "Search for more results";
            moreLink.target = "_blank";
            moreLink.rel = "noopener noreferrer";
            moreLink.style.color = "#174ea6";

            morePanel.appendChild(moreLink);

            /* TAB ACTIVATION */

            function activateTab(index) {
                tabs.querySelectorAll("button").forEach(
                    function (button, i) {
                        const active = i === index;

                        button.classList.toggle("active", active);

                        button.setAttribute(
                            "aria-selected",
                            String(active)
                        );
                    }
                );

                webPanel.hidden = index !== 0;
                documentPanel.hidden = index !== 1;
                morePanel.hidden = index !== 2;
            }

            /* ALL THREE TABS ALWAYS VISIBLE */

            const tabData = [
                {
                    label: "Web Pages",
                    count: webError ? "—" : webResults.length
                },
                {
                    label: "Documents",
                    count: documentError ? "—" : documentResults.length
                },
                {
                    label: "More Results",
                    count: ""
                }
            ];

            tabData.forEach(function (tab, index) {
                const button = document.createElement("button");

                button.type = "button";
                button.className = "search-tab";
                button.setAttribute("role", "tab");

                button.textContent =
                    tab.label +
                    (tab.count !== "" ? " (" + tab.count + ")" : "");

                button.addEventListener("click", function () {
                    activateTab(index);
                });

                tabs.appendChild(button);
            });

            resultsBox.appendChild(tabs);
            resultsBox.appendChild(webPanel);
            resultsBox.appendChild(documentPanel);
            resultsBox.appendChild(morePanel);

            activateTab(0);
        }

        /* -------------------------------------------------
           SEARCH FORM
           ------------------------------------------------- */

        form.addEventListener("submit", async function (event) {
            event.preventDefault();

            const query = input.value.trim();

            if (!query) {
                input.focus();
                return;
            }

            openModal();

            queryText.textContent =
                'Search results for: "' + query + '"';

            resultsBox.replaceChildren();

            const loading = document.createElement("p");

            loading.textContent =
                "Searching website pages and documents. Please wait...";

            resultsBox.appendChild(loading);

            const terms = getTerms(query);

            const outcomes = await Promise.allSettled([
                searchWebsite(terms),
                searchDocuments(terms)
            ]);

            const webError = outcomes[0].status === "rejected";
            const documentError = outcomes[1].status === "rejected";

            let webResults = webError ? [] : outcomes[0].value;
            let documentResults = documentError ? [] : outcomes[1].value;

            if (webError) {
                console.error(
                    "Website search error:",
                    outcomes[0].reason
                );
            }

            if (documentError) {
                console.error(
                    "Excel search error:",
                    outcomes[1].reason
                );
            }

            /* SPELLING CORRECTION */

            const vocabulary = buildVocabulary(
                webResults,
                documentResults
            );

            let suggestion = suggestCorrections(
                terms,
                vocabulary
            );

            // Retry with corrected spelling only when the original
            // search returns no local results.
            if (
                suggestion.changed &&
                !webResults.length &&
                !documentResults.length
            ) {
                const corrected = await Promise.allSettled([
                    searchWebsite(suggestion.terms),
                    searchDocuments(suggestion.terms)
                ]);

                if (corrected[0].status === "fulfilled") {
                    webResults = corrected[0].value;
                }

                if (corrected[1].status === "fulfilled") {
                    documentResults = corrected[1].value;
                }

                if (
                    !webResults.length &&
                    !documentResults.length
                ) {
                    suggestion = null;
                }

            } else if (!suggestion.changed) {
                suggestion = null;
            }

            displayResults(
                webResults,
                documentResults,
                webError,
                documentError,
                query,
                suggestion
            );
        });

        console.log("PHED combined search initialised.");
    }

    /* -----------------------------------------------------
       DYNAMIC COMPONENT INITIALISATION
       ----------------------------------------------------- */

    document.addEventListener(
        "components:loaded",
        initSiteSearch
    );

    if (document.getElementById("searchModal")) {
        initSiteSearch();
    }

})();