function openAccessibilityPanel() {
    const panel = document.getElementById("uw-main");
    const trigger = document.getElementById("uw-widget-custom-trigger2");

    if (!panel) return;

    panel.classList.add("accessibility-panel-open");

    if (trigger) {
        trigger.setAttribute("aria-expanded", "true");
    }
}

function closeAccessibilityPanel() {
    const panel = document.getElementById("uw-main");
    const trigger = document.getElementById("uw-widget-custom-trigger2");

    if (!panel) return;

    panel.classList.remove("accessibility-panel-open");

    if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
        trigger.focus();
    }
}