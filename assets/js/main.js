import { HomeScene } from "./home/home-scene.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const themeToggle =
    document.getElementById(
        "theme-toggle"
    );

const themeToggleLabel =
    document.getElementById(
        "theme-toggle-label"
    );

const themeColorMeta =
    document.querySelector(
        'meta[name="theme-color"]'
    );

function getCurrentTheme() {
    return (
        document
            .documentElement
            .dataset
            .theme ||
        "light"
    );
}

function updateThemeButton() {
    if (
        !themeToggle ||
        !themeToggleLabel
    ) {
        return;
    }

    const isLight =
        getCurrentTheme() ===
        "light";

    /*
     * The label describes the mode that will be activated
     * when the visitor presses the button.
     */
    themeToggleLabel.textContent =
        isLight
            ? "Dark"
            : "Light";

    themeToggle.setAttribute(
        "aria-pressed",
        String(isLight)
    );

    themeToggle.setAttribute(
        "aria-label",
        isLight
            ? "Switch to dark mode"
            : "Switch to light mode"
    );

    themeColorMeta?.setAttribute(
        "content",
        isLight
            ? "#ffffff"
            : "#000000"
    );
}

function setTheme(theme) {
    document
        .documentElement
        .dataset
        .theme = theme;

    localStorage.setItem(
        "theme",
        theme
    );

    updateThemeButton();
}

themeToggle?.addEventListener(
    "click",
    () => {
        const nextTheme =
            getCurrentTheme() ===
            "dark"
                ? "light"
                : "dark";

        setTheme(
            nextTheme
        );
    }
);

updateThemeButton();

const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: 0,
    vy: 0
};

const scene = new HomeScene(canvas, ctx, mouse);
scene.init();

function resize() {
    scene.onResize();
}

resize();

window.addEventListener("resize", resize, {
    passive: true
});

window.visualViewport?.addEventListener("resize", resize, {
    passive: true
});

let lastTime = 0;

function animate(time) {
    const dt = lastTime
        ? Math.min(time - lastTime, 50)
        : 0;

    lastTime = time;

    ctx.save();

    scene.update(dt);
    scene.draw();

    ctx.restore();

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
