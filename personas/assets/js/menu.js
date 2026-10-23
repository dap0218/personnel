/* DBIM mobile navbar controller
   Supports either IDs (#mainMenu / #mobileMenuToggle) or the classes
   .main-menu / .mobile-menu-toggle used in the updated stylesheet. */
   (function () {
    'use strict';

    const MOBILE_BREAKPOINT = 992;

    function getMenu() {
        return document.getElementById('mainMenu') ||
            document.querySelector('nav.main-navbar ul.main-menu');
    }

    function getToggle() {
        return document.getElementById('mobileMenuToggle') ||
            document.querySelector('nav.main-navbar .mobile-menu-toggle');
    }

    function isMobile() {
        return window.innerWidth < MOBILE_BREAKPOINT;
    }

    function getTopItems(menu) {
        return Array.from(menu.querySelectorAll(':scope > li'));
    }

    function getTopLinks(menu) {
        return getTopItems(menu)
            .map(item => item.querySelector(':scope > a'))
            .filter(Boolean);
    }

    function getSubmenu(item) {
        return item ? item.querySelector(':scope > .dropdown-menu') : null;
    }

    function getSubmenuLinks(item) {
        const submenu = getSubmenu(item);
        return submenu
            ? Array.from(submenu.querySelectorAll('a:not([aria-disabled="true"])'))
            : [];
    }

    function setSubmenu(item, open) {
        if (!item) return;
        const link = item.querySelector(':scope > a');
        item.classList.toggle('submenu-open', open);
        const submenu = getSubmenu(item);

        if (link && item.classList.contains('has-dropdown')) {
            link.setAttribute('aria-haspopup', 'true');
            link.setAttribute('aria-expanded', String(open));
        }
        if (submenu) submenu.classList.toggle('show', open);
    }

    function closeSubmenus(menu, exceptItem) {
        if (!menu) return;
        getTopItems(menu).forEach(item => {
            if (item.classList.contains('has-dropdown') && item !== exceptItem) {
                setSubmenu(item, false);
            }
        });
    }

    function setMobileMenu(menu, toggle, open, returnFocus) {
        if (!menu || !toggle) return;

        menu.classList.toggle('is-open', open);
        menu.classList.toggle('show', open);
        toggle.classList.toggle('is-active', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

        if (!open) closeSubmenus(menu);
        if (returnFocus) toggle.focus();
    }

    function initialiseNavbar() {
        const menu = getMenu();
        const toggle = getToggle();
        if (!menu || !toggle) return;

        if (!toggle.hasAttribute('type')) toggle.setAttribute('type', 'button');
        toggle.setAttribute('aria-controls', menu.id || 'mainMenu');
        toggle.setAttribute('aria-expanded', String(menu.classList.contains('is-open')));
        toggle.setAttribute('aria-label', menu.classList.contains('is-open') ? 'Close navigation menu' : 'Open navigation menu');

        getTopItems(menu).forEach(item => {
            if (!item.classList.contains('has-dropdown')) return;
            const link = item.querySelector(':scope > a');
            if (link) {
                link.setAttribute('aria-haspopup', 'true');
                if (!link.hasAttribute('aria-expanded')) link.setAttribute('aria-expanded', 'false');
            }
        });
    }

    document.addEventListener('click', function (event) {
        const toggle = event.target.closest('#mobileMenuToggle, nav.main-navbar .mobile-menu-toggle');
        if (toggle) {
            const menu = getMenu();
            if (!menu) {
                console.error('Navbar: main menu not found.');
                return;
            }
            setMobileMenu(menu, toggle, !menu.classList.contains('is-open'));
            return;
        }

        const menu = getMenu();
        if (!menu || !isMobile() || !menu.contains(event.target)) return;

        const link = event.target.closest('li.has-dropdown > a');
        if (link && menu.contains(link)) {
            const item = link.closest('li.has-dropdown');
            const submenu = getSubmenu(item);
            if (!submenu) return;

            // First tap opens the submenu; a second tap can follow the link.
            if (!item.classList.contains('submenu-open')) {
                event.preventDefault();
                closeSubmenus(menu, item);
                setSubmenu(item, true);
            }
            return;
        }

        const clickedLink = event.target.closest('a');
        if (clickedLink && menu.contains(clickedLink) && !clickedLink.closest('li.has-dropdown > a')) {
            setMobileMenu(menu, getToggle(), false);
        }
    });

    document.addEventListener('keydown', function (event) {
        const menu = getMenu();
        const toggle = getToggle();
        if (!menu) return;

        const topLink = event.target.closest('#mainMenu > li > a, nav.main-navbar ul.main-menu > li > a');
        const submenuLink = event.target.closest('#mainMenu > li > .dropdown-menu a, nav.main-navbar ul.main-menu > li > .dropdown-menu a');
        if (!topLink && !submenuLink) {
            if (event.key === 'Escape' && isMobile() && menu.classList.contains('is-open')) {
                event.preventDefault();
                setMobileMenu(menu, toggle, false, true);
            }
            return;
        }

        const topLinks = getTopLinks(menu);
        const currentItem = (topLink || submenuLink).closest('#mainMenu > li, nav.main-navbar ul.main-menu > li');

        if (event.key === 'Escape') {
            const openItem = currentItem && currentItem.classList.contains('submenu-open')
                ? currentItem
                : menu.querySelector(':scope > li.has-dropdown.submenu-open');
            if (openItem) {
                event.preventDefault();
                setSubmenu(openItem, false);
                const parentLink = openItem.querySelector(':scope > a');
                if (parentLink) parentLink.focus();
            } else if (isMobile() && menu.classList.contains('is-open')) {
                event.preventDefault();
                setMobileMenu(menu, toggle, false, true);
            }
            return;
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const currentTopLink = currentItem ? currentItem.querySelector(':scope > a') : null;
            const index = topLinks.indexOf(currentTopLink);
            if (index < 0 || !topLinks.length) return;
            const step = event.key === 'ArrowRight' ? 1 : -1;
            closeSubmenus(menu);
            topLinks[(index + step + topLinks.length) % topLinks.length].focus();
            return;
        }

        if (event.key === 'ArrowDown' && topLink) {
            const links = getSubmenuLinks(currentItem);
            if (links.length) {
                event.preventDefault();
                closeSubmenus(menu, currentItem);
                setSubmenu(currentItem, true);
                links[0].focus();
            } else {
                const index = topLinks.indexOf(topLink);
                if (index >= 0 && index < topLinks.length - 1) {
                    event.preventDefault();
                    topLinks[index + 1].focus();
                }
            }
            return;
        }

        if (event.key === 'ArrowUp' && topLink) {
            const links = getSubmenuLinks(currentItem);
            if (links.length) {
                event.preventDefault();
                closeSubmenus(menu, currentItem);
                setSubmenu(currentItem, true);
                links[links.length - 1].focus();
            }
            return;
        }

        if (submenuLink && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            const links = getSubmenuLinks(currentItem);
            const index = links.indexOf(submenuLink);
            if (index < 0 || !links.length) return;
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            links[(index + step + links.length) % links.length].focus();
        }
    });

    function handleResize() {
        const menu = getMenu();
        const toggle = getToggle();
        if (!menu || !toggle) return;
        if (!isMobile()) setMobileMenu(menu, toggle, false);
        else closeSubmenus(menu);
    }

    window.addEventListener('resize', handleResize);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialiseNavbar, { once: true });
    } else {
        initialiseNavbar();
    }
})();

/* Footer "Last Updated On" date.
   Fills <time id="lastUpdated"> in components/footer.html with the date this page was
   last changed on the server (document.lastModified), e.g. "22 October 2026".
   The footer is loaded by components.js after the page, so this waits for it to appear. */
(function () {
    'use strict';

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];

    function fill() {
        const el = document.getElementById('lastUpdated');
        if (!el) return false;
        if (el.dataset.filled) return true;

        const d = new Date(document.lastModified);
        if (isNaN(d.getTime())) return true;          // no usable date – leave it blank

        const pad = n => String(n).padStart(2, '0');
        el.textContent = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
        el.setAttribute('datetime', d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()));
        el.dataset.filled = 'true';
        return true;
    }

    function start() {
        if (fill()) return;
        // Footer not loaded yet: watch the page until it arrives (stop after 15 seconds).
        const observer = new MutationObserver(function () {
            if (fill()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(function () { observer.disconnect(); }, 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
