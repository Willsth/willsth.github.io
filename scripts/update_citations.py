"""Refresh Google Scholar citation counts in cv/publications.yaml, and the profile
metrics in cv/metrics.json, via SerpAPI.

metrics.json holds the profile totals (citations, h-index, i10-index), citations
per year, and a history entry whenever the totals change; publications.html
renders it as the metrics panel.

Only peer-reviewed entries are updated, matched to Scholar articles by title
(or by `scholar_title` when Scholar lists the paper under a different title).
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
from datetime import date
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
YAML_PATH = ROOT / "cv" / "publications.yaml"
METRICS_PATH = ROOT / "cv" / "metrics.json"
SCHOLAR_ID = "7K_-v1UAAAAJ"


def norm(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())


def fetch_profile(key):
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
    if not data.get("articles"):
        sys.exit("SerpAPI returned no articles; leaving publications.yaml untouched.")
    return data


def articles_by_title(profile):
    return {norm(a["title"]): (a["title"], (a.get("cited_by") or {}).get("value") or 0) for a in profile["articles"]}


def update_metrics(profile):
    """Write the profile totals and citations per year; append to history when the totals change."""
    cited = profile.get("cited_by") or {}
    table = {name: (vals or {}).get("all") for row in cited.get("table") or [] for name, vals in row.items()}
    totals = {k: table.get(k) for k in ("citations", "h_index", "i10_index")}
    if None in totals.values():
        print("SerpAPI returned no profile metrics; leaving metrics.json untouched.")
        return
    metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8")) if METRICS_PATH.exists() else {"history": []}
    today = date.today().isoformat()
    if not metrics["history"] or {k: metrics["history"][-1][k] for k in totals} != totals:
        metrics["history"].append({"date": today, **totals})
    metrics.update(
        source="Google Scholar",
        updated=today,
        **totals,
        per_year={str(g["year"]): g.get("citations", 0) for g in cited.get("graph") or []},
    )
    keys = ("source", "updated", "citations", "h_index", "i10_index", "per_year", "history")
    METRICS_PATH.write_text(json.dumps({k: metrics[k] for k in keys}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


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
    profile = fetch_profile(key)
    scholar = articles_by_title(profile)
    known = {norm(p.get("scholar_title", p["title"])) for group in data.values() for p in group}

    changes = []
    for p in data["peer_reviewed"]:
        match = scholar.get(norm(p.get("scholar_title", p["title"])))
        if match is None:
            print(f"not on Scholar profile: {p['title']}")
            continue
        count = match[1]
        if count and count != p.get("citations"):
            changes.append(f"{p['title']}: {p.get('citations', 0)} -> {count}")
            text = set_citations(text, p["title"], count)

    new = [t for k, (t, _) in scholar.items() if k not in known]

    YAML_PATH.write_text(text, encoding="utf-8")
    update_metrics(profile)
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
