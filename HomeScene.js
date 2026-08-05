// HomeScene.js
import { DotGrid } from "./DotGrid.js";
import { UIOverlay } from "./UIOverlay.js";

export class HomeScene {
    constructor(canvas, ctx, mouse) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixelRatio = 1;
        
        this.mouse = mouse;

        this.layers = [];

        this.ui = new UIOverlay(canvas);
    }

    init() {
        this.layers = [
            new DotGrid({
                spacing: 25,
                canvas: this.canvas,
                depth: -250,
                opacity: 0.1,
                rotationStrength: 0.001
            }),
            new DotGrid({
                spacing: 40,
                canvas: this.canvas,
                depth: 0,
                opacity: 0.5,
                rotationStrength: 0.01
            }),
        ];

        this.onMouseMove = this.onMouseMove.bind(this);

        this.canvas.addEventListener("pointermove", this.onMouseMove, { passive: true });
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

    update(dt) {
        this.layers.forEach(layer => {
            layer.update(dt, this.mouse);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.layers.forEach(layer => layer.draw(this.ctx, this.mouse));
        
        // update & draw UI overlay
        this.ui.update(this.mouse);
        this.ui.draw(this.ctx);
    }

    destroy() {
        this.canvas.removeEventListener("pointermove", this.onMouseMove);
        this.ui.destroy();
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        /*
        * High-resolution phones commonly have a pixel ratio
        * of 2 or 3. Limiting it to 2 keeps the text sharp
        * without making the animation excessively expensive.
        */
        const pixelRatio = Math.min(
            window.devicePixelRatio || 1,
            2
        );

        const canvasWidth = Math.round(
            width * pixelRatio
        );

        const canvasHeight = Math.round(
            height * pixelRatio
        );

        if (
            this.width === width &&
            this.height === height &&
            this.pixelRatio === pixelRatio &&
            this.canvas.width === canvasWidth &&
            this.canvas.height === canvasHeight
        ) {
            return;
        }

        /*
        * Store the visible dimensions separately.
        * canvas.width and canvas.height will contain the
        * enlarged internal bitmap dimensions.
        */
        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;

        /*
        * Visible CSS dimensions.
        */
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;

        /*
        * Internal high-resolution canvas dimensions.
        */
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        /*
        * Draw using normal screen coordinates even though
        * the internal canvas is higher resolution.
        */
        this.ctx.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );

        /*
        * Resize the interface and dot layers only after
        * the canvas dimensions have been configured.
        */
        this.ui.resize();

        this.layers.forEach(layer => {
            layer.onResize?.();
        });
    }
}
