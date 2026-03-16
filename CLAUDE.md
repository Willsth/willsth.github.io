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

Two-page site sharing a single stylesheet:

- `index.html` — landing page with profile photo, title, and links to LinkedIn, Google Scholar, and the projects page
- `projects.html` — lists student project/thesis opportunities, each as a `.project-card` with paper reference links
- `style.css` — dark theme; canvas `#eeg-bg` is `position: fixed` behind all content

## Conventions

- Color palette: `#0e6fa8` (primary blue), `#3ecfa0` (teal for project card accents), `#080d18` (background)
- New project cards go inside `.projects-list` in `projects.html`, following the existing `.project-card` pattern with a `.paper-links` block for arXiv references
