const fallbackPalettes = [
    ["#311f25", "#101419"],
    ["#17252a", "#171319"],
    ["#2c261b", "#111419"],
    ["#201d31", "#121212"],
    ["#282828", "#16100f"],
    ["#14231d", "#171313"],
];

const projectCardSizes = new Set([
    "standard",
    "half",
    "wide",
    "full",
]);

const grid = document.getElementById("project-grid");
const filters = document.getElementById("filters");
const count = document.getElementById("project-count");
const modal = document.getElementById("project-modal");
const modalClose = document.getElementById("modal-close");
const modalMedia = document.getElementById("modal-media");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalMeta = document.getElementById("modal-meta");

let projects = [];
let activeCategory = "All";
let lastFocusedCard = null;
let pdfJsPromise;

function initials(title) {
    return title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 3)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
}

function getProjectCategories(project) {
    const configuredCategories = Array.isArray(project.categories)
        ? project.categories
        : [project.category];

    const categories = configuredCategories
        .filter((category) => typeof category === "string")
        .map((category) => category.trim())
        .filter(Boolean);

    return categories.length > 0
        ? [...new Set(categories)]
        : ["Uncategorized"];
}

function getProjectCardSize(project) {
    return projectCardSizes.has(project.cardSize)
        ? project.cardSize
        : "standard";
}

function createFallback(project, index) {
    const [firstColor, secondColor] =
        fallbackPalettes[index % fallbackPalettes.length];
    const fallback = document.createElement("div");
    const label = document.createElement("span");

    fallback.className = "project-fallback";
    fallback.style.setProperty("--fallback-a", firstColor);
    fallback.style.setProperty("--fallback-b", secondColor);
    label.textContent = initials(project.title);
    fallback.appendChild(label);

    return fallback;
}

function loadPdfJs() {
    if (!pdfJsPromise) {
        pdfJsPromise = import(
            "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.min.mjs"
        ).then((pdfjsLib) => {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/build/pdf.worker.min.mjs";
            return pdfjsLib;
        });
    }

    return pdfJsPromise;
}

async function renderPdfPreview(url, canvas, pageNumber = 1) {
    const pdfjsLib = await loadPdfJs();
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const targetWidth = 1200;
    const viewport = page.getViewport({
        scale: targetWidth / baseViewport.width,
    });
    const outputScale = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d", { alpha: false });

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;

    await page.render({
        canvasContext: context,
        viewport,
        transform:
            outputScale === 1
                ? null
                : [outputScale, 0, 0, outputScale, 0, 0],
    }).promise;
}

function createVisual(project, index) {
    const visual = document.createElement("div");
    visual.className = "project-visual";

    if (project.layout === "portrait") {
        visual.classList.add("project-visual--portrait");
    }

    if (project.pdf) {
        const canvas = document.createElement("canvas");
        canvas.className = "pdf-preview";
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `${project.title} PDF preview`);
        visual.appendChild(canvas);

        renderPdfPreview(project.pdf, canvas, project.page || 1).catch(
            (error) => {
                console.error(`Could not render ${project.pdf}:`, error);
                visual.replaceChildren(createFallback(project, index));
            },
        );

        return visual;
    }

    if (!project.image) {
        visual.appendChild(createFallback(project, index));
        return visual;
    }

    const image = document.createElement("img");
    image.src = project.image;
    image.alt = `${project.title} preview`;
    image.loading = "lazy";
    image.addEventListener(
        "error",
        () => visual.replaceChildren(createFallback(project, index)),
        { once: true },
    );
    visual.appendChild(image);

    return visual;
}

function renderFilters() {
    const categories = [
        "All",
        ...new Set(projects.flatMap(getProjectCategories)),
    ];

    filters.replaceChildren();

    categories.forEach((category) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-button";
        button.textContent = category;
        button.setAttribute(
            "aria-pressed",
            String(category === activeCategory),
        );

        button.addEventListener("click", () => {
            activeCategory = category;
            renderFilters();
            renderProjects();
        });

        filters.appendChild(button);
    });
}

function createProjectInfo(project) {
    const info = document.createElement("div");
    const headingGroup = document.createElement("div");
    const title = document.createElement("h2");
    const category = document.createElement("p");
    const year = document.createElement("span");

    info.className = "project-info";
    title.className = "project-title";
    category.className = "project-type";
    year.className = "project-year";
    title.textContent = project.title;
    category.textContent = getProjectCategories(project).join(" · ");
    year.textContent = project.year;

    headingGroup.append(title, category);
    info.append(headingGroup, year);
    return info;
}

function renderProjects() {
    const visibleProjects =
        activeCategory === "All"
            ? projects
            : projects.filter(
                  (project) =>
                      getProjectCategories(project).includes(activeCategory),
              );

    grid.replaceChildren();
    count.textContent = `${visibleProjects.length
        .toString()
        .padStart(2, "0")} project${visibleProjects.length === 1 ? "" : "s"}`;

    if (visibleProjects.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "No projects in this category yet.";
        grid.appendChild(empty);
        return;
    }

    visibleProjects.forEach((project, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "project-card";
        card.classList.add(
            `project-card--${getProjectCardSize(project)}`,
        );

        if (project.layout === "portrait") {
            card.classList.add("project-card--portrait");
        }

        card.setAttribute("aria-label", `Open ${project.title}`);
        card.append(createVisual(project, index), createProjectInfo(project));
        card.addEventListener("click", () => {
            lastFocusedCard = card;
            openProject(project, index);
        });
        grid.appendChild(card);
    });
}

function appendMetadata(label, value) {
    const heading = document.createElement("strong");
    heading.textContent = label;
    modalMeta.append(heading, document.createElement("br"));
    modalMeta.append(value, document.createElement("br"));
}

function openProject(project, index) {
    modalTitle.textContent = project.title;
    modalDescription.textContent = project.description;
    modalMedia.replaceChildren(createVisual(project, index));
    modalMeta.replaceChildren();
    appendMetadata(
        "Categories",
        getProjectCategories(project).join(" · "),
    );
    appendMetadata("Year", project.year);
    appendMetadata("Tools", project.tools || "—");

    if (project.link) {
        const link = document.createElement("a");
        link.className = "modal-link";
        link.href = project.link;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = "View full project ↗";
        modalMeta.appendChild(link);
    }

    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    modalClose.focus();
}

function closeProject() {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    lastFocusedCard?.focus();
}

async function initializeDesignArchive() {
    try {
        const response = await fetch("/assets/data/design-projects.json");

        if (!response.ok) {
            throw new Error(`Project data returned HTTP ${response.status}`);
        }

        projects = await response.json();
        renderFilters();
        renderProjects();
    } catch (error) {
        console.error("Could not load the design archive:", error);
        count.textContent = "Projects unavailable";
        const message = document.createElement("div");
        message.className = "empty-state";
        message.textContent = "The project archive could not be loaded.";
        grid.replaceChildren(message);
    }
}

modalClose.addEventListener("click", closeProject);
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        closeProject();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeProject();
    }
});

initializeDesignArchive();
