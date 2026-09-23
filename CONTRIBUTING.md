# Contributing data to OpenStrongman

This guide covers how to add one competition's results to OpenStrongman: find sources, enter the data in our schema, check it, and submit it on GitHub for review. Follow it exactly so every file in the database looks and behaves the same.

It can feel like a lot at first, but after one or two competitions it becomes routine. Nothing goes live until the project lead approves your pull request, so you can't break the site by submitting.

**Two documents, two jobs:**

- **This guide** is the process: setup, entry, checks, submitting, review.
- **[data/DATA-RULES.md](data/DATA-RULES.md)** is the data rulebook: every column, every event type, edge cases, examples, and the current spellings in use. It is also the file you attach when using an AI assistant. If anything here conflicts with it, the rulebook wins.

| Step | What happens | Who |
| --- | --- | --- |
| 1 | Find official sources | You |
| 2 | Enter rows in the template | You |
| 3 | Run the quality checks | You |
| 4 | Upload the CSV and update manifest.json | You |
| 5 | Open a pull request | You |
| 6 | Review and merge | Project lead |
| 7 | Site rebuilds automatically | Automatic |

One CSV file holds one competition stage (for example, 2025 World's Strongest Man Finals).

## Before you start

You need a free GitHub account and collaborator access to the repo. No coding or software installs are required.

1. Create a GitHub account at [github.com](https://github.com) and send your username to the project lead.
2. Accept the collaborator invite for [campoheidi-oss/openstrongman.org](https://github.com/campoheidi-oss/openstrongman.org) (it arrives by email). Contributors without collaborator access can fork the repo and open a pull request from the fork instead.
3. Use Google Sheets for data entry. It exports clean CSV files. Excel works too, but see the warnings in Common mistakes.
4. Read one finished file before you start, such as [data/wsm_2024_finals.csv](data/wsm_2024_finals.csv). Import it into Sheets and use it as your template: delete the data rows and keep the header row.
5. Read [data/DATA-RULES.md](data/DATA-RULES.md) once, start to finish.
6. Optional: get a free [ORCID iD](https://orcid.org/register) if you want citable credit (see Contributor credit below).

## The rules that matter most

The full rules are in [data/DATA-RULES.md](data/DATA-RULES.md). These five cause the most trouble:

- **Blank means not published.** Never guess, estimate, or fill in "the obvious." A blank cell is always better than a wrong one.
- **Results are logged exactly as competed.** Record the result in the units the competition published.
- **Categories describe the movement, not the implement.** A log press is Overhead Press; the log goes in Implement.
- **One person, one spelling.** Reuse the exact athlete, event, and competition spellings listed in section 8 of the rulebook. Names use plain English letters, no accents.
- **World records need three judges.** Mark WorldRecord Y only for a result set at a sanctioned competition or an officially organized record attempt with at least three judges. Gym lifts never count.

## Building a dataset, step by step

1. **Gather sources.** Use the most official source available, in this order: the federation's published results or scoresheet, then the official livestream or federation social posts, then reputable media. Cross-check against a second source whenever one exists. Save every link; you will list them in your pull request. Many results are open public records. Recent US amateur results are often on Iron Podium. Older NAS, Strongman Corporation, and USS records may exist only as a PDF on one person's computer; ask the owner for a copy and for permission to publish it.
2. **Start from the template.** Make a copy of your template sheet with the header row only.
3. **Format columns as plain text** before typing (in Sheets: select all, then Format > Number > Plain text). This stops dates like 2024-05-00 and codes from being auto-converted.
4. **Enter one row per athlete per event.** Work event by event, from first place down. Copy the competition columns (MeetName through Division) down every row so each row stands on its own. Use section 5 of the rulebook for DNFs, ties, stones, no lifts, and withdrawals.
5. **Fill OverallPlace on every row** for that athlete, not just their last event.
6. **Name the file** in lowercase with underscores: `<competition>_<year>_<stage>.csv`. Examples: `wsm_2025_finals.csv`, `rogue_2024_finals.csv`, `arnold_uk_2025_finals.csv`, `wsm_2025_qualifier_group1.csv`.
7. **Export as CSV.** In Sheets: File > Download > Comma-separated values (.csv). Check that the downloaded file name still ends in `.csv`.

## Using an AI assistant

An LLM such as Claude (Sonnet or Opus) makes this process much faster, especially for pulling and sorting public records. The rule: **the LLM does the typing, a human does the verifying.** Every value in the file must trace back to a source document you opened yourself.

**How to use it**

1. Start a new chat and attach [data/DATA-RULES.md](data/DATA-RULES.md). Download it from GitHub, or paste its contents. Always use the current version from the repo, not an old copy.
2. Attach or paste the official results, then send:

```text
Using the attached OpenStrongman Data Rules, convert this source into rows for the competition below. Follow section 1 exactly.

Competition: <name, year, stage>
Source: <attached or pasted below>
```

3. Read the assistant's **Issues to check** list and resolve every item against the source.
4. Paste the CSV into your sheet and compare every row against the source with your own eyes before submitting.

**Proper use**

- Pulling a results table from a page or PDF you give it, and reshaping it into our columns.
- Reformatting: dates to YYYY-MM-DD, countries to IOC codes, implement weights from lbs to kg.
- Suggesting an EventCategory for each event, which you then confirm.
- Running the quality checks: row counts, point totals, placings, and spelling matches.
- Drafting your pull request description.

**Improper use**

- Asking for results from memory ("What were the 2005 WSM results?"). LLMs invent believable numbers, names, and dates. Only give it source material, never a question.
- Letting it fill blanks, estimate bodyweights, or guess missing values. Blank stays blank.
- Letting it decide whether a result is a world record.
- Accepting sources it names without opening them. If it cites a link, open it and confirm the numbers yourself.
- Submitting any row you have not compared against the source with your own eyes.
- Pasting in someone's private files (such as scanned scoresheets) without their permission. Once merged, the data is public domain, so the owner must agree to that too.

**Disclosure:** say in your pull request whether you used an LLM, which one, and for which steps. This keeps the dataset transparent for the researchers who use it.

## Quality checks before submitting

Run the self-check in [section 7 of the rulebook](data/DATA-RULES.md#7-self-check-before-submitting), then these. Section 8 of the rulebook also lists any known problem rows in existing files; don't copy their patterns.

- [ ] Every row compared against the source by eye, including any LLM-assisted rows.
- [ ] Athlete, event, and competition spellings match section 8 of the rulebook.
- [ ] Open the CSV in a plain text editor: the first line is the exact header row, and nothing looks garbled.

## Submitting to the repo

You submit two things on one branch: the new CSV, and one added line in `manifest.json`. The site only loads files listed in the manifest.

**1. Upload the CSV to a new branch**

1. In the repo's file list, click the **`data` folder** (it has a folder icon). Do not open `data.html`, which is a web page with a similar name. The two sit close together in the list and are easy to mix up.
2. Double-check before uploading: the path at the top of the page should read `openstrongman.org / data /`. Then click **Add file > Upload files** and drag in your CSV.
3. Under "Commit changes," pick **Create a new branch for this commit and start a pull request**. Name the branch after the file, for example `add-wsm-2025-finals`.
4. Click **Propose changes**. Don't open the pull request yet.

**2. Add the file to manifest.json on the same branch**

1. Use the branch dropdown (top left of the file list) to switch to your new branch.
2. Open `manifest.json` and click the pencil icon to edit.
3. Add your file as a new line, keeping the same format. Every line ends in a comma except the last one.

```json
[
  "data/wsm_2026_finals.csv",
  "data/world_record_events.csv",
  "data/wsm_2025_qualifier_group1.csv"
]
```

4. Click **Commit changes** and choose **Commit directly to** your branch (not main).

**3. Open the pull request**

Click **Compare & pull request** and fill in the description with this template:

```text
Competition: 2025 World's Strongest Man Finals
File: data/wsm_2025_finals.csv (60 rows)
Sources:
- <official results link>
- <second source link>
AI use: <model and which steps, or "none">
Unsure about: <anything you could not confirm, or "nothing">
Credit: <"list me" with name, ORCID iD, role, or "no credit">
```

The project lead reviews it, may leave comments on specific rows, and merges it when it's ready. To fix something after review, edit the file on the same branch; the pull request updates on its own.

## After your data is merged

The site updates itself within about 5 minutes of the merge. An automatic build recalculates the homepage stats, the dataset listing for search engines, the sitemap, and the spelling lists in the rulebook. You don't need to touch any other file.

To confirm it worked:

1. In the repo's **Actions** tab, the newest "Build generated files" run shows a green check.
2. On [openstrongman.org/rankings.html](https://openstrongman.org/rankings.html), switch to All Results and filter to your competition. Every event and athlete appears.
3. On [Explore](https://openstrongman.org/explore.html), chart your competition once as a spot check.

If a run shows a red X or your competition is missing, tell the project lead. The usual cause is a missing comma in `manifest.json` or a misspelled file name.

**Contributor credit** is opt-in. If you asked for credit in your pull request, you'll be added to [CONTRIBUTORS.md](CONTRIBUTORS.md) with your role, such as Data curation or Validation. With an ORCID iD, you're also included in the dataset's citable releases.

## Common mistakes

| Mistake | What happens | Fix |
| --- | --- | --- |
| File uploaded without `.csv` at the end | Site can't find the file | Rename it in GitHub (pencil icon, edit the name box) |
| Opened `data.html` instead of the `data` folder, or uploaded to the main folder | File lands in the wrong place; site can't find it | Upload inside the `data` folder; the path at the top should read `openstrongman.org / data /` |
| Missing or extra comma in `manifest.json` | No data loads anywhere on the site | Every line ends in a comma except the last |
| Excel changed dates or number formats | Wrong dates, broken numbers | Use Google Sheets, or in Excel set columns to Text and save as "CSV UTF-8" |
| Event categorized by implement (a "Log" category) | Breaks cross-competition comparisons | Categorize by movement; the implement goes in Implement |
| Estimated bodyweights or weight classes | Invented data in a research dataset | Leave blank unless officially published |
| Units typed into ResultValue ("41.26 sec") | Charts and rankings can't read the number | Number in ResultValue, unit in ResultUnit |
| New spelling for an existing athlete | One person shows up as two | Copy the spelling from section 8 of the rulebook |
| Committed straight to main | Skips review | Always choose "Create a new branch" |

## Quick reference checklist

- [ ] Official source found, second source checked, links saved
- [ ] Template header row used; all columns formatted as plain text
- [ ] One row per athlete per event; competition columns filled on every row
- [ ] Rulebook self-check passed, and every row compared against the source by eye
- [ ] File named `<competition>_<year>_<stage>.csv` and exported as CSV
- [ ] CSV uploaded inside the `data` folder (not `data.html`) on a new branch
- [ ] `manifest.json` updated on the same branch
- [ ] Pull request opened with the description template filled in
- [ ] After merge: green check in Actions, competition visible on Rankings

Questions go to the project lead or into a GitHub issue.
