export class CirclePulse {
    constructor(circle, ringCount = 3, maxRadius = 80, speed = 0.02) {
        this.circle = circle; // reference to CircleSweep
        this.ringCount = ringCount;
        this.maxRadius = maxRadius;
        this.speed = speed;
        this.rings = [];
        this.alpha = 0;

        // initialize rings at slightly different starting radii
        for (let i = 0; i < ringCount; i++) {
            this.rings.push({ radius: circle.radius + i*10, alpha: 1 });
        }
    }

    update(dt) {
        if (!this.circle.completed || this.circle.clicked) return; // stop if clicked

        this.rings.forEach(ring => {
            ring.radius += this.speed * dt;
            ring.alpha = 1 - (ring.radius - this.circle.radius) / (this.maxRadius - this.circle.radius);
            if (ring.radius >= this.maxRadius) {
                ring.radius = this.circle.radius; // reset
                ring.alpha = 1;
            }
        });
    }

    draw(ctx) {
        if (!this.circle.completed || this.circle.clicked) return;

        this.alpha += 0.1*this.speed; // fade in effect
        if (this.alpha > 1) this.alpha = 1;

        ctx.strokeStyle = `rgba(255,255,255,1)`;
        ctx.lineWidth = 1;
        this.rings.forEach(ring => {
            ctx.beginPath();
            ctx.arc(this.circle.x, this.circle.y, ring.radius, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255,255,255,${this.alpha*ring.alpha})`;
            ctx.stroke();
        });
    }
}
