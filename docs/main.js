import { IntroScene } from './IntroScene.js';
import { HomeScene } from './HomeScene.js';

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const blurOverlay = document.getElementById("blur-overlay");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const mouse = { x: canvas.width/2, y: canvas.height/2 };
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function replayBlur() {
    const blurOverlay = document.createElement("div");
    blurOverlay.id = "blur-overlay";
    document.body.appendChild(blurOverlay);
    console.log(blurOverlay);
}

// Initialize scene
let currentScene = new IntroScene(canvas, ctx);
currentScene.init(blurOverlay);

let behindScene = new HomeScene(canvas, ctx, mouse);
behindScene.init();

let lastTime = 0;

// Main loop
function animate(time) {
    const dt = time - lastTime;
    lastTime = time;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.save();
    behindScene?.update(dt);
    behindScene?.draw(ctx);
    currentScene?.update(dt);
    currentScene?.draw(ctx);
    ctx.restore();

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

animate();