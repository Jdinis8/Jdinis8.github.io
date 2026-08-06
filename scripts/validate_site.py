#!/usr/bin/env python3
"""Validate the generated static site without third-party dependencies."""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path


HTML_ATTRIBUTES = {
    "a": ("href",),
    "img": ("src",),
    "link": ("href",),
    "script": ("src",),
    "source": ("src", "srcset"),
    "video": ("poster", "src"),
}


class DocumentParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []

    def handle_starttag(
        self,
        tag: str,
        attributes: list[tuple[str, str | None]],
    ) -> None:
        values = dict(attributes)
        identifier = values.get("id")

        if identifier:
            self.ids.append(identifier)

        for attribute in HTML_ATTRIBUTES.get(tag, ()):
            value = values.get(attribute)

            if not value:
                continue

            if attribute == "srcset":
                for candidate in value.split(","):
                    url = candidate.strip().split()[0]
                    self.references.append((attribute, url))
            else:
                self.references.append((attribute, value))


def local_target(site_root: Path, document: Path, value: str) -> Path | None:
    parsed = urllib.parse.urlsplit(value)

    if parsed.scheme or parsed.netloc or value.startswith(("#", "//")):
        return None

    decoded_path = urllib.parse.unquote(parsed.path)

    if not decoded_path:
        return document

    if decoded_path.startswith("/"):
        target = site_root / decoded_path.lstrip("/")
    else:
        target = document.parent / decoded_path

    if decoded_path.endswith("/"):
        target /= "index.html"

    return target.resolve()


def validate_html(site_root: Path, document: Path) -> list[str]:
    parser = DocumentParser()
    parser.feed(document.read_text(encoding="utf-8"))
    errors: list[str] = []

    for identifier, count in Counter(parser.ids).items():
        if count > 1:
            errors.append(f"{document}: duplicate id #{identifier}")

    for attribute, value in parser.references:
        target = local_target(site_root, document, value)

        if target is None:
            continue

        if target.is_dir():
            target /= "index.html"

        if not target.exists():
            errors.append(
                f"{document}: {attribute}=\"{value}\" points to missing {target}"
            )
            continue

        fragment = urllib.parse.urlsplit(value).fragment

        if attribute == "href" and fragment and target.suffix == ".html":
            target_parser = DocumentParser()
            target_parser.feed(target.read_text(encoding="utf-8"))

            if urllib.parse.unquote(fragment) not in target_parser.ids:
                errors.append(
                    f"{document}: href=\"{value}\" points to a missing anchor"
                )

    return errors


def validate_css(site_root: Path, stylesheet: Path) -> list[str]:
    errors: list[str] = []
    text = stylesheet.read_text(encoding="utf-8")

    for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", text):
        value = match.group(2)
        target = local_target(site_root, stylesheet, value)

        if target is not None and not target.exists():
            errors.append(f"{stylesheet}: url({value}) points to missing {target}")

    return errors


def validate_javascript(site_root: Path, script: Path) -> list[str]:
    errors: list[str] = []
    text = script.read_text(encoding="utf-8")
    pattern = r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]"

    for match in re.finditer(pattern, text):
        value = match.group(1)
        target = local_target(site_root, script, value)

        if target is not None and not target.exists():
            errors.append(f"{script}: import {value} points to missing {target}")

    return errors


def validate_json_assets(site_root: Path, data_file: Path) -> list[str]:
    errors: list[str] = []

    try:
        data = json.loads(data_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        return [f"{data_file}: invalid JSON: {error}"]

    if data_file.name == "design-projects.json":
        if not isinstance(data, list):
            errors.append(f"{data_file}: project catalogue must be a list")
        else:
            valid_card_sizes = {"standard", "half", "wide", "full"}

            for index, project in enumerate(data, start=1):
                if not isinstance(project, dict):
                    errors.append(
                        f"{data_file}: project {index} must be an object"
                    )
                    continue

                categories = project.get("categories")

                if categories is None:
                    # Continue accepting the original singular field so older
                    # catalogue entries remain compatible.
                    categories = [project.get("category")]

                if (
                    not isinstance(categories, list)
                    or not categories
                    or any(
                        not isinstance(category, str) or not category.strip()
                        for category in categories
                    )
                ):
                    errors.append(
                        f"{data_file}: project {index} must have one or more "
                        "non-empty categories"
                    )

                card_size = project.get("cardSize", "standard")

                if (
                    not isinstance(card_size, str)
                    or card_size not in valid_card_sizes
                ):
                    errors.append(
                        f"{data_file}: project {index} has invalid cardSize "
                        f"{card_size!r}"
                    )

    def visit(value: object) -> None:
        if isinstance(value, list):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            for key, item in value.items():
                asset_keys = {"image", "pdf"}

                if data_file.name == "site.webmanifest":
                    asset_keys.add("src")

                if key in asset_keys and isinstance(item, str):
                    target = local_target(site_root, data_file, item)

                    if target is not None and not target.exists():
                        errors.append(
                            f"{data_file}: {key}=\"{item}\" points to missing {target}"
                        )
                else:
                    visit(item)

    visit(data)
    return errors


def validate_sitemap(site_root: Path) -> list[str]:
    sitemap = site_root / "sitemap.xml"

    if not sitemap.exists():
        return [f"{sitemap}: missing sitemap"]

    root = ET.parse(sitemap).getroot()
    errors: list[str] = []

    for location in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
        if not location.text:
            continue

        parsed = urllib.parse.urlsplit(location.text.strip())
        path = urllib.parse.unquote(parsed.path).lstrip("/")
        target = site_root / path

        if not path or path.endswith("/"):
            target /= "index.html"

        if not target.exists():
            errors.append(f"{sitemap}: {location.text.strip()} has no generated page")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("site_root", nargs="?", type=Path, default=Path("_site"))
    arguments = parser.parse_args()
    site_root = arguments.site_root.resolve()

    if not site_root.is_dir():
        print(f"Site root does not exist: {site_root}", file=sys.stderr)
        return 2

    errors: list[str] = []

    for document in site_root.rglob("*.html"):
        errors.extend(validate_html(site_root, document))

    for stylesheet in site_root.rglob("*.css"):
        errors.extend(validate_css(site_root, stylesheet))

    for script in site_root.rglob("*.js"):
        errors.extend(validate_javascript(site_root, script))

    for data_file in site_root.rglob("*.json"):
        errors.extend(validate_json_assets(site_root, data_file))

    errors.extend(validate_sitemap(site_root))

    if errors:
        print("\n".join(errors), file=sys.stderr)
        print(f"\nValidation failed with {len(errors)} error(s).", file=sys.stderr)
        return 1

    html_count = sum(1 for _ in site_root.rglob("*.html"))
    print(f"Validated {html_count} HTML documents in {site_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
