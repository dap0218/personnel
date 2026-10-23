document.addEventListener("DOMContentLoaded", function () {
    const navbar = document.querySelector("nav.main-navbar");

    if (!navbar) {
        console.warn("Sticky navigation: nav.main-navbar not found.");
        return;
    }

    // Create a placeholder to preserve the navbar's original space
    const placeholder = document.createElement("div");
    placeholder.className = "navbar-sticky-placeholder";
    navbar.parentNode.insertBefore(placeholder, navbar);

    let navbarOriginalTop = 0;
    let ticking = false;

    function measureNavbar() {
        // Temporarily restore normal flow to measure the original position
        navbar.classList.remove("is-fixed");
        placeholder.style.display = "none";
        placeholder.style.height = "0px";

        navbarOriginalTop =
            navbar.getBoundingClientRect().top + window.scrollY;

        updateNavbar();
    }

    function updateNavbar() {
        const shouldFix = window.scrollY >= navbarOriginalTop;

        if (shouldFix) {
            placeholder.style.height = navbar.offsetHeight + "px";
            placeholder.style.display = "block";
            navbar.classList.add("is-fixed");
        } else {
            navbar.classList.remove("is-fixed");
            placeholder.style.display = "none";
            placeholder.style.height = "0px";
        }

        ticking = false;
    }

    window.addEventListener("scroll", function () {
        if (!ticking) {
            window.requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener("resize", measureNavbar);
    window.addEventListener("load", measureNavbar);

    measureNavbar();
});