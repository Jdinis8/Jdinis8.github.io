# João D. Álvares — personal site

This repository is a GitHub Pages site built with Jekyll. Public page URLs are
kept stable while shared page structure, article metadata, and collection data
live in one place.

## Repository structure

- `_history/` contains the six history article bodies and their front matter.
- `_notes/` contains physics notes and essays; its entries appear automatically
  on `research.html`.
- `presentations/` contains self-contained slide decks; they are listed on
  `research.html` from `_data/presentations.yml`.
- `_layouts/` contains the shared history-article and physics-note shells.
- `_includes/` contains shared document-head and archive-list markup.
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

## Updating the share image

`assets/images/brand/share.png` is the 1200 × 630 image shown when a link to the
site is shared: the logo centred on a white background. History articles use
their own `list_image` instead. To rebuild it after changing the logo:

```sh
convert -size 1200x630 xc:white \
  \( assets/images/brand/logo-512.png -resize 440x440 \) \
  -gravity center -composite -strip assets/images/brand/share.png
```

The logo file itself is not used directly because its transparent corners turn
black in some apps and wide previews would crop a square image.

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

The project grid shows a downsized WebP copy of each image and the modal loads
the original. After adding or replacing an image under `assets/images/design/`,
generate its thumbnail and commit it with the original:

```sh
python3 scripts/make_design_thumbnails.py
```

The script needs Pillow (`python3 -m pip install Pillow`) and only writes the
thumbnails that are missing or older than their source. Each one is stored at
the same relative path under `assets/images/design/thumbnails/`, so the
catalogue lists only the full-size `image`. Site validation fails when a
catalogue image has no thumbnail.

Every project must have a unique lowercase `slug`. Opening a project adds that
slug to the design-page URL, for example `/design.html?project=example-project`.
That URL can be copied or shared and will reopen the same project modal. Keep
slugs stable after publishing so shared links do not break.

Each project can belong to any number of filter categories. Add them through
the `categories` array:

```json
{
  "slug": "example-project",
  "title": "Example project",
  "categories": ["Poster", "Music", "Experimental"]
}
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

```json
{
  "slug": "example-project",
  "title": "Example project",
  "categories": ["Poster", "Music"],
  "cardSize": "wide"
}
```

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

## Adding a physics note or essay

Copy `source-assets/templates/physics-note.html` into `_notes/` and give the copy
a lowercase, hyphenated filename, for example:

```sh
cp source-assets/templates/physics-note.html _notes/why-null-infinity-matters.html
```

Edit the front matter at the top and replace the example body with the note. The
research archive, note URL, and sitemap entry are generated automatically. Notes
are sorted newest first by `date`; `kind` can be `Note`, `Essay`, `Derivation`, or
another short label. Keep a published filename stable because it determines the
URL, such as `/notes/why-null-infinity-matters.html`.

The source may contain ordinary HTML. MathJax renders TeX on every note page:

```html
<p>Inline mathematics: \(E = mc^2\).</p>

\[
    G_{\mu\nu} = 8\pi T_{\mu\nu}.
\]
```

`$...$` and `$$...$$` delimiters are also enabled. Use `\(...\)` and `\[...\]`
when possible because their intent is unambiguous in prose. The note files are
local, but the lightweight setup downloads MathJax from its pinned CDN URL when
a reader opens a note, so a local preview needs an internet connection to render
the equations.

## Adding a presentation

Presentations are slide decks, such as Quarto reveal.js talks, that open as a
full page when their entry under "Presentations" on the research page is
clicked. Each deck is one self-contained HTML file in `presentations/`.

1. Render the deck as a single file. A normal Quarto render writes a
   `presentation.html` that depends on a `presentation_files/` folder, fonts,
   logos and videos next to it; `embed-resources` bundles all of them, videos
   included, into one file. In the folder with the `.qmd` file, run:

   ```sh
   quarto render presentation.qmd -M embed-resources:true -o aps-2027.html
   ```

   On screens narrower than 435px, such as a phone held upright, reveal.js
   switches to its "scroll view", which cuts off the top of a 16:9 title
   slide. To keep the normal slide view on phones, add this under
   `format: revealjs:` in the `.qmd` before rendering:

   ```yaml
       include-after-body:
         text: |
           <script>
             window.addEventListener("load", () => {
               Reveal.configure({ scrollActivationWidth: null });
               if (Reveal.isScrollView()) Reveal.toggleScrollView(false);
             });
           </script>
   ```

   Quarto's own `scroll-view: activation-width: 0` setting has no effect
   unless scroll view is turned on for every screen size, so the script is
   needed.

2. Copy the result into the site with a lowercase, hyphenated filename:

   ```sh
   cp ~/Dropbox/PhD/APS_2027_Presentation/aps-2027.html presentations/
   ```

3. Add an entry to `_data/presentations.yml`:

   ```yaml
   - title: "Inspiral of Eccentric, Spin-Precessing Black Hole Binaries without Averaging"
     description: With Leo C. Stein, University of Mississippi.
     date: 2027-01-01
     display_date: "2027"
     kind: Talk
     event: APS Global Physics Summit 2027, Atlanta, GA
     url: /presentations/aps-2027.html
   ```

   Entries are sorted newest first by `date`. `display_date` is shown exactly as
   written, so it can be `"2027"`, `Mar 2027`, or `16 Mar 2027`; without it the
   `date` is shown as `16 Mar 2027`. `kind` can be `Talk`, `Seminar`, `Poster`,
   or another short label, and `event` is optional.

4. Build and validate the site, then open the research page and click the new
   entry to check that the slides and any videos play:

   ```sh
   bundle exec jekyll build
   python3 scripts/validate_site.py _site
   ```

To update a deck, render it again and overwrite its file in `presentations/`.
Keep a published filename stable because it is the deck's URL.

Embedded videos make up most of a deck's size. GitHub warns about files over
50 MB and rejects files over 100 MB, so shorten or compress a long video before
rendering. For example, to re-encode a WebM video at a lower quality (a higher
`-crf` means a smaller file):

```sh
ffmpeg -i video.webm -c:v libvpx-vp9 -crf 40 -b:v 0 video-small.webm
```

Videos with a transparent background, such as the orbit animation, also need
`-pix_fmt yuva420p -auto-alt-ref 0` to keep their transparency.

## License

The website's source code is available under the MIT License. Written content,
research materials, historical articles, images, photographs, graphic-design
work, PDFs, and other creative assets are copyright © João D. Álvares and are
all rights reserved. Third-party materials remain the property of their
respective owners. See [`LICENSE`](LICENSE) for the complete terms.
