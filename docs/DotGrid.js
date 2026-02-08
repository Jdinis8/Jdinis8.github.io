export class DotGrid {
    constructor(countX, countY) {
        this.dots = [];
        for (let i = 0; i <= countX; i++) {
            for (let j = 0; j <= countY; j++) {
                this.dots.push({
                    x: i * canvas.width / countX,
                    y: j * canvas.height / countY,
                    vx: 0,
                    vy: 0
                });
            }
        }
    }

    update(dt, mouse) {
        this.dots.forEach(dot => {
            const dx = dot.x - mouse.x;
            const dy = dot.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            const force = Math.min(150 / dist, 3);

            dot.vx += (dx/dist) * force * dt * 0.0001;
            dot.vy += (dy/dist) * force * dt * 0.0001;
            dot.vx *= 0.9;
            dot.vy *= 0.9;
            dot.x += dot.vx * dt;
            dot.y += dot.vy * dt;
        });
    }

    draw(ctx) {
        this.dots.forEach(dot => {
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, 2, 0, Math.PI*2);
            ctx.fillStyle = "#ff0000";
            ctx.fill();
        });
    }
}