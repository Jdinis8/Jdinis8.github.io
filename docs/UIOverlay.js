export class UIOverlay {
    constructor(canvas) {
        this.canvas = canvas;

        this.center = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };

        this.fade = 0;
        this.rotation = 0;
        this.hoveringInteractive = false;

        /*
         * These are the only navigation links displayed
         * by this overlay.
         */
        this.subtitleLinks = [
            {
                label: "Black holes",
                url: "research.html",
                hover: 0,
                bounds: null
            },
            {
                label: "Graphic design",
                url: "design.html",
                hover: 0,
                bounds: null
            },
            {
                label: "Preserving memory",
                url: "history.html",
                hover: 0,
                bounds: null
            }
        ];

        this.mouse = {
            x: this.center.x,
            y: this.center.y
        };

        this.metrics = {};

        this.handlePointerUp =
            this.handlePointerUp.bind(this);

        this.canvas.addEventListener(
            "pointerup",
            this.handlePointerUp
        );

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
            this.canvas.width
        );

        const height = Math.max(
            1,
            this.canvas.height
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

    update(mouse) {
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
                    this.fade + 0.005
                );
        }

        this.rotation +=
            0.0004;
    }

    draw(ctx) {
        this.hoveringInteractive =
            false;

        ctx.save();

        ctx.translate(
            this.center.x,
            this.center.y
        );

        this.drawDeformedRing(ctx);
        this.drawName(ctx);
        this.drawSubtitle(ctx);

        ctx.restore();

        this.canvas.style.cursor =
            this.hoveringInteractive
                ? "pointer"
                : "default";
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
                            subtitleSize -
                            6,

                        bottom:
                            y +
                            subtitleSize +
                            6
                    };

                    const isHovered =
                        localMouseX >=
                            localBounds.left &&
                        localMouseX <=
                            localBounds.right &&
                        localMouseY >=
                            localBounds.top &&
                        localMouseY <=
                            localBounds.bottom;

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

                    if (isHovered) {
                        this.hoveringInteractive =
                            true;
                    }

                    /*
                     * Store absolute canvas coordinates for
                     * pointer clicks and touchscreen taps.
                     */
                    link.bounds = {
                        left:
                            this.center.x +
                            localBounds.left,

                        right:
                            this.center.x +
                            localBounds.right,

                        top:
                            this.center.y +
                            localBounds.top,

                        bottom:
                            this.center.y +
                            localBounds.bottom
                    };

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
        if (
            compact &&
            veryNarrow
        ) {
            drawLinkRow(
                [0, 1],
                firstLineY
            );

            drawLinkRow(
                [2],
                firstLineY +
                    subtitleSize *
                        1.65
            );
        } else {
            drawLinkRow(
                [0, 1, 2],
                firstLineY
            );
        }
    }

    pointInsideBounds(
        x,
        y,
        bounds
    ) {
        return Boolean(
            bounds &&
            x >= bounds.left &&
            x <= bounds.right &&
            y >= bounds.top &&
            y <= bounds.bottom
        );
    }

    canvasCoordinatesFromEvent(
        event
    ) {
        const rect =
            this.canvas
                .getBoundingClientRect();

        return {
            x:
                (
                    event.clientX -
                    rect.left
                ) *
                (
                    this.canvas.width /
                    rect.width
                ),

            y:
                (
                    event.clientY -
                    rect.top
                ) *
                (
                    this.canvas.height /
                    rect.height
                )
        };
    }

    handlePointerUp(event) {
        const point =
            this.canvasCoordinatesFromEvent(
                event
            );

        const selectedSubtitleLink =
            this.subtitleLinks.find(
                link =>
                    this.pointInsideBounds(
                        point.x,
                        point.y,
                        link.bounds
                    )
            );

        if (
            selectedSubtitleLink?.url
        ) {
            window.location.href =
                selectedSubtitleLink.url;
        }
    }

    destroy() {
        this.canvas.removeEventListener(
            "pointerup",
            this.handlePointerUp
        );
    }
}
