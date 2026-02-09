export class CirclePulse {
    constructor(circle, ringCount = 4, maxRadius = 80, speed = 0.02) {
        this.circle = circle;

        // pulsing rings
        this.rings = [];
        this.ringCount = ringCount;
        this.speed = speed;
        this.maxRadius = maxRadius;
        this.alpha = 0;

        for (let i = 0; i < ringCount; i++) {
            this.rings.push({ radius: circle.radius + i*10, alpha: 1 });
        }

        // Text sequence
        this.texts = [
            { content: "Welcome", duration: 2000 },          // show for 2s
            { content: "Click on the sphere", duration: 2000 }, // show for 3s
            { content: "or press any key to skip", duration: 3000 } // show for 3s
        ];
        this.currentTextIndex = 0;
        this.textTimer = 0;
        this.textAlpha = 0;
        this.fadingOut = false;
    }

    update(dt) {
        if (!this.circle.completed || this.circle.clicked) return;

        // Update rings
        this.rings.forEach(ring => {
            ring.radius += this.speed * dt;
            ring.alpha = 1 - (ring.radius - this.circle.radius) / (this.maxRadius - this.circle.radius);
            if (ring.radius >= this.maxRadius) {
                ring.radius = this.circle.radius; // reset
                ring.alpha = 1;
            }
        });

        // Handle text timer
        if (this.currentTextIndex < this.texts.length) {
            const current = this.texts[this.currentTextIndex];
            this.textTimer += dt;

            // Fade in/out
            const fadeDuration = 500; // ms
            if (!this.fadingOut) {
                // fade in
                this.textAlpha += dt / fadeDuration;
                if (this.textAlpha > 1) this.textAlpha = 1;
            }

            if (this.textTimer >= current.duration) {
                // Start fade out
                this.fadingOut = true;
                this.textAlpha -= dt / fadeDuration;
                if (this.textAlpha <= 0) {
                    this.textAlpha = 0;
                    this.fadingOut = false;
                    this.currentTextIndex++;  // move to next text
                    this.textTimer = 0;
                }
            }
        }
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

        // Draw text
        if (this.currentTextIndex < this.texts.length) {
            ctx.fillStyle = `rgba(255,255,255,${this.textAlpha})`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 13px 'Courier New', monospace";
            ctx.fillText(this.texts[this.currentTextIndex].content, this.circle.x, this.circle.y - this.circle.radius - 50);
        }
    }
}
