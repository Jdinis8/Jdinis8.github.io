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

        this.inertElements = [
            document.querySelector(".profile-controls"),
            document.getElementById("theme-toggle"),
            document.querySelector(".home-fallback")
        ].filter(Boolean);

        this.isActive = false;
        this.quantumTimer = null;
        this.copyTimer = null;
        this.closeTimer = null;

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
            !this.copy
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

    activate() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;

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
