#!/usr/bin/env python3

from __future__ import annotations

import html
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

PAPERS_FILE = ROOT / "papers.txt"
RESEARCH_FILE = ROOT / "research.html"

START_MARKER = "<!-- PAPERS:START -->"
END_MARKER = "<!-- PAPERS:END -->"

ARXIV_API = "https://export.arxiv.org/api/query"

ATOM_NAMESPACE = {
    "atom": "http://www.w3.org/2005/Atom",
    "arxiv": "http://arxiv.org/schemas/atom",
}


def normalize_space(value: str) -> str:
    """Collapse newlines and repeated whitespace."""

    return " ".join(value.split())


def extract_arxiv_id(value: str) -> str:
    """
    Extract an arXiv identifier from an abstract URL,
    PDF URL, or bare identifier.
    """

    value = value.strip()

    parsed = urllib.parse.urlparse(value)

    if parsed.netloc:
        path = parsed.path.strip("/")

        if path.startswith("abs/"):
            identifier = path[4:]
        elif path.startswith("pdf/"):
            identifier = path[4:]
        else:
            raise ValueError(
                f"Unsupported arXiv URL: {value}"
            )
    else:
        identifier = value

    if identifier.endswith(".pdf"):
        identifier = identifier[:-4]

    # Remove a version suffix such as v1 or v3.
    identifier = re.sub(
        r"v\d+$",
        "",
        identifier
    )

    if not identifier:
        raise ValueError(
            f"Could not extract an arXiv ID from: {value}"
        )

    return identifier


def read_paper_ids() -> list[str]:
    if not PAPERS_FILE.exists():
        raise FileNotFoundError(
            f"Missing {PAPERS_FILE}"
        )

    identifiers: list[str] = []

    for line in PAPERS_FILE.read_text(
        encoding="utf-8"
    ).splitlines():
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        identifier = extract_arxiv_id(line)

        if identifier not in identifiers:
            identifiers.append(identifier)

    if not identifiers:
        raise ValueError(
            "papers.txt does not contain any arXiv links."
        )

    return identifiers


def retrieve_metadata(
    identifiers: list[str]
) -> dict[str, dict[str, object]]:
    parameters = urllib.parse.urlencode({
        "id_list": ",".join(identifiers),
        "max_results": len(identifiers),
    })

    request = urllib.request.Request(
        f"{ARXIV_API}?{parameters}",
        headers={
            "User-Agent": (
                "jdinis8.github.io publication updater "
                "(mailto:jdlvares@go.olemiss.edu)"
            )
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=45
    ) as response:
        document = response.read()

    root = ET.fromstring(document)

    papers: dict[str, dict[str, object]] = {}

    for entry in root.findall(
        "atom:entry",
        ATOM_NAMESPACE
    ):
        entry_url = normalize_space(
            entry.findtext(
                "atom:id",
                default="",
                namespaces=ATOM_NAMESPACE
            )
        )

        identifier = extract_arxiv_id(
            entry_url
        )

        title = normalize_space(
            entry.findtext(
                "atom:title",
                default="Untitled paper",
                namespaces=ATOM_NAMESPACE
            )
        )

        published = normalize_space(
            entry.findtext(
                "atom:published",
                default="",
                namespaces=ATOM_NAMESPACE
            )
        )

        authors = [
            normalize_space(
                author.findtext(
                    "atom:name",
                    default="",
                    namespaces=ATOM_NAMESPACE
                )
            )
            for author in entry.findall(
                "atom:author",
                ATOM_NAMESPACE
            )
        ]

        authors = [
            author
            for author in authors
            if author
        ]

        primary_category_element = entry.find(
            "arxiv:primary_category",
            ATOM_NAMESPACE
        )

        primary_category = ""

        if primary_category_element is not None:
            primary_category = (
                primary_category_element
                .attrib
                .get("term", "")
            )

        papers[identifier] = {
            "id": identifier,
            "url": (
                f"https://arxiv.org/abs/"
                f"{identifier}"
            ),
            "title": title,
            "published": published,
            "authors": authors,
            "category": primary_category,
        }

    missing = [
        identifier
        for identifier in identifiers
        if identifier not in papers
    ]

    if missing:
        raise RuntimeError(
            "No metadata was returned for: "
            + ", ".join(missing)
        )

    return papers


def format_date(value: str) -> str:
    if not value:
        return "Date unavailable"

    parsed = datetime.fromisoformat(
        value.replace(
            "Z",
            "+00:00"
        )
    )

    return parsed.strftime(
        "%d %b %Y"
    ).lstrip("0")


def render_paper(
    paper: dict[str, object],
    index: int
) -> str:
    identifier = html.escape(
        str(paper["id"])
    )

    url = html.escape(
        str(paper["url"]),
        quote=True
    )

    title = html.escape(
        str(paper["title"])
    )

    authors = ", ".join(
        str(author)
        for author in paper["authors"]
    )

    authors_html = html.escape(
        authors
    )

    date = html.escape(
        format_date(
            str(paper["published"])
        )
    )

    category = html.escape(
        str(paper["category"])
    )

    metadata = [
        f"<span>arXiv:{identifier}</span>",
        f"<span>{date}</span>",
    ]

    if category:
        metadata.append(
            f"<span>{category}</span>"
        )

    metadata_html = "\n".join(
        f"                            {item}"
        for item in metadata
    )

    return f"""        <article class="paper-entry">
            <a
                class="paper-link"
                href="{url}"
                target="_blank"
                rel="noopener noreferrer"
            >
                <span class="paper-index">
                    {index:02d}
                </span>

                <div class="paper-content">
                    <h3 class="paper-title">
                        {title}
                    </h3>

                    <p class="paper-authors">
                        {authors_html}
                    </p>

                    <div class="paper-meta">
{metadata_html}
                    </div>
                </div>

                <span
                    class="paper-arrow"
                    aria-hidden="true"
                >
                    ↗
                </span>
            </a>
        </article>"""


def render_section(
    identifiers: list[str],
    papers: dict[str, dict[str, object]]
) -> str:
    entries = "\n\n".join(
        render_paper(
            papers[identifier],
            index
        )
        for index, identifier in enumerate(
            identifiers,
            start=1
        )
    )

    count = len(identifiers)

    return f"""    <div class="section-heading-row">
        <div>
            <p class="section-kicker">
                Selected output
            </p>

            <h2>
                Papers &amp; Publications
            </h2>
        </div>

        <span
            class="section-count"
            aria-label="{count} papers"
        >
            {count:02d}
        </span>
    </div>

    <div class="paper-list">
{entries}
    </div>"""


def update_research_page(
    generated_section: str
) -> None:
    source = RESEARCH_FILE.read_text(
        encoding="utf-8"
    )

    before, start_found, remainder = (
        source.partition(
            START_MARKER
        )
    )

    if not start_found:
        raise RuntimeError(
            f"Missing marker: {START_MARKER}"
        )

    _, end_found, after = (
        remainder.partition(
            END_MARKER
        )
    )

    if not end_found:
        raise RuntimeError(
            f"Missing marker: {END_MARKER}"
        )

    updated = (
        before
        + START_MARKER
        + "\n"
        + generated_section
        + "\n    "
        + END_MARKER
        + after
    )

    RESEARCH_FILE.write_text(
        updated,
        encoding="utf-8"
    )


def main() -> int:
    identifiers = read_paper_ids()

    print(
        "Retrieving metadata for "
        f"{len(identifiers)} papers..."
    )

    papers = retrieve_metadata(
        identifiers
    )

    generated_section = render_section(
        identifiers,
        papers
    )

    update_research_page(
        generated_section
    )

    print(
        f"Updated {RESEARCH_FILE.name}"
    )

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(
            f"Error: {error}",
            file=sys.stderr
        )

        raise SystemExit(1)