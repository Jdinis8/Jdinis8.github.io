// HomeScene.js
import { DotGrid } from './DotGrid.js';

export class HomeScene {
    constructor(canvas, ctx, mouse, maincolor) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.mouse = mouse;
        this.maincolor = maincolor;
        this.dotGrid = null;
    }

    init() {
        this.dotGrid = new DotGrid(30, this.canvas, this.maincolor);
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

        this.Topics(ctx);
    }

    destroy() {
        this.canvas.removeEventListener("mousemove", this.onMouseMove);
    }

    onResize(maincolor) {
        this.dotGrid = new DotGrid(30, this.canvas, maincolor);
    }

Topics(ctx) {
    const rectangles = [
        { text: "GRAVITY", width: 700 },
        { text: "DESIGN", width: 640 },
        { text: "HISTORY", width: 710 }
    ];

    let rectX = -20;
    let rectY = 20;
    const rectHeight = 200;
    const spacing = 20;

    rectangles.forEach(rect => {
        const rectWidth = rect.width;

        // Check if mouse is inside rectangle
        let hovered = this.mouse.x >= rectX &&
                      this.mouse.x <= rectX + rectWidth &&
                      this.mouse.y >= rectY &&
                      this.mouse.y <= rectY + rectHeight;

        // Calculate hover offset
        const offset = hovered ? 10 : 0; // 10px shift when hovered

        // Draw rectangle with hover offset
        ctx.fillStyle = this.maincolor;
        ctx.fillRect(rectX, rectY, rectWidth + offset, rectHeight);

        // Save state and clip
        ctx.save();
        ctx.beginPath();
        ctx.rect(rectX, rectY, rectWidth + offset, rectHeight);
        ctx.clip();

        // Draw centered text
        ctx.fillStyle = "#000000";
        ctx.font = "140px 'Raleway', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textX = rectX + rectWidth / 2 + offset;
        const textY = rectY + rectHeight / 2;
        ctx.fillText(rect.text, textX, textY);

        ctx.restore();

        // Move rectY down for next rectangle
        rectY += rectHeight + spacing;
        });
    }
}
