# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic website for William Theodor Lehn-Schiøler, hosted via GitHub Pages. Static HTML/CSS with two small vanilla scripts — no framework, no bundler. The only build step is `scripts/build_publications.py`, which generates publication markup from YAML. The current design is **v2.0**, shown in every page footer (`.version`); bump it there and in the generator's `FOOTER` together.

## Development

Open any `.html` file directly in a browser, or use a local server (required for the `fetch` in the animation):

```bash
python3 -m http.server 8000
```

Deploy by pushing to `main` — GitHub Pages serves the site automatically.

## EEG trace animation

The traces behind the home hero and inner page headers use **real EEG data** from `eeg.edf`.

- `export_eeg.py` — Python/MNE script that picks the most alpha-rich 20-second segment, bandpass-filters (0.5–40 Hz), downsamples to 128 Hz, normalises per-channel, and writes `eeg_data.json`
- `eeg_data.json` — pre-exported data (15 channels × 2560 samples); committed to the repo so the site works without Python
- `eeg-animation.js` — fetches `eeg_data.json` once and draws on every `canvas.eeg-canvas` (sized to its positioned parent; `data-channels="N"` limits channels). Loops with a 1-second crossfade, time-based speed, stroke colour from the `--trace` CSS variable (follows light/dark), pauses offscreen, and draws a still frame under `prefers-reduced-motion`. The fade-in from the left is a CSS mask on `.eeg-canvas`

To re-export (e.g. after replacing `eeg.edf`):
```bash
pip install mne
python3 export_eeg.py
```

## Architecture

Multi-page site sharing a single stylesheet:

- `index.html` — home: hero with photo and EEG traces, About, News (hand-written `.news` list), Research themes, Selected publications, BrainCapture `.feature` panel, Talks & media, Supervision. Hand-written **except** between `<!-- BEGIN selected-publications -->`/`<!-- END … -->` and `<!-- BEGIN media -->`/`<!-- END media -->`, which the generator replaces
- `publications.html` — **generated** by `scripts/build_publications.py` from `cv/publications.yaml`; do not edit by hand. Grouped into "Preprints & under review" and "Peer-reviewed" `.pub-group`s, each paper an `li.pub` (year column, title, authors, venue + badges, `.chips` links, optional `.pub-teaser`)
- `cv/media.yaml` — talks, films and features for the home page "Talks & media" section, either `youtube:` or a self-hosted `file:` (+ `poster:`) under `media/`; the section is omitted while the list is empty. Kept out of `publications.yaml` because `update_citations.py` treats every top-level key there as a list of papers
- `media/` — site images and video (BC-1 product photo, NeurIPS steering clip in light and dark versions, AI Denmark feature). Re-encode before adding: photos ≤1080 px, videos 1080p H.264 with `-movflags +faststart` (~15 MB for 2 min); GitHub rejects files over 100 MB, so never commit raw camera/4K files
- `media.js` — click-to-load video: YouTube embeds (`a.video[data-yt]` facades, self-hosted `a.video[data-src]` posters and `a.chip[data-yt]` toggles that open a player under a paper, via youtube-nocookie); nothing loads from YouTube until clicked, and without JS they are plain links. Also pauses autoplaying teaser clips under reduced motion
- `fonts/` — self-hosted Inter and Source Serif 4 (latin subset woff2); no third-party font requests
- `students.html` — a guide to starting a supervised project: research areas (`.area-list`), a numbered `.steps-list` of how a project gets started, a `.checklist` of what to send in a first email, report template downloads, and mutual expectations. Deliberately does **not** list specific project topics.
- `cv.html` — web version of the CV (Experience, Education, Volunteer, Publications summary) with a download button for `cv.pdf`; keep its content in sync with `cv/cv.typ`
- `cv/cv.typ` — Typst source for the two-page `cv.pdf`; publications come from `cv/publications.yaml`. Rebuild with `typst compile --root . cv/cv.typ cv.pdf` and commit the PDF
- `cv/publications.yaml` — single source for publications (CV and web page). `venue` is the short CV form, `web_venue` the longer web form, `tag` an optional badge
- `scripts/update_citations.py` — refreshes `citations` for peer-reviewed entries from Google Scholar via SerpAPI (needs `SERPAPI_KEY`); lists Scholar papers missing from the YAML but never adds them
- `.github/workflows/update-publications.yml` — runs the updater every Monday (or manually from the Actions tab), and if counts changed rebuilds `publications.html`, `index.html` and `cv.pdf` and pushes. Uses the `SERPAPI_KEY` repo secret
- `projects.html` — meta-refresh stub redirecting to `students.html` (keeps previously shared links working); do not add content here
- `templates/` — LaTeX and Typst student report templates linked from `students.html`; see `templates/README.md` for the expected filenames
- `style.css` — design tokens on `:root` (light by default, dark via `prefers-color-scheme`); every page shares the sticky `.site-nav`, a `.hero` or `.page-head` band, `.section` rows (label column + `.section-body`), and `.site-footer`

## Conventions

- Use the CSS variables, never raw colours: one accent (`--accent`, deep blue `#0b5c8c` light / `#7cb8e0` dark), neutrals `--text`/`--text-2`/`--text-3`/`--rule`, warm paper background `--bg`. No neon or secondary accent colours
- Type: `--serif` (Source Serif 4) for headings and venues, `--sans` (Inter) for everything else
- Nav and footer markup is duplicated in each hand-written page and in the generator's `NAV`/`FOOTER`; change them everywhere at once, and set `aria-current="page"` on the current page's nav link
- New publications go in `cv/publications.yaml` (under `preprints` or `peer_reviewed`), then run `python3 scripts/build_publications.py` and rebuild `cv.pdf`; the generator renders `.pub-citations` for published work and `.pub-tag` for a type badge (Preprint, Abstract). Optional per-paper fields: `featured` + `summary` (home page), `teaser` (small side thumbnail: image or short muted .mp4/.webm under `media/` — prefer video over GIF), `figure` + `figure_poster` + `figure_caption` (wide looping clip or image under the paper, drawn on the page background; `figure_dark` + `figure_dark_poster` add a dark-theme version, toggled by `.only-light`/`.only-dark`), `video` (YouTube ID/URL), `pdf`, `code`, `project`, `poster`, `slides`
- Author lists bold the site owner: `<strong>W Lehn-Schiøler</strong>`
- Cards, section headings, and lists are shared across pages — reuse `.section`, `.section-title`, `.section-lead`, `.section-note`, `.card`/`.cards`, `.entries`, `.chips`, and `.btn` rather than adding page-specific styles
