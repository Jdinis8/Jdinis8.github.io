export class UIOverlay {
    constructor(canvas) {
        this.canvas = canvas;

        this.center = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };

        this.fade = 0;
        this.rotation = 0;

        this.sections = [
            { label: "Research", angle: -Math.PI * 0.75, url: "research.html" },
            { label: "Design", angle: 0, url: "design.html" },
            { label: "History", angle: Math.PI * 0.75, url: "history.html" }
        ];

        this.mouse = { x: this.center.x, y: this.center.y };

        this.setupClickHandler();
    }

    resize() {
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;
    }

    update(mouse) {
        this.mouse = mouse;

        if (this.fade < 1) this.fade += 0.005;

        this.rotation += 0.0004; // slower rotation for calm feel
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.center.x, this.center.y);

        this.drawDeformedRing(ctx);
        this.drawName(ctx);
        this.drawSubtitle(ctx);
        this.drawSections(ctx);

        ctx.restore();
    }

    drawDeformedRing(ctx) {
        const baseRadius = 180;
        const segments = 160;

        const mouseDx = this.mouse.x - this.center.x;
        const mouseDy = this.mouse.y - this.center.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        const mouseAngle = Math.atan2(mouseDy, mouseDx);

        ctx.save();
        ctx.rotate(this.rotation);

        ctx.beginPath();

        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * Math.PI * 2;

            // how aligned this segment is with mouse direction
            let angleDiff = t - mouseAngle - this.rotation;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const alignment = Math.cos(angleDiff);

            // deformation strength
            const deform =
                alignment *
                Math.min(20, mouseDist * 0.03) *
                0.6;

            const radius = baseRadius + deform;

            const x = Math.cos(t) * radius;
            const y = Math.sin(t) * radius;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.strokeStyle = `rgba(255,255,255,${0.08 * this.fade})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawName(ctx) {
        ctx.font = "300 36px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(245,245,245,${this.fade})`;

        ctx.fillText("JOÃO DINIS ÁLVARES", 0, -10);
    }

    drawSubtitle(ctx) {
        ctx.font = "14px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(255,255,255,${0.5 * this.fade})`;

        ctx.fillText(
            "Black holes · Graphic design · Preserving memory",
            0,
            30
        );
    }

    drawSections(ctx) {
        ctx.font = "13px 'Courier New', monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const radius = 360;
        let hoveringAny = false;

        this.sections.forEach(section => {
            // base position relative to translated origin (center)
            const x = Math.cos(section.angle) * radius;
            const y = Math.sin(section.angle) * radius;

            // angle between center -> mouse and center -> this section
            const mouseAngle = Math.atan2(
                this.mouse.y - this.center.y,
                this.mouse.x - this.center.x
            );

            let angleDiff = mouseAngle - section.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // raw hover strength based on angular proximity (0..1)
            const hoverStrength = Math.max(0, 1 - Math.abs(angleDiff) / 0.2);

            // smooth the hover value for animation
            section.hover = section.hover || 0;
            section.hover += (hoverStrength - section.hover) * 0.12;

            // decide if we consider it hovered enough to show pointer / underline
            const isEffectivelyHovered = section.hover > 0.22;
            if (section.hover > 0.02) hoveringAny = true;

            // outward shift (calm)
            const shift = section.hover * 6;
            const drawX = Math.cos(section.angle) * (radius + shift);
            const drawY = Math.sin(section.angle) * (radius + shift);

            // prepare glow when hovered
            if (section.hover > 0.01) {
                ctx.save();
                ctx.shadowBlur = 20 * section.hover;
                ctx.shadowColor = `rgba(255,255,255,${0.22 * section.hover})`;
            }

            ctx.fillStyle = `rgba(255,255,255,${(0.2 + section.hover * 0.6) * this.fade})`;
            ctx.fillText(section.label, drawX, drawY);

            if (section.hover > 0.01) ctx.restore();

            // draw underline softly when hovered
            if (isEffectivelyHovered) {
                const textWidth = ctx.measureText(section.label).width;
                ctx.beginPath();
                ctx.moveTo(drawX - textWidth / 2, drawY + 12);
                ctx.lineTo(drawX + textWidth / 2, drawY + 12);
                ctx.strokeStyle = `rgba(255,255,255,${0.65 * section.hover * this.fade})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // expose active state for click handlers
            // tune the threshold (0.5) if you want more/less strictness
            section.isActive = section.hover > 0.5;
        });

        // update cursor (pointer when any section has visible hover)
        this.canvas.style.cursor = hoveringAny ? "pointer" : "default";
    }

    setupClickHandler() {
    this.canvas.addEventListener('click', () => {
        // Find if the user is currently hovering/interacting with a section
        const activeSection = this.sections.find(section => section.isActive);
        
        if (activeSection && activeSection.url) {
            // Smoothly redirect to the page
            window.location.href = activeSection.url;
        }
    });
}
}