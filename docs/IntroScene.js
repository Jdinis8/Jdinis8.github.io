// IntroScene.js
import { CircleSweep } from './IntroScene/CircleSweep.js'
import { CirclePulse } from './IntroScene/CirclePulse.js';
import { DiagonalRectangle } from './IntroScene/DiagonalRectangle.js'
export class IntroScene {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        this.circle = null;
        this.circlePulse = null;
        this.diagonalRect = null;

        this.blur_removed = false;

        // bind event handlers
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);

        // completed flag
        this.completed = false;
    }

    init(blurOverlay) {
        const canvas = this.canvas;

        this.circle = new CircleSweep(canvas.width/2, canvas.height/2, 50, "#ffffff", "DDD");
        this.circlePulse = new CirclePulse(this.circle);
        this.diagonalRect = new DiagonalRectangle(this.circle, 5, 5);

        // attach event listeners
        canvas.addEventListener("mousemove", this.onMouseMove);
        canvas.addEventListener("click", this.onClick);

        blurOverlay.addEventListener("animationend", () => {
            blurOverlay.remove();
            this.blur_removed = true;
        });
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - this.circle.x;
        const dy = mouseY - this.circle.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        this.circle.hovered = dist <= this.circle.radius && this.circle.completed;

        this.canvas.style.cursor =
            (dist <= this.circle.radius && !this.circle.clicked && this.circle.completed)
                ? "pointer"
                : "default";
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - this.circle.x;
        const dy = mouseY - this.circle.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist <= this.circle.radius && this.circle.completed) {
            this.circle.clicked = true;
        }
    }

    update(dt) {
        if (!this.blur_removed) return;

        this.diagonalRect.update(dt);
        this.circle.update(dt);
        this.circlePulse.update(dt);

        if(this.diagonalRect.completed) {
            this.completed = true; // signal to main scene that intro is done
        }
    }

    draw(ctx) {
        if (!this.diagonalRect.completed){
            if (!this.diagonalRect.rotating){
                ctx.fillStyle = "#000000";
                ctx.fillRect(0,0,canvas.width,canvas.height/2);
                ctx.fillRect(0,canvas.height/2,canvas.width,canvas.height/2);
            } else {
                ctx.fillStyle = "#000000";
                ctx.fillRect(0,-this.diagonalRect.splitOffset,canvas.width,canvas.height/2);
                ctx.fillRect(0,canvas.height/2+this.diagonalRect.splitOffset,canvas.width,canvas.height/2);
            }
        }

        if (!this.blur_removed) return;

        this.diagonalRect.draw(ctx);
        this.circle.draw(ctx);
        this.circlePulse.draw(ctx);
    }

    destroy() {
        // remove event listeners
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
        this.canvas.removeEventListener("click", this.onClick);
        this.canvas.style.cursor = "default";
    }
}
