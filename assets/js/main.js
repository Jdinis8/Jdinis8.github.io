import { HomeScene } from "./home/home-scene.js";
import { BlackHoleEasterEgg } from "./home/black-hole-easter-egg.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const themeToggle =
    document.getElementById(
        "theme-toggle"
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
    if (!themeToggle) {
        return;
    }

    const isLight =
        getCurrentTheme() ===
        "light";

    themeToggle.setAttribute(
        "aria-pressed",
        String(!isLight)
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

const blackHoleEasterEgg =
    new BlackHoleEasterEgg();

blackHoleEasterEgg.init();

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
let hasDrawnFirstFrame = false;

function animate(time) {
    const dt = lastTime
        ? Math.min(time - lastTime, 50)
        : 0;

    lastTime = time;

    ctx.save();

    scene.update(dt);
    scene.draw();

    ctx.restore();

    if (!hasDrawnFirstFrame) {
        hasDrawnFirstFrame = true;
        document.documentElement.classList.add("home-canvas-ready");
    }

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
