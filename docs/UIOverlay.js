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
            {
                label: "Research",
                angle: -Math.PI * 0.75,
                url: "research.html",
                hover: 0
            },
            {
                label: "Design",
                angle: 0,
                url: "design.html",
                hover: 0
            },
            {
                label: "History",
                angle: Math.PI * 0.75,
                url: "history.html",
                hover: 0
            }
        ];

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

        this.handlePointerUp = this.handlePointerUp.bind(this);

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

    resize() {
        const width = Math.max(
            1,
            this.canvas.width
        );

        const height = Math.max(
            1,
            this.canvas.height
        );

        const minimumDimension = Math.min(
            width,
            height
        );

        this.center.x = width / 2;
        this.center.y = height / 2;

        /*
         * Compact mode is used on phones, tablets in
         * portrait orientation, and short landscape screens.
         */
        const compact =
            width < 700 ||
            height < 560;

        const veryNarrow = width < 430;

        const ringRadius = this.clamp(
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

            nameSize: this.clamp(
                22,
                minimumDimension * 0.047,
                36
            ),

            subtitleSize: this.clamp(
                10,
                minimumDimension * 0.018,
                14
            ),

            sectionSize: this.clamp(
                12,
                minimumDimension * 0.017,
                13
            ),

            sectionRadius: this.clamp(
                ringRadius + 70,
                minimumDimension * 0.47,
                360
            ),

            horizontalSectionSpacing: this.clamp(
                78,
                width * 0.27,
                150
            ),

            compactSectionY:
                ringRadius +
                this.clamp(
                    42,
                    height * 0.065,
                    62
                ),

            hitPaddingX:
                compact
                    ? 14
                    : 18,

            hitPaddingY:
                compact
                    ? 13
                    : 15
        };

        /*
         * Keep the pointer position valid after a resize
         * or orientation change.
         */
        if (
            !Number.isFinite(this.mouse.x) ||
            !Number.isFinite(this.mouse.y)
        ) {
            this.mouse.x = this.center.x;
            this.mouse.y = this.center.y;
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
            this.fade = Math.min(
                1,
                this.fade + 0.005
            );
        }

        this.rotation += 0.0004;
    }

    draw(ctx) {
        /*
        * Both the outer navigation and subtitle links can
        * change this to true.
        */
        this.hoveringInteractive = false;

        ctx.save();

        ctx.translate(
            this.center.x,
            this.center.y
        );

        this.drawDeformedRing(ctx);
        this.drawName(ctx);
        this.drawSubtitle(ctx);
        this.drawSections(ctx);

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

        const mouseDx =
            this.mouse.x -
            this.center.x;

        const mouseDy =
            this.mouse.y -
            this.center.y;

        const mouseDist = Math.hypot(
            mouseDx,
            mouseDy
        );

        const mouseAngle = Math.atan2(
            mouseDy,
            mouseDx
        );

        const maximumDeformation = this.clamp(
            9,
            ringRadius * 0.11,
            20
        );

        ctx.save();
        ctx.rotate(this.rotation);
        ctx.beginPath();

        for (
            let i = 0;
            i <= ringSegments;
            i += 1
        ) {
            const t =
                (i / ringSegments) *
                Math.PI *
                2;

            let angleDiff =
                t -
                mouseAngle -
                this.rotation;

            while (angleDiff > Math.PI) {
                angleDiff -= Math.PI * 2;
            }

            while (angleDiff < -Math.PI) {
                angleDiff += Math.PI * 2;
            }

            const alignment = Math.cos(
                angleDiff
            );

            const deform =
                alignment *
                Math.min(
                    maximumDeformation,
                    mouseDist * 0.03
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
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();

        ctx.strokeStyle =
            `rgba(255,255,255,${0.08 * this.fade})`;

        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    drawName(ctx) {
        const {
            nameSize
        } = this.metrics;

        ctx.font =
            `300 ${nameSize}px 'Courier New', monospace`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillStyle =
            `rgba(245,245,245,${this.fade})`;

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

        ctx.font =
            `${subtitleSize}px 'Courier New', monospace`;

        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const localMouseX =
            this.mouse.x -
            this.center.x;

        const localMouseY =
            this.mouse.y -
            this.center.y;

        const separator = " · ";
        const separatorWidth =
            ctx.measureText(separator).width;

        /*
        * Draw one centered row of clickable subtitle links.
        *
        * The indexes argument identifies which entries from
        * this.subtitleLinks should be placed on this row.
        */
        const drawLinkRow = (indexes, y) => {
            let totalWidth = 0;

            indexes.forEach((linkIndex, position) => {
                const link =
                    this.subtitleLinks[linkIndex];

                totalWidth +=
                    ctx.measureText(link.label).width;

                if (position < indexes.length - 1) {
                    totalWidth += separatorWidth;
                }
            });

            let currentX =
                -totalWidth / 2;

            indexes.forEach((linkIndex, position) => {
                const link =
                    this.subtitleLinks[linkIndex];

                const textWidth =
                    ctx.measureText(link.label).width;

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
                    localMouseX >= localBounds.left &&
                    localMouseX <= localBounds.right &&
                    localMouseY >= localBounds.top &&
                    localMouseY <= localBounds.bottom;

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
                    this.hoveringInteractive = true;
                }

                /*
                * Save absolute canvas coordinates so that
                * handlePointerUp() can detect clicks and taps.
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

                ctx.fillStyle =
                    `rgba(255,255,255,${
                        (
                            0.5 +
                            link.hover * 0.4
                        ) *
                        this.fade
                    })`;

                if (link.hover > 0.01) {
                    ctx.save();

                    ctx.shadowBlur =
                        12 *
                        link.hover;

                    ctx.shadowColor =
                        `rgba(255,255,255,${
                            0.18 *
                            link.hover
                        })`;
                }

                ctx.fillText(
                    link.label,
                    currentX,
                    y
                );

                if (link.hover > 0.01) {
                    ctx.restore();
                }

                /*
                * Show a subtle underline while hovering.
                */
                if (link.hover > 0.15) {
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
                        `rgba(255,255,255,${
                            0.65 *
                            link.hover *
                            this.fade
                        })`;

                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                currentX += textWidth;

                if (position < indexes.length - 1) {
                    ctx.fillStyle =
                        `rgba(255,255,255,${
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
            });
        };

        const firstLineY =
            nameSize * 0.72;

        /*
        * Split the subtitle on narrow phones.
        */
        if (compact && veryNarrow) {
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

    getSectionPosition(section, index) {
        const {
            compact,
            sectionRadius,
            horizontalSectionSpacing,
            compactSectionY
        } = this.metrics;

        /*
         * On smaller screens, place the navigation links
         * in a horizontal line beneath the central ring.
         */
        if (compact) {
            const middleIndex =
                (this.sections.length - 1) /
                2;

            return {
                x:
                    (index - middleIndex) *
                    horizontalSectionSpacing,

                y: compactSectionY
            };
        }

        /*
         * On larger screens, preserve the original radial
         * navigation arrangement.
         */
        return {
            x:
                Math.cos(section.angle) *
                sectionRadius,

            y:
                Math.sin(section.angle) *
                sectionRadius
        };
    }

    pointInsideBounds(x, y, bounds) {
        return Boolean(
            bounds &&
            x >= bounds.left &&
            x <= bounds.right &&
            y >= bounds.top &&
            y <= bounds.bottom
        );
    }

    drawSections(ctx) {
        const {
            sectionSize,
            hitPaddingX,
            hitPaddingY
        } = this.metrics;

        ctx.font =
            `${sectionSize}px 'Courier New', monospace`;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const localMouseX =
            this.mouse.x -
            this.center.x;

        const localMouseY =
            this.mouse.y -
            this.center.y;

        this.sections.forEach(
            (section, index) => {
                const position =
                    this.getSectionPosition(
                        section,
                        index
                    );

                const textWidth =
                    ctx.measureText(
                        section.label
                    ).width;

                const targetBounds = {
                    left:
                        position.x -
                        textWidth / 2 -
                        hitPaddingX,

                    right:
                        position.x +
                        textWidth / 2 +
                        hitPaddingX,

                    top:
                        position.y -
                        sectionSize / 2 -
                        hitPaddingY,

                    bottom:
                        position.y +
                        sectionSize / 2 +
                        hitPaddingY
                };

                const isPointerOver =
                    this.pointInsideBounds(
                        localMouseX,
                        localMouseY,
                        targetBounds
                    );

                const hoverTarget =
                    isPointerOver
                        ? 1
                        : 0;

                section.hover +=
                    (
                        hoverTarget -
                        section.hover
                    ) *
                    0.12;

                const outwardShift =
                    section.hover *
                    6;

                let drawX =
                    position.x;

                let drawY =
                    position.y;

                /*
                 * For radial desktop navigation, move the
                 * link outward. For compact navigation,
                 * move it slightly upward.
                 */
                if (!this.metrics.compact) {
                    drawX +=
                        Math.cos(section.angle) *
                        outwardShift;

                    drawY +=
                        Math.sin(section.angle) *
                        outwardShift;
                } else {
                    drawY -=
                        outwardShift *
                        0.35;
                }

                if (section.hover > 0.01) {
                    ctx.save();

                    ctx.shadowBlur =
                        20 *
                        section.hover;

                    ctx.shadowColor =
                        `rgba(255,255,255,${
                            0.22 *
                            section.hover
                        })`;
                }

                ctx.fillStyle =
                    `rgba(255,255,255,${
                        (
                            0.5 +
                            section.hover *
                                0.5
                        ) *
                        this.fade
                    })`;

                ctx.fillText(
                    section.label,
                    drawX,
                    drawY
                );

                if (section.hover > 0.01) {
                    ctx.restore();
                }

                /*
                 * Draw the underline once the hover state
                 * becomes visible.
                 */
                if (section.hover > 0.22) {
                    ctx.beginPath();

                    ctx.moveTo(
                        drawX -
                            textWidth / 2,
                        drawY +
                            sectionSize *
                                0.9
                    );

                    ctx.lineTo(
                        drawX +
                            textWidth / 2,
                        drawY +
                            sectionSize *
                                0.9
                    );

                    ctx.strokeStyle =
                        `rgba(255,255,255,${
                            0.65 *
                            section.hover *
                            this.fade
                        })`;

                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                /*
                 * Store absolute canvas coordinates for
                 * mouse, stylus, and touchscreen taps.
                 */
                section.bounds = {
                    left:
                        this.center.x +
                        targetBounds.left,

                    right:
                        this.center.x +
                        targetBounds.right,

                    top:
                        this.center.y +
                        targetBounds.top,

                    bottom:
                        this.center.y +
                        targetBounds.bottom
                };

                section.isActive =
                    isPointerOver;

                if (isPointerOver) {
                    this.hoveringInteractive = true;
                }
            }
        );
    }

    canvasCoordinatesFromEvent(event) {
        const rect =
            this.canvas.getBoundingClientRect();

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

        /*
        * First check the subtitle links.
        */
        const selectedSubtitleLink =
            this.subtitleLinks.find(
                link =>
                    this.pointInsideBounds(
                        point.x,
                        point.y,
                        link.bounds
                    )
            );

        if (selectedSubtitleLink?.url) {
            window.location.href =
                selectedSubtitleLink.url;

            return;
        }

        /*
        * Then check the outer navigation links.
        */
        const selectedSection =
            this.sections.find(
                section =>
                    this.pointInsideBounds(
                        point.x,
                        point.y,
                        section.bounds
                    )
            );

        if (selectedSection?.url) {
            window.location.href =
                selectedSection.url;
        }
    }

    destroy() {
        this.canvas.removeEventListener(
            "pointerup",
            this.handlePointerUp
        );
    }
}