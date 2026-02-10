// DotGrid.js
export class DotGrid {
    constructor({
        spacing,
        canvas,
        depth = 0,
        opacity = 1,
        rotationStrength = 1
    }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.spacing = spacing;
        this.depth = depth;
        this.opacity = opacity;
        this.rotationStrength = rotationStrength;

        this.fov = 700;

        this.dots = [];
        this.activeLines = [];

        this.rotation = { x: 0, y: 0 };
        this.rotationTarget = { x: 0, y: 0 };

        this.scrollRotation = 0;

        this.initDots();
    }

    initDots() {
        const cols = Math.ceil(this.canvas.width / this.spacing) + 2;
        const rows = Math.ceil(this.canvas.height / this.spacing) + 2;

        this.dots.length = 0;

        for (let i = -1; i < cols; i++) {
            for (let j = -1; j < rows; j++) {
                const x = i * this.spacing - this.canvas.width / 2;
                const y = j * this.spacing - this.canvas.height / 2;
                const z = this.depth;

                this.dots.push({
                    ox: x,
                    oy: y,
                    oz: z,
                    x,
                    y,
                    z,
                    vx: 0,
                    vy: 0,
                    vz: 0,
                    flash: 0
                });
            }
        }
    }

    update(dt, mouse) {
        if (!dt || isNaN(dt)) return;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // --- ROTATION TARGET (mouse + scroll)
        const mx = (mouse.x - cx) / cx;
        const my = (mouse.y - cy) / cy;

        this.rotationTarget.y =
            mx * 0.6 * this.rotationStrength + this.scrollRotation;

        this.rotationTarget.x =
            my * 0.6 * this.rotationStrength;

        // Ease rotation
        this.rotation.x += (this.rotationTarget.x - this.rotation.x) * 0.005;
        this.rotation.y += (this.rotationTarget.y - this.rotation.y) * 0.005;

        // --- DOT PHYSICS
        const pullRadius = 220;
        const spring = 0.015;
        const damping = 0.9;

        const mxWorld = mouse.x - cx;
        const myWorld = mouse.y - cy;

        this.dots.forEach(dot => {
            const dx = mxWorld - dot.x;
            const dy = myWorld - dot.y;
            const dist = Math.hypot(dx, dy) + 0.001;

            // Gravity toward mouse
            if (dist < pullRadius) {
                const force = (1 - dist / pullRadius) * 0.6;
                dot.vx += (dx / dist) * force;
                dot.vy += (dy / dist) * force;
            }

            // Spring back to origin
            dot.vx += (dot.ox - dot.x) * spring;
            dot.vy += (dot.oy - dot.y) * spring;
            dot.vz += (dot.oz - dot.z) * spring;

            // Damping
            dot.vx *= damping;
            dot.vy *= damping;
            dot.vz *= damping;

            dot.x += dot.vx;
            dot.y += dot.vy;
            dot.z += dot.vz;

            // Rare, deliberate flashes
            if (dot.flash < 0.01 && Math.random() < 0.00025) {
                dot.flash = 1;
            }

            // Slow decay
            dot.flash *= 0.965;
        });

        // --- DOT → MOUSE LINES (interaction only)
        this.activeLines.length = 0;

        const speed = Math.hypot(mouse.vx || 0, mouse.vy || 0);
        if (speed < 1.2) return;

        const candidates = [];

        this.dots.forEach(dot => {
            const dx = dot.x - mxWorld;
            const dy = dot.y - myWorld;
            const dist = Math.hypot(dx, dy);

            if (dist < 140) {
                candidates.push({ dot, dist });
            }
        });

        candidates
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 4)
            .forEach(c => {
                this.activeLines.push({
                    dot: c.dot,
                    strength: 1 - c.dist / 140
                });
            });
    }

    project(dot) {
        let x = dot.x;
        let y = dot.y;
        let z = dot.z;

        // Rotate X
        const cy = Math.cos(this.rotation.x);
        const sy = Math.sin(this.rotation.x);
        const y1 = y * cy - z * sy;
        const z1 = y * sy + z * cy;

        // Rotate Y
        const cx = Math.cos(this.rotation.y);
        const sx = Math.sin(this.rotation.y);
        const x1 = x * cx + z1 * sx;
        const z2 = -x * sx + z1 * cx;

        const scale = this.fov / (this.fov + z2);

        return {
            x: x1 * scale + this.canvas.width / 2,
            y: y1 * scale + this.canvas.height / 2,
            scale
        };
    }

    draw(ctx, mouse) {
        const ACCENT = { r: 100, g: 200, b: 255 };

        // --- Lines first
        this.activeLines.forEach(link => {
            const p = this.project(link.dot);
            const alpha = link.strength * 0.18 * this.opacity;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(
                mouse.x + Math.sin(performance.now() * 0.002) * 1.5,
                mouse.y + Math.cos(performance.now() * 0.002) * 1.5
            );
            ctx.strokeStyle = `rgba(100,200,255,${alpha})`;
            ctx.stroke();
        });

        // --- Dots
        this.dots.forEach(dot => {
            const p = this.project(dot);

            const depthAlpha = Math.min(Math.max(p.scale, 0), 1);
            const alpha =
                this.opacity *
                depthAlpha *
                (0.4 + dot.flash * 0.6);

            const radius =
                0.5 * p.scale * (2 + dot.flash * 1.5);

            const baseTint = 0.4; // 6% accent tint
            const depthTint = baseTint * p.scale;

            const r = dot.flash > 0.01
                ? 100
                : Math.round(255 * (1 - depthTint) + 100 * depthTint);

            const g = dot.flash > 0.01
                ? 200
                : Math.round(255 * (1 - depthTint) + 200 * depthTint);

            const b = dot.flash > 0.01
                ? 255
                : Math.round(255 * (1 - depthTint) + 255 * depthTint);

            const color = `rgba(${r},${g},${b},${alpha})`;

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
    }

    onResize() {
        this.initDots();
    }
}
