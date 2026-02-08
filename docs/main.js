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

// Initialize scene
let currentScene = new IntroScene(canvas, ctx);
currentScene.init(blurOverlay);

let lastTime = 0;

// Main loop
function animate(time) {
    const dt = time - lastTime;
    lastTime = time;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    currentScene?.update(dt);
    currentScene?.draw(ctx);

    if (currentScene instanceof IntroScene && currentScene.completed) {
        currentScene.destroy();
        currentScene = new HomeScene(canvas, ctx, mouse);
        currentScene.init();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Created by João D. Álvares", canvas.width/2, canvas.height - 30);

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

animate();
