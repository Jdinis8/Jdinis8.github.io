import { HomeScene } from './HomeScene.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const blurOverlay = document.getElementById("blur-overlay");
const skipButton = document.getElementById("skip-button");
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

let behindScene = null;
let currentScene = null;
const maincolor = "#6291bd";

function resize() {
    const viewport = window.visualViewport;

    const width = Math.round(
        viewport?.width ?? document.documentElement.clientWidth
    );

    const height = Math.round(
        viewport?.height ?? window.innerHeight
    );

    if (
        canvas.width !== width ||
        canvas.height !== height
    ) {
        canvas.width = width;
        canvas.height = height;
    }

    behindScene?.onResize();
    currentScene?.onResize?.();
}

const mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    vx: 0,
    vy: 0
};

function replayBlur() {
    const blurOverlay = document.createElement("div");
    blurOverlay.id = "blur-overlay";
    document.body.appendChild(blurOverlay);
    console.log(blurOverlay);
}

behindScene = new HomeScene(canvas, ctx, mouse, maincolor);
behindScene.init();

behindScene = new HomeScene(canvas, ctx, mouse);
behindScene.init();

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

    behindScene?.update(dt);

    // --- Gravity attraction logic
    const gravitySection = document.getElementById('gravity');
    if (gravitySection) {
        const rect = gravitySection.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        behindScene.layers.forEach(layer => {
            layer.dots.forEach(dot => {
                const dx = centerX - (dot.x + canvas.width/2);
                const dy = centerY - (dot.y + canvas.height/2);
                const dist = Math.hypot(dx, dy);

                const minimumDimension = Math.min(
                    canvas.width,
                    canvas.height
                );

                const influenceRadius = Math.min(
                    300,
                    Math.max(120, minimumDimension * 0.35)
                );
                
                if (dist > 0 && dist < influenceRadius) {
                    const force = (1 - dist / influenceRadius) * 0.05;
                    dot.vx += dx / dist * force;
                    dot.vy += dy / dist * force;
                }
            });
        });
    }

    behindScene?.draw(ctx);

    ctx.restore();

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);