// IntroScene.js
import { CircleSweep } from './IntroScene/CircleSweep.js';
import { CirclePulse } from './IntroScene/CirclePulse.js';
import { DiagonalRectangle } from './IntroScene/DiagonalRectangle.js';

export class IntroScene {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {(done:boolean)=>void} onComplete - callback called when intro finishes
     */
    constructor(canvas, ctx, onComplete = () => {}) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onComplete = onComplete;

        this.circle = null;
        this.circlePulse = null;
        this.diagonalRect = null;

        this.blurRemoved = false;
        this.completed = false;

        // event handler singletons
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);

        // button handler reference (so removeEventListener works)
        this.boundOnButtonClick = null;
        this.button = null;
    }

    /**
     * Initialize the intro. Pass the blur overlay element (so we can wait for animationend)
     * and optionally call site-wide setup here.
     */
    init(blurOverlay) {
        const canvas = this.canvas;

        this.circle = new CircleSweep(canvas.width / 2, canvas.height / 2, 50, "#ffffff", "DDD");
        this.circlePulse = new CirclePulse(this.circle);
        this.diagonalRect = new DiagonalRectangle(this.circle, 5, 5);

        // Canvas / window listeners
        canvas.addEventListener("mousemove", this.onMouseMove);
        canvas.addEventListener("click", this.onClick);
        window.addEventListener("keydown", this.onKeyDown);

        // Wait for blur overlay animation to finish, then remove it and enable intro
        if (blurOverlay) {
            const onAnimEnd = () => {
                blurOverlay.removeEventListener("animationend", onAnimEnd);
                if (blurOverlay.parentElement) blurOverlay.remove();
                this.blurRemoved = true;
            };
            blurOverlay.addEventListener("animationend", onAnimEnd);
        } else {
            // If overlay isn't provided, enable immediately
            this.blurRemoved = true;
        }

        // Setup skip button and handler (store bound reference)
        this.button = document.getElementById("skip-button");
        if (this.button) {
            this.boundOnButtonClick = this.onButtonClick.bind(this);
            this.button.addEventListener("click", this.boundOnButtonClick);
            // show button
            this.button.classList.add("visible");
        }
    }

    onButtonClick(e) {
        // mark completed and call callback immediately
        this.completed = true;

        // safeguard: remove listener/DOM entry right away
        if (this.button && this.boundOnButtonClick) {
            try {
                this.button.removeEventListener("click", this.boundOnButtonClick);
            } catch (err) { /* ignore */ }
            // hide instead of immediate remove to avoid race conditions with CSS/overlay
            this.button.classList.remove("visible");
            // remove after short delay so UI can update
            setTimeout(() => {
                if (this.button && this.button.parentElement) {
                    this.button.remove();
                }
                this.button = null;
                this.boundOnButtonClick = null;
            }, 60);
        }

        // Notify the app immediately
        try { this.onComplete(true); } catch (err) { /* noop */ }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (!this.circle) return;
        const dx = mouseX - this.circle.x;
        const dy = mouseY - this.circle.y;
        const dist = Math.hypot(dx, dy);

        this.circle.hovered = dist <= this.circle.radius && this.circle.completed;

        this.canvas.style.cursor =
            (dist <= this.circle.radius && !this.circle.clicked && this.circle.completed)
                ? "pointer"
                : "default";
    }

    onKeyDown(e) {
        // Prevent page scroll on space etc
        if (e && e.code) {
            e.preventDefault();
            if (!this.completed && this.circle) {
                this.circle.clicked = true;
            }
        }
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (!this.circle) return;
        const dx = mouseX - this.circle.x;
        const dy = mouseY - this.circle.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= this.circle.radius && this.circle.completed) {
            this.circle.clicked = true;
        }
    }

    update(dt) {
        if (!this.blurRemoved) return;

        if (this.diagonalRect) this.diagonalRect.update(dt);
        if (this.circle) this.circle.update(dt);
        if (this.circlePulse) this.circlePulse.update(dt);

        if (this.diagonalRect && this.diagonalRect.completed) {
            // mark complete and notify main
            this.completed = true;
            try { this.onComplete(true); } catch (err) { /* noop */ }
        }
    }

    draw(ctx) {
        const canvas = this.canvas;

        if (this.diagonalRect && !this.diagonalRect.completed) {
            ctx.fillStyle = "#000000";
            if (!this.diagonalRect.rotating) {
                ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
                ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
            } else {
                ctx.fillRect(0, -this.diagonalRect.splitOffset, canvas.width, canvas.height / 2);
                ctx.fillRect(0, canvas.height / 2 + this.diagonalRect.splitOffset, canvas.width, canvas.height / 2);
            }
        }

        if (!this.blurRemoved) return;

        if (this.diagonalRect) this.diagonalRect.draw(ctx);
        if (this.circle) this.circle.draw(ctx);
        if (this.circlePulse) this.circlePulse.draw(ctx);
    }

    destroy() {
        // remove event listeners
        if (this.canvas) {
            this.canvas.removeEventListener("mousemove", this.onMouseMove);
            this.canvas.removeEventListener("click", this.onClick);
        }
        window.removeEventListener("keydown", this.onKeyDown);

        this.canvas.style.cursor = "default";

        // remove skip button safely
        if (this.button && this.boundOnButtonClick) {
            try {
                this.button.removeEventListener("click", this.boundOnButtonClick);
            } catch (err) { /* ignore */ }
            if (this.button.parentElement) this.button.remove();
            this.button = null;
            this.boundOnButtonClick = null;
        }
    }

    onResize() {
        if (this.circle) {
            this.circle.x = this.canvas.width / 2;
            this.circle.y = this.canvas.height / 2;
        }
    }
}
