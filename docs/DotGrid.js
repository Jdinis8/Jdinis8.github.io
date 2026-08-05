// DotGrid.js

export class DotGrid {
    constructor({
        spacing,
        canvas,
        depth = 0,
        opacity = 1,
        rotationStrength = 0.1
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

        this.rotation = {
            x: 0,
            y: 0
        };

        this.rotationTarget = {
            x: 0,
            y: 0
        };

        this.scrollRotation = 0;

        /*
        * Mouse spotlight settings.
        *
        * ambientVisibility:
        *   Visibility of dots far away from the pointer.
        *
        * spotlightRadius:
        *   Approximate size of the visible area around the pointer.
        *
        * spotlightInnerRatio:
        *   Portion of the radius that remains fully visible.
        */
        this.ambientVisibility = 0.08;
        this.spotlightRadius = 260;
        this.spotlightInnerRatio = 0.2;

        this.initDots();
    }

    /*
     * Return the appropriate foreground and accent colors
     * for the currently active page theme.
     *
     * Because draw() runs continuously, the colors change
     * immediately after data-theme is updated.
     */
    getThemePalette() {
        const isLight =
            document.documentElement.dataset.theme ===
            "light";

        if (isLight) {
            return {
                foreground: {
                    r: 0,
                    g: 0,
                    b: 0
                },

                /*
                 * Darker cyan-blue for visibility against
                 * the white background.
                 */
                accent: {
                    r: 20,
                    g: 105,
                    b: 165
                }
            };
        }

        return {
            foreground: {
                r: 255,
                g: 255,
                b: 255
            },

            accent: {
                r: 100,
                g: 200,
                b: 255
            }
        };
    }

    initDots() {
        const cols =
            Math.ceil(
                this.canvas.width /
                this.spacing
            ) + 2;

        const rows =
            Math.ceil(
                this.canvas.height /
                this.spacing
            ) + 2;

        this.dots.length = 0;

        for (
            let i = -1;
            i < cols;
            i += 1
        ) {
            for (
                let j = -1;
                j < rows;
                j += 1
            ) {
                const x =
                    i * this.spacing -
                    this.canvas.width / 2;

                const y =
                    j * this.spacing -
                    this.canvas.height / 2;

                const z =
                    this.depth;

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
        if (
            !dt ||
            Number.isNaN(dt)
        ) {
            return;
        }

        const cx =
            Math.max(
                1,
                this.canvas.width / 2
            );

        const cy =
            Math.max(
                1,
                this.canvas.height / 2
            );

        /*
         * Rotation target from the pointer and scrolling.
         */
        const mx =
            (
                mouse.x -
                cx
            ) /
            cx;

        const my =
            (
                mouse.y -
                cy
            ) /
            cy;

        this.rotationTarget.y =
            mx *
            0.6 *
            this.rotationStrength +
            this.scrollRotation;

        this.rotationTarget.x =
            my *
            0.6 *
            this.rotationStrength;

        /*
         * Ease toward the rotation target.
         */
        this.rotation.x +=
            (
                this.rotationTarget.x -
                this.rotation.x
            ) *
            0.005;

        this.rotation.y +=
            (
                this.rotationTarget.y -
                this.rotation.y
            ) *
            0.005;

        /*
         * Dot physics.
         */
        const minimumDimension =
            Math.min(
                this.canvas.width,
                this.canvas.height
            );

        /*
         * The pointer-attraction radius scales slightly
         * with the viewport while remaining within useful
         * limits.
         */
        const pullRadius =
            Math.min(
                220,
                Math.max(
                    120,
                    minimumDimension * 0.3
                )
            );

        const spring = 0.015;
        const damping = 0.9;

        const mxWorld =
            mouse.x -
            cx;

        const myWorld =
            mouse.y -
            cy;

        this.dots.forEach(dot => {
            const dx =
                mxWorld -
                dot.x;

            const dy =
                myWorld -
                dot.y;

            const dist =
                Math.hypot(
                    dx,
                    dy
                ) +
                0.001;

            /*
            * Attract dots toward the pointer, but prevent them from
            * collapsing into one large dot at the exact pointer position.
            */
            const exclusionRadius = 28;

            if (dist < pullRadius) {
                if (dist > exclusionRadius) {
                    /*
                    * Normal attraction outside the exclusion zone.
                    */
                    const normalizedDistance =
                        (
                            dist -
                            exclusionRadius
                        ) /
                        (
                            pullRadius -
                            exclusionRadius
                        );

                    const force =
                        (
                            1 -
                            normalizedDistance
                        ) *
                        0.35;

                    dot.vx +=
                        (
                            dx /
                            dist
                        ) *
                        force;

                    dot.vy +=
                        (
                            dy /
                            dist
                        ) *
                        force;
                } else {
                    /*
                    * Slightly repel dots that enter the exclusion zone.
                    * This prevents them from overlapping beneath the mouse.
                    */
                    const repulsion =
                        (
                            1 -
                            dist /
                            exclusionRadius
                        ) *
                        0.35;

                    dot.vx -=
                        (
                            dx /
                            dist
                        ) *
                        repulsion;

                    dot.vy -=
                        (
                            dy /
                            dist
                        ) *
                        repulsion;
                }
            }

            /*
             * Spring the dots back toward their initial
             * positions.
             */
            dot.vx +=
                (
                    dot.ox -
                    dot.x
                ) *
                spring;

            dot.vy +=
                (
                    dot.oy -
                    dot.y
                ) *
                spring;

            dot.vz +=
                (
                    dot.oz -
                    dot.z
                ) *
                spring;

            /*
             * Damping.
             */
            dot.vx *= damping;
            dot.vy *= damping;
            dot.vz *= damping;

            dot.x += dot.vx;
            dot.y += dot.vy;
            dot.z += dot.vz;

            /*
             * Rare, deliberate flashes.
             */
            if (
                dot.flash < 0.01 &&
                Math.random() <
                    0.00025
            ) {
                dot.flash = 1;
            }

            /*
             * Slow flash decay.
             */
            dot.flash *= 0.965;
        });

        /*
         * Lines from nearby dots to the pointer.
         * Only shown while the pointer is moving.
         */
        this.activeLines.length = 0;

        const speed =
            Math.hypot(
                mouse.vx || 0,
                mouse.vy || 0
            );

        if (speed < 1.2) {
            return;
        }

        const candidates = [];

        this.dots.forEach(dot => {
            const dx =
                dot.x -
                mxWorld;

            const dy =
                dot.y -
                myWorld;

            const dist =
                Math.hypot(
                    dx,
                    dy
                );

            if (dist < 140) {
                candidates.push({
                    dot,
                    dist
                });
            }
        });

        candidates
            .sort(
                (a, b) =>
                    a.dist -
                    b.dist
            )
            .slice(0, 4)
            .forEach(candidate => {
                this.activeLines.push({
                    dot:
                        candidate.dot,

                    strength:
                        1 -
                        candidate.dist /
                        140
                });
            });
    }

    project(dot) {
        let x = dot.x;
        let y = dot.y;
        let z = dot.z;

        /*
         * Rotate around the X axis.
         */
        const cosX =
            Math.cos(
                this.rotation.x
            );

        const sinX =
            Math.sin(
                this.rotation.x
            );

        const y1 =
            y * cosX -
            z * sinX;

        const z1 =
            y * sinX +
            z * cosX;

        /*
         * Rotate around the Y axis.
         */
        const cosY =
            Math.cos(
                this.rotation.y
            );

        const sinY =
            Math.sin(
                this.rotation.y
            );

        const x1 =
            x * cosY +
            z1 * sinY;

        const z2 =
            -x * sinY +
            z1 * cosY;

        const denominator =
            Math.max(
                1,
                this.fov +
                z2
            );

        const scale =
            this.fov /
            denominator;

        return {
            x:
                x1 * scale +
                this.canvas.width / 2,

            y:
                y1 * scale +
                this.canvas.height / 2,

            scale
        };
    }

    smoothstep(value) {
        const t = Math.min(
            1,
            Math.max(0, value)
        );

        return t * t * (3 - 2 * t);
    }

    draw(ctx, mouse) {
        const {
            foreground,
            accent
        } = this.getThemePalette();

        const now =
            performance.now();

        /*
         * Draw interaction lines first so the dots remain
         * visually on top of them.
         */
        this.activeLines.forEach(link => {
            const projected =
                this.project(
                    link.dot
                );

            const alpha =
                link.strength *
                0.18 *
                this.opacity;

            ctx.beginPath();

            ctx.moveTo(
                projected.x,
                projected.y
            );

            ctx.lineTo(
                mouse.x +
                    Math.sin(
                        now * 0.002
                    ) *
                    1.5,

                mouse.y +
                    Math.cos(
                        now * 0.002
                    ) *
                    1.5
            );

            ctx.strokeStyle =
                `rgba(` +
                `${accent.r},` +
                `${accent.g},` +
                `${accent.b},` +
                `${alpha})`;

            ctx.lineWidth = 1;

            ctx.stroke();
        });

        /*
         * Draw the dot field.
         */
        this.dots.forEach(dot => {
            const projected =
                this.project(dot);

            const depthAlpha =
                Math.min(
                    Math.max(
                        projected.scale,
                        0
                    ),
                    1
                );

            const responsiveRadius =
                Math.min(
                    this.spotlightRadius,
                    Math.max(
                        150,
                        Math.min(
                            this.canvas.width,
                            this.canvas.height
                        ) * 0.4
                    )
                );

            const innerRadius =
                responsiveRadius *
                this.spotlightInnerRatio;

            const pointerDistance =
                Math.hypot(
                    projected.x - mouse.x,
                    projected.y - mouse.y
                );

            const fadeProgress =
                (
                    pointerDistance -
                    innerRadius
                ) /
                Math.max(
                    1,
                    responsiveRadius -
                    innerRadius
                );

            const fade =
                1 -
                this.smoothstep(
                    fadeProgress
                );

            const spotlightVisibility =
                this.ambientVisibility +
                (
                    1 -
                    this.ambientVisibility
                ) *
                fade;

            const alpha =
                this.opacity *
                depthAlpha *
                (
                    0.4 +
                    dot.flash * 0.6
                ) *
                spotlightVisibility;

            const radius =
                0.5 *
                projected.scale *
                (
                    3 +
                    dot.flash * 1.5
                );

            const baseTint = 0.4;

            const depthTint =
                Math.min(
                    1,
                    Math.max(
                        0,
                        baseTint *
                        projected.scale
                    )
                );

            let r;
            let g;
            let b;

            if (dot.flash > 0.01) {
                r = accent.r;
                g = accent.g;
                b = accent.b;
            } else {
                r = Math.round(
                    foreground.r *
                        (1 - depthTint) +
                    accent.r *
                        depthTint
                );

                g = Math.round(
                    foreground.g *
                        (1 - depthTint) +
                    accent.g *
                        depthTint
                );

                b = Math.round(
                    foreground.b *
                        (1 - depthTint) +
                    accent.b *
                        depthTint
                );
            }

            ctx.beginPath();

            ctx.arc(
                projected.x,
                projected.y,
                Math.max(0, radius),
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(${r},${g},${b},${alpha})`;

            ctx.fill();
        });
    }

    onResize() {
        this.initDots();
    }
}
