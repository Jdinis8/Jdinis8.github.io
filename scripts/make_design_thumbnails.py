#!/usr/bin/env python3
"""Generate the WebP thumbnails shown in the design archive's project grid.

Every catalogue image under assets/images/design/ gets a downsized copy at the
same relative path under assets/images/design/thumbnails/. The design page
derives that path itself, so the catalogue only lists the full-size image.

Requires Pillow: python3 -m pip install Pillow
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parent.parent
CATALOGUE = REPOSITORY_ROOT / "assets" / "data" / "design-projects.json"
IMAGE_ROOT = "/assets/images/design/"
THUMBNAIL_ROOT = IMAGE_ROOT + "thumbnails/"


def thumbnail_url(image_url: str) -> str | None:
    """Return the thumbnail URL for a catalogue image, if it has one."""
    if not image_url.startswith(IMAGE_ROOT) or image_url.startswith(
        THUMBNAIL_ROOT
    ):
        return None

    relative_path = Path(image_url[len(IMAGE_ROOT):])
    return THUMBNAIL_ROOT + relative_path.with_suffix(".webp").as_posix()


def catalogue_thumbnails() -> dict[Path, Path]:
    """Map each thumbnail file to the full-size image it is made from."""
    projects = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    thumbnails: dict[Path, Path] = {}

    for project in projects:
        image_url = project.get("image")
        target_url = thumbnail_url(image_url) if image_url else None

        if target_url is None:
            continue

        source = REPOSITORY_ROOT / image_url.lstrip("/")
        target = REPOSITORY_ROOT / target_url.lstrip("/")

        if thumbnails.setdefault(target, source) != source:
            raise SystemExit(
                f"{thumbnails[target]} and {source} would share the "
                f"thumbnail {target}; rename one of them."
            )

    return thumbnails


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--size",
        type=int,
        default=1600,
        help="longest thumbnail side in pixels (default: 1600)",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=82,
        help="WebP quality from 0 to 100 (default: 82)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="regenerate thumbnails that are already up to date",
    )
    arguments = parser.parse_args()

    try:
        from PIL import Image
    except ImportError:
        print(
            "Pillow is required: python3 -m pip install Pillow",
            file=sys.stderr,
        )
        return 2

    missing = 0

    for target, source in catalogue_thumbnails().items():
        if not source.exists():
            print(f"missing  {source.relative_to(REPOSITORY_ROOT)}")
            missing += 1
            continue

        if (
            not arguments.force
            and target.exists()
            and target.stat().st_mtime >= source.stat().st_mtime
        ):
            continue

        target.parent.mkdir(parents=True, exist_ok=True)

        with Image.open(source) as image:
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert(
                    "RGBA" if "transparency" in image.info else "RGB"
                )

            image.thumbnail(
                (arguments.size, arguments.size),
                Image.LANCZOS,
            )
            image.save(target, "WEBP", quality=arguments.quality, method=6)

        print(
            f"created  {target.relative_to(REPOSITORY_ROOT)} "
            f"({target.stat().st_size / 1024:.0f} kB)"
        )

    return 1 if missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
