(() => {
    let theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    try {
        theme = localStorage.getItem("theme") || theme;
    } catch {
        // Keep the system preference when storage is unavailable.
    }

    document.documentElement.dataset.theme = theme;

    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
            "content",
            theme === "light" ? "#ffffff" : "#0a0a0a"
        );
})();
