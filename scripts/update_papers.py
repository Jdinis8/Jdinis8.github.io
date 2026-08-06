#!/usr/bin/env python3

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

PAPERS_FILE = ROOT / "papers.txt"
PAPERS_DATA_FILE = ROOT / "_data" / "papers.json"

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


def write_papers_data(
    identifiers: list[str],
    papers: dict[str, dict[str, object]]
) -> None:
    ordered_papers = []

    for identifier in identifiers:
        paper = dict(papers[identifier])
        paper["display_date"] = format_date(str(paper["published"]))
        ordered_papers.append(paper)

    PAPERS_DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    PAPERS_DATA_FILE.write_text(
        json.dumps(
            ordered_papers,
            ensure_ascii=False,
            indent=2
        ) + "\n",
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

    write_papers_data(
        identifiers,
        papers,
    )

    print(
        f"Updated {PAPERS_DATA_FILE.relative_to(ROOT)}"
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
