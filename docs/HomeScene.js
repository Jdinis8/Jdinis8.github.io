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
        this.dotGrid = new DotGrid(30,30);
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
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
    }
}
