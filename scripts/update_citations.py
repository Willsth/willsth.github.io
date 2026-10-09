"""Refresh Google Scholar citation counts in cv/publications.yaml via SerpAPI.

Only peer-reviewed entries are updated, matched to Scholar articles by title.
Scholar articles that match nothing in the YAML are listed as possible new
papers, but never added automatically.

Usage (from the repo root):
    SERPAPI_KEY=... python3 scripts/update_citations.py
"""

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
YAML_PATH = ROOT / "cv" / "publications.yaml"
SCHOLAR_ID = "7K_-v1UAAAAJ"


def norm(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())


def fetch_articles(key):
    query = urllib.parse.urlencode({
        "engine": "google_scholar_author",
        "author_id": SCHOLAR_ID,
        "num": 100,
        "api_key": key,
    })
    with urllib.request.urlopen(f"https://serpapi.com/search.json?{query}", timeout=60) as r:
        data = json.load(r)
    if "error" in data:
        sys.exit(f"SerpAPI error: {data['error']}")
    articles = data.get("articles") or []
    if not articles:
        sys.exit("SerpAPI returned no articles; leaving publications.yaml untouched.")
    return {norm(a["title"]): (a["title"], (a.get("cited_by") or {}).get("value") or 0) for a in articles}


def set_citations(text, title, count):
    """Set `citations:` in the YAML entry for `title`, keeping comments and layout."""
    lines = text.split("\n")
    start = next(i for i, l in enumerate(lines) if l.strip().startswith("- title:") and norm(l.split(":", 1)[1]) == norm(title))
    end = next((i for i in range(start + 1, len(lines)) if not lines[i].startswith("    ")), len(lines))
    for i in range(start + 1, end):
        if lines[i].strip().startswith("citations:"):
            lines[i] = f"    citations: {count}"
            return "\n".join(lines)
    year = next(i for i in range(start + 1, end) if lines[i].strip().startswith("year:"))
    lines.insert(year + 1, f"    citations: {count}")
    return "\n".join(lines)


def main():
    key = os.environ.get("SERPAPI_KEY")
    if not key:
        sys.exit("SERPAPI_KEY is not set.")

    text = YAML_PATH.read_text(encoding="utf-8")
    data = yaml.safe_load(text)
    scholar = fetch_articles(key)
    known = {norm(p["title"]) for group in data.values() for p in group}

    changes = []
    for p in data["peer_reviewed"]:
        match = scholar.get(norm(p["title"]))
        if match is None:
            print(f"not on Scholar profile: {p['title']}")
            continue
        count = match[1]
        if count and count != p.get("citations"):
            changes.append(f"{p['title']}: {p.get('citations', 0)} -> {count}")
            text = set_citations(text, p["title"], count)

    new = [t for k, (t, _) in scholar.items() if k not in known]

    YAML_PATH.write_text(text, encoding="utf-8")
    report = ["Citation changes:"] + [f"  {c}" for c in changes or ["none"]]
    if new:
        report += ["On Scholar but not in publications.yaml (add by hand if wanted):"] + [f"  {t}" for t in new]
    print("\n".join(report))

    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("```\n" + "\n".join(report) + "\n```\n")


if __name__ == "__main__":
    main()
