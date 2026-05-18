// HomeScene.js
import { DotGrid } from "./DotGrid.js";
import { UIOverlay } from "./UIOverlay.js"
export class HomeScene {
    constructor(canvas, ctx, mouse) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;

        this.layers = [];

        this.scroll = 0;
        this.scrollTarget = 0;

        this.ui = new UIOverlay(canvas);

        window.addEventListener("resize", () => {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ui.resize();
    });
    }

    init() {
        this.layers = [
            new DotGrid({
                spacing: 30,
                canvas: this.canvas,
                depth: -250,
                opacity: 0.1,
                rotationStrength: 0.001
            }),
            new DotGrid({
                spacing: 35,
                canvas: this.canvas,
                depth: 0,
                opacity: 0.5,
                rotationStrength: 0.01
            }),
        ];

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onScroll = this.onScroll.bind(this);

        this.canvas.addEventListener("mousemove", this.onMouseMove);
        window.addEventListener("scroll", this.onScroll);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.mouse.vx = x - (this.mouse.x ?? x);
        this.mouse.vy = y - (this.mouse.y ?? y);

        this.mouse.x = x;
        this.mouse.y = y;
    }

    onScroll() {
        this.scrollTarget = window.scrollY;
    }

    update(dt) {
        this.scroll += (this.scrollTarget - this.scroll) * 0.05;

        this.layers.forEach((layer, i) => {
            layer.scrollRotation = this.scroll * 0.00002 * (i + 1);
            layer.update(dt, this.mouse);
        });
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.layers.forEach(layer => layer.draw(ctx, this.mouse));
        
        // update & draw UI overlay
        this.ui.update(this.mouse);
        this.ui.draw(ctx);
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
        window.removeEventListener("scroll", this.onScroll);
    }

    onResize() {
        this.layers.forEach(layer => layer.onResize());
    }
}
