export class DotGrid {
    constructor(spacing, canvas, maincolor) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.maincolor = maincolor;
        this.spacing = spacing;
        this.dots = [];

        this.rotationX = 0;
        this.rotationY = 0;
        this.fov = 600; // distance from camera

        this.initDots();
    }

    initDots() {
        const cols = Math.ceil(this.canvas.width / this.spacing) + 2;
        const rows = Math.ceil(this.canvas.height / this.spacing) + 2;

        this.dots = [];

        for (let i = -1; i < cols; i++) {
            for (let j = -1; j < rows; j++) {
                this.dots.push({
                    x: i * this.spacing - this.canvas.width / 2,
                    y: j * this.spacing - this.canvas.height / 2,
                    z: 0
                });
            }
        }
    }

    rotate(dot, angleX, angleY) {
        // Rotate around X axis
        let y = dot.y * Math.cos(angleX) - dot.z * Math.sin(angleX);
        let z = dot.y * Math.sin(angleX) + dot.z * Math.cos(angleX);
        dot.y = y;
        dot.z = z;

        // Rotate around Y axis
        let x = dot.x * Math.cos(angleY) + dot.z * Math.sin(angleY);
        z = -dot.x * Math.sin(angleY) + dot.z * Math.cos(angleY);
        dot.x = x;
        dot.z = z;
    }

    project(dot) {
        const scale = this.fov / (this.fov + dot.z);
        return {
            x: dot.x * scale + this.canvas.width / 2,
            y: dot.y * scale + this.canvas.height / 2,
            scale
        };
    }

    update(dt, mouse) {
        // Set rotation based on mouse position
        const deltaX = (mouse.x - (mouse.lastX ?? mouse.x));
        const deltaY = (mouse.y - (mouse.lastY ?? mouse.y));

        if(dt && !isNaN(dt)){
            this.rotationY = deltaX * 1e-5 * dt;
            this.rotationX = deltaY * 1e-5 * dt;
        } else {
            this.rotationY = 0;
            this.rotationX = 0;
        }

        // Update last mouse position
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Sort dots by z for proper overlap
        this.dots.sort((a, b) => b.z - a.z);

        this.dots.forEach(dot => {
            this.rotate(dot, this.rotationX, this.rotationY);
            const p = this.project(dot);

            // Size and brightness based on depth
            const radius = 0.5 * p.scale;
            const alpha = Math.min(Math.max(p.scale, 0), 1);

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fill();
        });
    }

    onResize() {
        this.initDots();
    }
}
