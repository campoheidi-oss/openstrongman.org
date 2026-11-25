# OpenStrongman: notes for Claude Code

This file is read automatically by Claude Code at the start of every session.
**This repo is public.** Keep this file to technical facts only: no personal
names, affiliations, outreach, strategy, or unpublished ideas.

## What this project is

An open, downloadable database of strongman competition results, modeled on
OpenPowerlifting. The audience is researchers first, fans second. Data is
CC0 (public domain); site code is MIT. Full texts are in `DATA-LICENSE` (data) and `LICENSE` (code). The project is credited
as "OpenStrongman" everywhere, never as an individual.

## How the site works

- Static site on GitHub Pages, served from the `main` branch at
  openstrongman.org (`CNAME`). No backend, no database, no accounts.
- Plain HTML, CSS (`style.css`), and vanilla JavaScript. **No frameworks and no
  build-time dependencies.** The one external library is `flag-icons` (CSS,
  from cdnjs) on `rankings.html`.
- Pages read the CSVs in the browser. `manifest.json` lists every data file;
  add new CSVs there and every page picks them up.
- Load data with same-site relative paths (`data/...`), never
  `raw.githubusercontent.com` URLs.

## Files

| Path | Purpose |
| --- | --- |
| `data/*.csv` | The dataset, one file per competition or year |
| `data/DATA-RULES.md` | The data rulebook for people and AI assistants |
| `CONTRIBUTING.md` | Step-by-step guide for contributors |
| `CONTRIBUTORS.md` | Opt-in credit list (CRediT roles, ORCID) |
| `CITATION.cff` | Citation metadata, read by GitHub and Zenodo |
| `roadmap.json` | Source for the Research Roadmap; edit this, not `roadmap.html` |
| `scripts/build.js` | Generates the parts listed below |
| `.github/workflows/build.yml` | Runs the build on every push to `main` |

## The automatic build

`node scripts/build.js` (also run by GitHub Actions on push) regenerates:
the baked roadmap in `roadmap.html`, the Dataset markup in `index.html`,
`sitemap.xml`, `llms.txt`, and section 8 of `data/DATA-RULES.md`. It only
edits text between `<!-- BUILD:name -->` and `<!-- /BUILD:name -->` markers.
**Never hand-edit generated sections.** Run the build locally after changes
to check it still works.

## Data rules (summary; `data/DATA-RULES.md` is the authority)

- Never invent, guess, or fill in results from memory. Blank beats a guess.
- Log results exactly as competed (no unit conversion of results).
- Names in plain English letters, spelled to match existing rows.
- Unknown parts of a date use `00` (for example `2011-00-00`).
- `WeightClassKg` stays blank for open-division elite events.
- Structured values go in their columns, never in `Notes`.
- `Sex` is stored as `M`/`F` and shown as Male/Female. Use "sex", never
  "gender".
- Keep each CSV's existing line endings so diffs stay small.
- Changing existing data rows is the maintainer's call: flag, don't fix.

## Writing style for site text

- No em dashes in text written for the site.
- Plain, direct language. Cite standards and research with links.
- AI use is disclosed on `data.html`; keep that section accurate.

## Working in this repo

- Work on a branch and open a pull request; don't commit straight to `main`
  unless the maintainer asks.
- Show the maintainer what will change before committing or pushing.
- Never commit secrets, personal information, or private notes.
