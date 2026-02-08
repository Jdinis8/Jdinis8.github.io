//This is the first circle that shows up when the page loads, it sweeps around and then fills in with the text "DDD" in the center.

export class CircleSweep {
    constructor(x, y, radius, color, text) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.currentRadius = radius;
        this.color = color;
        this.text = text;

        this.angle = 0;
        this.fillProgress = 0;
        this.sweepSpeed = 0.004;
        this.fillSpeed = 0.001;
        this.completed = false;
        this.clicked = false;

        this.hovered = false;
    }

    update(dt) {
        if (this.completed) return;

        if (this.angle < Math.PI*2 - this.sweepSpeed*2) {
            this.angle += (Math.PI*2 - this.angle) * this.sweepSpeed * dt;
        } else if (this.angle > Math.PI * 2 - this.sweepSpeed*2 && this.angle < Math.PI * 2) {
            this.angle += this.sweepSpeed * dt;
        } else {
            this.angle = Math.PI*2;
            if (this.fillProgress < 1) {
                this.fillProgress += this.fillSpeed * dt;
            } else {
                this.completed = true;
            }
        }
    }

    draw(ctx) {

        this.currentRadius ??= this.radius;
        const target = this.hovered ? this.radius * 1.05 : this.radius;
        this.currentRadius += (target - this.currentRadius) * 0.15;

        // Pie sweep
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.currentRadius, -Math.PI/2, this.angle - Math.PI/2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();

        // Text fade-in with fill
        if (this.fillProgress > 0) {
            const alpha = this.fillProgress ** 2; // smooth easing
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 20px 'Courier New', monospace";
            ctx.fillText(this.text, this.x, this.y);
        }
    }
}