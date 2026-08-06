# João D. Álvares — personal site

This repository is a GitHub Pages site built with Jekyll. Public page URLs are
kept stable while shared page structure, article metadata, and collection data
live in one place.

## Repository structure

- `_history/` contains the six history article bodies and their front matter.
- `_layouts/` contains the shared history article shell.
- `_includes/` contains shared document-head, history-list, and paper-list markup.
- `_data/papers.json` is the generated publication metadata used by `research.html`.
- `assets/data/design-projects.json` is the design archive's project catalogue.
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

Edit `assets/data/design-projects.json`. Each `image` or `pdf` path must point to
a published file under `assets/`. The design page reads this file at runtime;
no HTML changes are required for a new project.

## Updating publications

Add or reorder arXiv identifiers in `papers.txt`, then run:

```sh
python3 scripts/update_papers.py
```

The script retrieves arXiv metadata and rewrites only `_data/papers.json`. The
research page renders that data through `_includes/paper-list.html`. The
`Update arXiv papers` workflow performs the same update automatically when its
inputs change.
