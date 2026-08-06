(() => {
    let theme = "light";

    try {
        theme = localStorage.getItem("theme") || theme;
    } catch {
        // Keep the default when storage is unavailable.
    }

    document.documentElement.dataset.theme = theme;

    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
            "content",
            theme === "light" ? "#ffffff" : "#0a0a0a"
        );
})();
