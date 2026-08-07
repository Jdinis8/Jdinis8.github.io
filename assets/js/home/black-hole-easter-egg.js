export class BlackHoleEasterEgg {
    constructor() {
        this.root = document.documentElement;
        this.trigger = document.getElementById(
            "black-hole-trigger"
        );
        this.overlay = document.getElementById(
            "black-hole-easter-egg"
        );
        this.returnButton = document.getElementById(
            "black-hole-return"
        );
        this.copy = document.querySelector(
            ".black-hole-copy"
        );
        this.equation = document.querySelector(
            ".hawking-equation"
        );

        this.inertElements = [
            document.querySelector(".profile-controls"),
            document.getElementById("theme-toggle"),
            document.querySelector(".home-fallback")
        ].filter(Boolean);

        this.isActive = false;
        this.activationId = 0;
        this.quantumTimer = null;
        this.copyTimer = null;
        this.closeTimer = null;
        this.mathJaxPromise = null;

        this.prefersReducedMotion =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            );

        this.activate = this.activate.bind(this);
        this.deactivate = this.deactivate.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
        if (
            !this.trigger ||
            !this.overlay ||
            !this.returnButton ||
            !this.copy ||
            !this.equation
        ) {
            return;
        }

        this.trigger.addEventListener(
            "click",
            this.activate
        );

        this.returnButton.addEventListener(
            "click",
            this.deactivate
        );

        document.addEventListener(
            "keydown",
            this.handleKeyDown
        );
    }

    setPageInert(value) {
        this.inertElements.forEach(element => {
            element.inert = value;
        });
    }

    loadScript(source) {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            const timeout = window.setTimeout(
                () => {
                    script.remove();
                    reject(
                        new Error(
                            `Timed out loading ${source}`
                        )
                    );
                },
                8000
            );

            script.src = source;

            script.addEventListener(
                "load",
                () => {
                    window.clearTimeout(timeout);
                    resolve();
                },
                { once: true }
            );

            script.addEventListener(
                "error",
                () => {
                    window.clearTimeout(timeout);
                    script.remove();
                    reject(
                        new Error(
                            `Failed to load ${source}`
                        )
                    );
                },
                { once: true }
            );

            document.head.append(script);
        });
    }

    loadMathJax() {
        if (this.mathJaxPromise) {
            return this.mathJaxPromise;
        }

        this.mathJaxPromise = this.loadScript(
            "/assets/js/mathjax-config.js"
        )
            .then(() => this.loadScript(
                "https://cdn.jsdelivr.net/npm/mathjax@4.0.0/tex-chtml.js"
            ))
            .then(() =>
                window.MathJax.startup.promise
            )
            .then(() => true)
            .catch((error) => {
                console.warn(
                    "MathJax could not be loaded for the easter egg.",
                    error
                );

                return false;
            });

        return this.mathJaxPromise;
    }

    revealCopy(
        mathRendered,
        activationId
    ) {
        if (
            !this.isActive ||
            activationId !== this.activationId
        ) {
            return;
        }

        if (!mathRendered) {
            this.equation.textContent =
                "T_H = ℏc³ / (8πGMk_B)";
        }

        this.copy.inert = false;

        this.copy.setAttribute(
            "aria-hidden",
            "false"
        );

        this.overlay.classList.add(
            "is-copy-visible"
        );

        this.returnButton.focus({
            preventScroll: true
        });
    }

    activate() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.activationId += 1;

        const activationId =
            this.activationId;

        window.clearTimeout(this.closeTimer);

        const bounds =
            this.trigger.getBoundingClientRect();

        const originX =
            bounds.left + bounds.width / 2;

        const originY =
            bounds.top + bounds.height / 2;

        this.root.style.setProperty(
            "--black-hole-x",
            `${originX}px`
        );

        this.root.style.setProperty(
            "--black-hole-y",
            `${originY}px`
        );

        this.trigger.setAttribute(
            "aria-expanded",
            "true"
        );

        this.overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        this.setPageInert(true);

        const mathJaxReady =
            this.loadMathJax();

        requestAnimationFrame(() => {
            this.root.classList.add(
                "black-hole-active"
            );

            this.overlay.classList.add(
                "is-active"
            );
        });

        const quantumDelay =
            this.prefersReducedMotion.matches
                ? 80
                : 1450;

        const copyDelay =
            this.prefersReducedMotion.matches
                ? 160
                : 2350;

        this.quantumTimer = window.setTimeout(
            () => {
                this.overlay.classList.add(
                    "is-quantum-visible"
                );
            },
            quantumDelay
        );

        this.copyTimer = window.setTimeout(
            () => {
                mathJaxReady.then(
                    mathRendered => {
                        this.revealCopy(
                            mathRendered,
                            activationId
                        );
                    }
                );
            },
            copyDelay
        );
    }

    deactivate() {
        if (!this.isActive) {
            return;
        }

        this.isActive = false;

        window.clearTimeout(this.quantumTimer);
        window.clearTimeout(this.copyTimer);

        this.overlay.classList.remove(
            "is-quantum-visible",
            "is-copy-visible"
        );

        this.copy.inert = true;

        this.copy.setAttribute(
            "aria-hidden",
            "true"
        );

        this.overlay.classList.add(
            "is-closing"
        );

        this.root.classList.remove(
            "black-hole-active"
        );

        const closeDelay =
            this.prefersReducedMotion.matches
                ? 80
                : 1050;

        this.closeTimer = window.setTimeout(
            () => {
                this.overlay.classList.remove(
                    "is-active",
                    "is-closing"
                );

                this.overlay.setAttribute(
                    "aria-hidden",
                    "true"
                );

                this.trigger.setAttribute(
                    "aria-expanded",
                    "false"
                );

                this.setPageInert(false);

                this.trigger.focus({
                    preventScroll: true
                });
            },
            closeDelay
        );
    }

    handleKeyDown(event) {
        if (
            event.key === "Escape" &&
            this.isActive
        ) {
            event.preventDefault();
            this.deactivate();
        }
    }
}
