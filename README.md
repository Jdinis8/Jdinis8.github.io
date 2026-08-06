# João D. Álvares — personal site

This repository is a GitHub Pages site built with Jekyll. Public page URLs are
kept stable while shared page structure, article metadata, and collection data
live in one place.

## Repository structure

- `_history/` contains the six history article bodies and their front matter.
- `_layouts/` contains the shared history article shell.
- `_includes/` contains shared document-head, history-list, and paper-list markup.
- `_data/papers.json` is the generated publication metadata used by `research.html`.
- `_design_projects/` contains the design archive's project metadata and optional
  case-study content. Every file is published at a permanent project URL.
- `assets/data/design-projects.json` is generated from that collection for the
  filterable design grid; do not edit it directly.
- `assets/css/`, `assets/js/`, `assets/images/`, and `assets/documents/` contain
  files published with the site.
- `source-assets/` contains working files and unreferenced archive material. It
  is intentionally excluded from the generated website in `_config.yml`.
- `scripts/validate_site.py` checks generated links, anchors, imports, sitemap
  entries, and JSON media references.

## Local build

Do not serve the repository root with VS Code Live Server or
`python3 -m http.server`. The root contains Jekyll source with Liquid includes,
not the rendered website.

Install Ruby and Bundler, then run:

```sh
bundle install
bundle exec jekyll build
python3 scripts/validate_site.py _site
```

For a local development server:

```sh
bundle exec jekyll serve
```

Then open `http://127.0.0.1:4000/`.

To serve an already-generated build with Python instead, use:

```sh
bundle exec jekyll build
python3 -m http.server 8000 --directory _site
```

The `Validate site` GitHub Actions workflow runs the same build and validation
for every push and pull request.

## Adding a history article

Add an HTML or Markdown document to `_history/`. Copy the front matter from an
existing article and update every field, especially `permalink`, `date`,
`article_number`, and the `list_image` fields. The history archive and sitemap
will include the article automatically.

Keep `permalink` stable after publication. Article images belong in
`assets/images/history/` and should use lowercase, hyphenated filenames.

## Updating the design archive

Add or edit a Markdown file in `_design_projects/`. Its front matter is the
single source of truth for the project grid and its permanent detail page. Each
`image` or `pdf` path must point to a published file under `assets/`.

The filename becomes the permanent URL. For example,
`_design_projects/example-project.md` is published at
`/design/example-project/`. Keep filenames stable after publishing so shared
links do not break. Use the `order` field to control the grid order.

Each project can belong to any number of filter categories. Add them through
the `categories` array:

```yaml
---
title: Example project
order: 18
categories: [Poster, Music, Experimental]
cardSize: standard
year: 2026
image: /assets/images/design/example-project.png
description: A concise description of the project.
tools: Photoshop / Illustrator
image_layout: portrait
---
```

The project will appear when any one of those category filters is selected.
Category names are created automatically from the values used in the catalogue.

The desktop portfolio uses a 12-column grid. Control each project's width with
the `cardSize` field:

| `cardSize` | Column span | Typical arrangement |
| --- | ---: | --- |
| `"standard"` | 4 | Three standard cards |
| `"half"` | 6 | Two half-width cards |
| `"wide"` | 8 | One wide and one standard card |
| `"full"` | 12 | One full-width card |

For example:

```yaml
cardSize: wide
```

Optional Markdown below the closing front-matter delimiter appears as extended
case-study content on the permanent project page.

Arrange projects so each desktop row ideally totals 12 columns, such as
`4 + 4 + 4`, `6 + 6`, or `8 + 4`. On tablets, standard and half cards use half
the row while wide and full cards use the full row. All cards use the full row
on phones. The optional `layout` field continues to control image orientation
independently; use `"layout": "portrait"` for portrait artwork.

## Updating publications

Add or reorder arXiv identifiers in `papers.txt`, then run:

```sh
python3 scripts/update_papers.py
```

The script retrieves arXiv metadata and rewrites only `_data/papers.json`. The
research page renders that data through `_includes/paper-list.html`. The
`Update arXiv papers` workflow performs the same update automatically when its
inputs change.
