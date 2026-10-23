(function () {
    "use strict";

    function initAnnouncementTicker() {
        const ticker = document.querySelector(".news-ticker-horizontal");
        const track = document.getElementById("announcementTrack");
        const toggle = document.getElementById("announcementToggle");

        if (!ticker || !track || !toggle) {
            console.error("Announcement ticker: required HTML elements were not found.");
            return;
        }

        if (ticker.dataset.tickerInitialized === "true") return;
        ticker.dataset.tickerInitialized = "true";

        const DISPLAY_DURATION = 6000;

        let currentIndex = 0;
        let timer = null;

        function getAnnouncements() {
            return Array.from(track.querySelectorAll("a"));
        }

        function updateButton() {
            const paused = ticker.classList.contains("is-paused");

            toggle.setAttribute(
                "aria-label",
                paused ? "Play announcements" : "Pause announcements"
            );

            toggle.setAttribute(
                "title",
                paused ? "Play announcements" : "Pause announcements"
            );

            toggle.setAttribute("aria-pressed", String(paused));

            // Support either a Material Symbols icon or an image icon.
            const symbol = toggle.querySelector(".material-symbols-outlined");
            const image = toggle.querySelector("img");

            if (symbol) {
                symbol.textContent = paused ? "play_arrow" : "pause";
            }

            if (image) {
                image.src = paused
                    ? "assets/icons/play.svg"
                    : "assets/icons/pause.svg";

                image.alt = "";
            }
        }

        function showAnnouncement(index) {
            const announcements = getAnnouncements();

            if (!announcements.length) {
                currentIndex = 0;
                return;
            }

            currentIndex =
                ((index % announcements.length) + announcements.length) %
                announcements.length;

            announcements.forEach(function (announcement, i) {
                const active = i === currentIndex;

                announcement.classList.toggle("is-active", active);
                announcement.setAttribute("aria-hidden", String(!active));
                announcement.tabIndex = active ? 0 : -1;
            });
        }

        function stopRotation() {
            if (timer !== null) {
                window.clearTimeout(timer);
                timer = null;
            }
        }

        function scheduleNext() {
            stopRotation();

            if (ticker.classList.contains("is-paused")) return;
            if (document.hidden) return;

            const announcements = getAnnouncements();

            if (announcements.length < 2) return;

            timer = window.setTimeout(function () {
                showAnnouncement(currentIndex + 1);
                scheduleNext();
            }, DISPLAY_DURATION);
        }

        function startRotation() {
            const announcements = getAnnouncements();

            stopRotation();

            if (!announcements.length) return;

            if (currentIndex >= announcements.length) {
                currentIndex = 0;
            }

            showAnnouncement(currentIndex);
            updateButton();
            scheduleNext();
        }

        toggle.addEventListener("click", function (event) {
            event.preventDefault();

            ticker.classList.toggle("is-paused");

            updateButton();

            if (ticker.classList.contains("is-paused")) {
                stopRotation();
            } else {
                scheduleNext();
            }
        });

        // Initialize the first announcement.
        startRotation();

        // Handle announcements populated dynamically by another script.
        const observer = new MutationObserver(function (mutations) {
            const contentChanged = mutations.some(function (mutation) {
                return mutation.type === "childList";
            });

            if (contentChanged) {
                currentIndex = 0;
                startRotation();
            }
        });

        observer.observe(track, {
            childList: true
        });

        // Stop the timer in a hidden tab; resume when visible.
        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                stopRotation();
            } else if (!ticker.classList.contains("is-paused")) {
                scheduleNext();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initAnnouncementTicker
        );
    } else {
        initAnnouncementTicker();
    }
})();