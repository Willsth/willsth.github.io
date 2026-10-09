# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic website for William Theodor Lehn-Schiøler, hosted via GitHub Pages. Static HTML/CSS — no build step, no framework, no JavaScript.

## Development

Open any `.html` file directly in a browser, or use a local server (required for the `fetch` in the animation):

```bash
python3 -m http.server 8000
```

Deploy by pushing to `main` — GitHub Pages serves the site automatically.

## EEG background animation

The animated background uses **real EEG data** from `eeg.edf`.

- `export_eeg.py` — Python/MNE script that picks the most alpha-rich 20-second segment, bandpass-filters (0.5–40 Hz), downsamples to 128 Hz, normalises per-channel, and writes `eeg_data.json`
- `eeg_data.json` — pre-exported data (15 channels × 2560 samples); committed to the repo so the site works without Python
- `eeg-animation.js` — fetches `eeg_data.json`, loops with a 1-second crossfade at the boundary, renders on a HiDPI canvas (`devicePixelRatio` scaled), 10 seconds of EEG visible per screen width

To re-export (e.g. after replacing `eeg.edf`):
```bash
pip install mne
python3 export_eeg.py
```

## Architecture

Multi-page site sharing a single stylesheet:

- `index.html` — landing page with profile photo, title, research blurb, and links to LinkedIn, Google Scholar, publications, and the students page
- `publications.html` — **generated** by `scripts/build_publications.py` from `cv/publications.yaml`; do not edit by hand. Publication list grouped under `.section-title` headings ("Preprints & Under Review", "Peer-Reviewed"), each entry a `.project-card` with `.pub-meta` / `.pub-authors` / `.pub-venue` and a `.paper-links` block
- `students.html` — a guide to starting a supervised project: research areas (`.area-list`), a numbered `.steps-list` of how a project gets started, a `.checklist` of what to send in a first email, report template downloads, and mutual expectations. Deliberately does **not** list specific project topics.
- `cv.html` — web version of the CV (Experience, Education, Volunteer, Publications summary) with a download button for `cv.pdf`; keep its content in sync with `cv/cv.typ`
- `cv/cv.typ` — Typst source for the two-page `cv.pdf`; publications come from `cv/publications.yaml`. Rebuild with `typst compile --root . cv/cv.typ cv.pdf` and commit the PDF
- `cv/publications.yaml` — single source for publications (CV and web page). `venue` is the short CV form, `web_venue` the longer web form, `tag` an optional badge
- `scripts/update_citations.py` — refreshes `citations` for peer-reviewed entries from Google Scholar via SerpAPI (needs `SERPAPI_KEY`); lists Scholar papers missing from the YAML but never adds them
- `.github/workflows/update-publications.yml` — runs the updater every Monday (or manually from the Actions tab), and if counts changed rebuilds `publications.html` and `cv.pdf` and pushes. Uses the `SERPAPI_KEY` repo secret
- `projects.html` — meta-refresh stub redirecting to `students.html` (keeps previously shared links working); do not add content here
- `templates/` — LaTeX and Typst student report templates linked from `students.html`; see `templates/README.md` for the expected filenames
- `style.css` — dark theme; canvas `#eeg-bg` is `position: fixed` behind all content

## Conventions

- Color palette: `#0e6fa8` (primary blue), `#3ecfa0` (teal for card accents and list markers), `#080d18` (background)
- New publications go in `cv/publications.yaml` (under `preprints` or `peer_reviewed`), then run `python3 scripts/build_publications.py` and rebuild `cv.pdf`; the generator renders `.pub-citations` for published work and `.pub-tag` for a type badge (Preprint, Abstract)
- Author lists bold the site owner: `<strong>W Lehn-Schiøler</strong>`
- Cards, section headings, and lists are shared across pages — reuse `.section-title`, `.section-lead`, and `.section-note` rather than adding page-specific styles
