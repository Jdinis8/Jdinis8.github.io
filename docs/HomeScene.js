// HomeScene.js
import { DotGrid } from './DotGrid.js';

export class HomeScene {
    constructor(canvas, ctx, mouse) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
        this.dotGrid = null;
    }

    init() {
        this.dotGrid = new DotGrid(30, this.canvas);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.canvas.addEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
    }

    update(dt) {
        this.dotGrid.update(dt, this.mouse);
    }

    draw(ctx) {
        this.dotGrid.draw(ctx);

        ctx.fillStyle = "#ff0000";
        ctx.fillRect(20, 20, 200, 100);
        ctx.fillStyle = "#000000";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Welcome!", 100, 50);
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
    }

    onResize() {
        this.dotGrid = new DotGrid(30, this.canvas);
    }
}
