/*
 * Animation speeds are per millisecond, so the opening looks
 * the same on every display refresh rate.
 */
const FADE_DURATION = 1000;
const ROTATION_SPEED = 0.000024;

export class UIOverlay {
    constructor(canvas) {
        this.canvas = canvas;

        this.center = {
            x: canvas.clientWidth / 2,
            y: canvas.clientHeight / 2
        };

        this.fade = 0;
        this.rotation = 0;

        /*
         * These are the only navigation links displayed
         * by this overlay. Each label is drawn on the canvas
         * and the matching link from the page's navigation is
         * kept on top of it, so it behaves like any other link.
         */
        const linkElements =
            document.querySelectorAll(
                ".home-fallback-navigation a"
            );

        this.subtitleLinks = [
            "Black holes",
            "Graphic design",
            "Preserving memory"
        ].map(
            (label, index) => ({
                label,
                hover: 0,
                element:
                    linkElements[index] ||
                    null,
                placement: ""
            })
        );

        this.mouse = {
            x: this.center.x,
            y: this.center.y
        };

        this.metrics = {};

        this.resize();
    }

    clamp(minimum, value, maximum) {
        return Math.min(
            maximum,
            Math.max(minimum, value)
        );
    }

    /*
     * Canvas colors cannot use CSS color variables directly.
     * This method reads the active HTML theme and returns
     * RGB components for the canvas drawing operations.
     */
    getThemeColors() {
        const isLight =
            document.documentElement.dataset.theme ===
            "light";

        return {
            foreground:
                isLight
                    ? "0,0,0"
                    : "255,255,255",

            name:
                isLight
                    ? "10,10,10"
                    : "245,245,245"
        };
    }

    resize() {
        const width = Math.max(
            1,
            this.canvas.clientWidth
        );

        const height = Math.max(
            1,
            this.canvas.clientHeight
        );

        const minimumDimension =
            Math.min(
                width,
                height
            );

        this.center.x =
            width / 2;

        this.center.y =
            height / 2;

        /*
         * Compact mode is used on phones, tablets in
         * portrait orientation, and short landscape screens.
         */
        const compact =
            width < 700 ||
            height < 560;

        const veryNarrow =
            width < 430;

        const ringRadius =
            this.clamp(
                82,
                minimumDimension * (
                    compact
                        ? 0.245
                        : 0.235
                ),
                180
            );

        this.metrics = {
            width,
            height,
            compact,
            veryNarrow,

            ringRadius,

            ringSegments:
                compact
                    ? 120
                    : 160,

            nameSize:
                this.clamp(
                    22,
                    minimumDimension *
                        0.047,
                    36
                ),

            subtitleSize:
                this.clamp(
                    10,
                    minimumDimension *
                        0.018,
                    14
                )
        };

        /*
         * Keep the pointer position valid after a resize
         * or orientation change.
         */
        if (
            !Number.isFinite(
                this.mouse.x
            ) ||
            !Number.isFinite(
                this.mouse.y
            )
        ) {
            this.mouse.x =
                this.center.x;

            this.mouse.y =
                this.center.y;
        }
    }

    update(dt, mouse) {
        if (
            mouse &&
            Number.isFinite(mouse.x) &&
            Number.isFinite(mouse.y)
        ) {
            this.mouse = mouse;
        }

        if (this.fade < 1) {
            this.fade =
                Math.min(
                    1,
                    this.fade +
                        dt / FADE_DURATION
                );
        }

        this.rotation +=
            dt * ROTATION_SPEED;
    }

    draw(ctx) {
        ctx.save();

        ctx.translate(
            this.center.x,
            this.center.y
        );

        this.drawDeformedRing(ctx);
        this.drawName(ctx);
        this.drawSubtitle(ctx);

        ctx.restore();
    }

    drawDeformedRing(ctx) {
        const {
            ringRadius,
            ringSegments
        } = this.metrics;

        const {
            foreground
        } = this.getThemeColors();

        const mouseDx =
            this.mouse.x -
            this.center.x;

        const mouseDy =
            this.mouse.y -
            this.center.y;

        const mouseDist =
            Math.hypot(
                mouseDx,
                mouseDy
            );

        const mouseAngle =
            Math.atan2(
                mouseDy,
                mouseDx
            );

        const maximumDeformation =
            this.clamp(
                9,
                ringRadius * 0.11,
                20
            );

        ctx.save();

        ctx.rotate(
            this.rotation
        );

        ctx.beginPath();

        for (
            let i = 0;
            i <= ringSegments;
            i += 1
        ) {
            const t =
                (
                    i /
                    ringSegments
                ) *
                Math.PI *
                2;

            let angleDiff =
                t -
                mouseAngle -
                this.rotation;

            while (
                angleDiff >
                Math.PI
            ) {
                angleDiff -=
                    Math.PI * 2;
            }

            while (
                angleDiff <
                -Math.PI
            ) {
                angleDiff +=
                    Math.PI * 2;
            }

            const alignment =
                Math.cos(
                    angleDiff
                );

            const deform =
                alignment *
                Math.min(
                    maximumDeformation,
                    mouseDist *
                        0.03
                ) *
                0.6;

            const radius =
                ringRadius +
                deform;

            const x =
                Math.cos(t) *
                radius;

            const y =
                Math.sin(t) *
                radius;

            if (i === 0) {
                ctx.moveTo(
                    x,
                    y
                );
            } else {
                ctx.lineTo(
                    x,
                    y
                );
            }
        }

        ctx.closePath();

        ctx.strokeStyle =
            `rgba(${foreground},${
                0.15 *
                this.fade
            })`;

        ctx.lineWidth = 1;

        ctx.stroke();

        ctx.restore();
    }

    drawName(ctx) {
        const {
            nameSize
        } = this.metrics;

        const {
            name
        } = this.getThemeColors();

        ctx.font =
            `300 ${nameSize}px ` +
            `'Courier New', monospace`;

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillStyle =
            `rgba(${name},${
                this.fade
            })`;

        ctx.fillText(
            "JOÃO DINIS ÁLVARES",
            0,
            -nameSize * 0.28
        );
    }

    drawSubtitle(ctx) {
        const {
            compact,
            veryNarrow,
            subtitleSize,
            nameSize
        } = this.metrics;

        const {
            foreground
        } = this.getThemeColors();

        ctx.font =
            `${subtitleSize}px ` +
            `'Courier New', monospace`;

        ctx.textAlign =
            "left";

        ctx.textBaseline =
            "middle";

        const localMouseX =
            this.mouse.x -
            this.center.x;

        const localMouseY =
            this.mouse.y -
            this.center.y;

        const separator =
            " · ";

        const separatorWidth =
            ctx.measureText(
                separator
            ).width;

        /*
         * On narrow phones the links are split across two
         * lines, so each link's active area is kept to its
         * own line.
         */
        const twoRows =
            compact &&
            veryNarrow;

        const rowSpacing =
            subtitleSize * 1.65;

        const hitHalfHeight =
            twoRows
                ? rowSpacing / 2
                : subtitleSize + 6;

        /*
         * Draw a centered row of clickable links.
         */
        const drawLinkRow = (
            indexes,
            y
        ) => {
            let totalWidth = 0;

            indexes.forEach(
                (
                    linkIndex,
                    position
                ) => {
                    const link =
                        this.subtitleLinks[
                            linkIndex
                        ];

                    totalWidth +=
                        ctx.measureText(
                            link.label
                        ).width;

                    if (
                        position <
                        indexes.length - 1
                    ) {
                        totalWidth +=
                            separatorWidth;
                    }
                }
            );

            let currentX =
                -totalWidth / 2;

            indexes.forEach(
                (
                    linkIndex,
                    position
                ) => {
                    const link =
                        this.subtitleLinks[
                            linkIndex
                        ];

                    const textWidth =
                        ctx.measureText(
                            link.label
                        ).width;

                    const localBounds = {
                        left:
                            currentX - 7,

                        right:
                            currentX +
                            textWidth +
                            7,

                        top:
                            y -
                            hitHalfHeight,

                        bottom:
                            y +
                            hitHalfHeight
                    };

                    /*
                     * A link also lights up while it has
                     * keyboard focus.
                     */
                    const isHovered =
                        (
                            localMouseX >=
                                localBounds.left &&
                            localMouseX <=
                                localBounds.right &&
                            localMouseY >=
                                localBounds.top &&
                            localMouseY <=
                                localBounds.bottom
                        ) ||
                        Boolean(
                            link.element?.matches(
                                ":focus-visible"
                            )
                        );

                    const hoverTarget =
                        isHovered
                            ? 1
                            : 0;

                    link.hover +=
                        (
                            hoverTarget -
                            link.hover
                        ) *
                        0.15;

                    this.placeLinkElement(
                        link,
                        localBounds
                    );

                    /*
                     * Normal opacity is 0.5 and increases
                     * to 0.9 when hovered.
                     */
                    ctx.fillStyle =
                        `rgba(${foreground},${
                            (
                                0.5 +
                                link.hover *
                                    0.4
                            ) *
                            this.fade
                        })`;

                    if (
                        link.hover >
                        0.01
                    ) {
                        ctx.save();

                        ctx.shadowBlur =
                            12 *
                            link.hover;

                        ctx.shadowColor =
                            `rgba(${foreground},${
                                0.18 *
                                link.hover
                            })`;
                    }

                    ctx.fillText(
                        link.label,
                        currentX,
                        y
                    );

                    if (
                        link.hover >
                        0.01
                    ) {
                        ctx.restore();
                    }

                    /*
                     * Display a subtle underline while
                     * the link is hovered.
                     */
                    if (
                        link.hover >
                        0.15
                    ) {
                        ctx.beginPath();

                        ctx.moveTo(
                            currentX,
                            y +
                            subtitleSize *
                                0.85
                        );

                        ctx.lineTo(
                            currentX +
                            textWidth,
                            y +
                            subtitleSize *
                                0.85
                        );

                        ctx.strokeStyle =
                            `rgba(${foreground},${
                                0.65 *
                                link.hover *
                                this.fade
                            })`;

                        ctx.lineWidth = 1;

                        ctx.stroke();
                    }

                    currentX +=
                        textWidth;

                    if (
                        position <
                        indexes.length - 1
                    ) {
                        ctx.fillStyle =
                            `rgba(${foreground},${
                                0.35 *
                                this.fade
                            })`;

                        ctx.fillText(
                            separator,
                            currentX,
                            y
                        );

                        currentX +=
                            separatorWidth;
                    }
                }
            );
        };

        const firstLineY =
            nameSize * 0.72;

        /*
         * Split the subtitle across two lines on narrow
         * phones.
         */
        if (twoRows) {
            drawLinkRow(
                [0, 1],
                firstLineY
            );

            drawLinkRow(
                [2],
                firstLineY +
                    rowSpacing
            );
        } else {
            drawLinkRow(
                [0, 1, 2],
                firstLineY
            );
        }
    }

    /*
     * Move the page link over its drawn label. The style
     * is only written when the position has changed.
     */
    placeLinkElement(
        link,
        localBounds
    ) {
        if (!link.element) {
            return;
        }

        const left =
            Math.round(
                this.center.x +
                localBounds.left
            );

        const top =
            Math.round(
                this.center.y +
                localBounds.top
            );

        const width =
            Math.round(
                localBounds.right -
                localBounds.left
            );

        const height =
            Math.round(
                localBounds.bottom -
                localBounds.top
            );

        const placement =
            `${left},${top},${width},${height}`;

        if (
            link.placement ===
            placement
        ) {
            return;
        }

        link.placement =
            placement;

        link.element.style.left =
            `${left}px`;

        link.element.style.top =
            `${top}px`;

        link.element.style.width =
            `${width}px`;

        link.element.style.height =
            `${height}px`;
    }
}
