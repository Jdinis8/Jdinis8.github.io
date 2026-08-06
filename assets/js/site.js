document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
});

const sectionThemeToggles =
    document.querySelectorAll("[data-theme-toggle]");

const themeColorMeta =
    document.querySelector('meta[name="theme-color"]');

function getCurrentTheme() {
    return document.documentElement.dataset.theme || "light";
}

function updateSectionThemeControls() {
    const isDark = getCurrentTheme() === "dark";

    sectionThemeToggles.forEach((toggle) => {
        const label = toggle.querySelector("[data-theme-label]");

        if (label) {
            label.textContent = isDark ? "Light" : "Dark";
        }

        toggle.setAttribute("aria-pressed", String(isDark));
        toggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light mode" : "Switch to dark mode",
        );
    });

    themeColorMeta?.setAttribute(
        "content",
        isDark ? "#0a0a0a" : "#ffffff",
    );
}

function setTheme(theme) {
    document.documentElement.dataset.theme = theme;

    try {
        localStorage.setItem("theme", theme);
    } catch {
        // The theme still applies for this visit when storage is unavailable.
    }

    updateSectionThemeControls();
}

sectionThemeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
        setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
    });
});

updateSectionThemeControls();
