#!/usr/bin/env node
/*
 * OpenStrongman build step.
 *
 * GitHub Pages only serves static files, so this script does the "backend" work
 * ahead of time. It runs automatically on every push (see .github/workflows/build.yml)
 * and can also be run by hand:  node scripts/build.js
 *
 * What it generates:
 *   - roadmap.html   the full roadmap baked in as plain HTML (from roadmap.json),
 *                    plus structured data describing the page and its citations
 *   - index.html     schema.org Dataset markup (for Google Dataset Search and
 *                    other academic indexes), computed from manifest.json and the CSVs
 *   - sitemap.xml    every page, for search engines
 *   - llms.txt       a plain-language summary of the site for AI assistants
 *   - data/DATA-RULES.md  section 8: federations, competitions, event categories,
 *                    and athlete spellings currently in the data, so people and
 *                    AI assistants reuse them, plus a list of rows that break
 *                    the rules (checked automatically; each flag clears once fixed)
 *
 * Only text between <!-- BUILD:name --> and <!-- /BUILD:name --> markers is touched.
 * No dependencies beyond Node itself.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://openstrongman.org';
const REPO = 'https://github.com/campoheidi-oss/openstrongman.org';
const RoadmapRender = require(path.join(ROOT, 'roadmap-render.js'));

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => {
  const p = path.join(ROOT, f);
  const before = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (before === s) return false;
  fs.writeFileSync(p, s);
  return true;
};

function inject(html, name, content, file) {
  const re = new RegExp('(<!-- BUILD:' + name + ' -->)[\\s\\S]*?(<!-- /BUILD:' + name + ' -->)');
  if (!re.test(html)) throw new Error('Missing BUILD:' + name + ' markers in ' + file);
  return html.replace(re, (_, a, b) => a + content + b);
}

function jsonLd(obj) {
  // Escape "<" so no string inside can close the script tag early.
  return '\n<script type="application/ld+json">\n' + JSON.stringify(obj, null, 2).replace(/</g, '\\u003c') + '\n</script>\n';
}

// ── CSV (handles quoted fields, commas and newlines inside quotes) ──
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v !== '')) rows.push(row);
  const head = rows.shift() || [];
  return { head, rows: rows.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()]))) };
}

// ── CITATION.cff (only the few scalar fields we need) ──
function citationField(cff, key) {
  const m = cff.match(new RegExp('^' + key + ':\\s*"?([^"\\n]+?)"?\\s*$', 'm'));
  return m ? m[1] : null;
}

function gitDate(file) {
  try {
    const d = execSync('git log -1 --format=%cs -- "' + file + '"', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return d || null;
  } catch (e) { return null; }
}

const changed = [];

// ════════════════════════════════════════════
// 1. Dataset facts from manifest.json + CSVs
// ════════════════════════════════════════════
const manifest = JSON.parse(read('manifest.json'));
const cff = read('CITATION.cff');
const version = citationField(cff, 'version');
const released = citationField(cff, 'date-released');
const doi = citationField(cff, 'doi');

const feds = new Set(), meets = new Set(), eventMeets = new Set(), athletes = new Set(), nations = new Set();
let years = [], eventResults = 0, columns = new Set();
const files = manifest.map((f) => {
  const { head, rows } = parseCSV(read(f));
  head.forEach((h) => h && columns.add(h.trim()));
  rows.forEach((r) => {
    if (r.MeetFederation) feds.add(r.MeetFederation);
    if (r.MeetName) meets.add(r.MeetName + '|' + r.MeetDate);
    if (r.AthleteName) athletes.add(r.AthleteName);
    if (r.AthleteNationality) nations.add(r.AthleteNationality);
    const y = parseInt((r.MeetDate || '').slice(0, 4), 10);
    if (y > 1900) years.push(y);
    if (r.Event && r.Event !== 'Overall') { eventResults++; eventMeets.add(r.MeetName + '|' + r.MeetDate); }
  });
  return { file: f, rows: rows.length };
});
const listJoin = (a) => a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
const fedList = listJoin([...feds].sort());
const minYear = Math.min.apply(null, years);
const maxYear = Math.max.apply(null, years);

function prettyName(f) {
  const base = path.basename(f, '.csv');
  const words = base.split('_').map((w) => {
    if (w === 'wsm') return "World's Strongest Man";
    if (w === 'rogue') return 'Rogue';
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  return words.join(' ');
}

const datasetDescription =
  'OpenStrongman is an open, public-domain (CC0) database of strongman competition results. ' +
  'Results are recorded event by event exactly as contested (weights, times, distances, repetitions), ' +
  'with a consistent biomechanical event category system that makes results comparable across ' +
  'federations and implements. Current coverage includes ' + eventResults.toLocaleString('en-US') +
  ' event-level results from ' + eventMeets.size + ' competitions (' + fedList + '), plus overall placings back to ' + minYear +
  ', covering ' + athletes.size + ' athletes from ' + nations.size + ' nations through ' + maxYear + '. ' +
  'The dataset is built for research on strength sport performance, including athlete career trajectories, ' +
  'record progression, and cross-federation comparisons. It is actively growing to include qualifiers, ' +
  'more federations, and historical results. A companion Research Roadmap lists open questions in ' +
  'strongman science that the data can help answer: ' + SITE + '/roadmap.html';

const dataset = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'OpenStrongman: An Open Database of Strongman Competition Results',
  alternateName: 'OpenStrongman',
  description: datasetDescription,
  url: SITE + '/',
  sameAs: REPO,
  license: 'https://creativecommons.org/publicdomain/zero/1.0/',
  isAccessibleForFree: true,
  creator: { '@type': 'Organization', name: 'OpenStrongman Project', url: SITE },
  publisher: { '@type': 'Organization', name: 'OpenStrongman Project', url: SITE },
  keywords: [
    'strongman', 'strength sports', 'strongman competition results', "World's Strongest Man",
    'sports science', 'exercise science', 'kinesiology', 'athletic performance', 'open data',
    'sports statistics', 'thesis dataset', 'strength and conditioning research'
  ],
  temporalCoverage: minYear + '/' + maxYear,
  spatialCoverage: { '@type': 'Place', name: 'Worldwide' },
  variableMeasured: [...columns],
  measurementTechnique: 'Manual entry from official competition results, federation publications, and record event reports, following a published schema',
  distribution: files.map((f) => ({
    '@type': 'DataDownload',
    name: prettyName(f.file),
    encodingFormat: 'text/csv',
    contentUrl: SITE + '/' + f.file
  })),
  citation: SITE + '/CITATION.cff'
};
if (version) dataset.version = version;
if (released) dataset.dateModified = released;
if (doi) dataset.identifier = 'https://doi.org/' + doi.replace(/^https?:\/\/doi\.org\//, '');

let index = read('index.html');
index = inject(index, 'jsonld', jsonLd([dataset, {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'OpenStrongman',
  url: SITE + '/',
  description: 'Open database of strongman competition results, built for fans and researchers.'
}]), 'index.html');
if (write('index.html', index)) changed.push('index.html');

// ════════════════════════════════════════════
// 2. Roadmap baked into roadmap.html
// ════════════════════════════════════════════
const roadmapData = JSON.parse(read('roadmap.json'));
const rm = RoadmapRender.build(roadmapData);
let roadmap = read('roadmap.html');
roadmap = inject(roadmap, 'roadmap-main', rm.main, 'roadmap.html');
roadmap = inject(roadmap, 'roadmap-fields', rm.fieldRows, 'roadmap.html');
roadmap = inject(roadmap, 'roadmap-method', rm.method, 'roadmap.html');
roadmap = inject(roadmap, 'roadmap-refs', rm.refs, 'roadmap.html');
roadmap = roadmap.replace(/<div id="roadmap-root"[^>]*>/, '<div id="roadmap-root" data-src-hash="' + rm.hash + '">');

const topicList = roadmapData.risks.map((r) => r.title.toLowerCase());
roadmap = inject(roadmap, 'jsonld', jsonLd({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Strongman Research Roadmap: Open Questions and Knowledge Gaps',
  url: SITE + '/roadmap.html',
  description: 'A structured map of what is known and unknown in strongman science, modeled on NASA\'s Human Research Roadmap. ' +
    rm.counts.risks + ' risk areas and ' + rm.counts.gaps + ' knowledge gaps covering ' + topicList.join(', ') +
    ', each with the studies or data needed to close it. Intended for graduate students and researchers looking for thesis and dissertation topics.',
  dateModified: roadmapData.lastReviewed,
  isPartOf: { '@type': 'WebSite', name: 'OpenStrongman', url: SITE + '/' },
  about: [
    { '@type': 'Thing', name: 'Strongman (strength sport)' },
    { '@type': 'Thing', name: 'Sports medicine' },
    { '@type': 'Thing', name: 'Exercise science' }
  ],
  audience: { '@type': 'Audience', audienceType: 'Graduate students and researchers in exercise science, kinesiology, and sports medicine' },
  citation: roadmapData.references.filter((r) => r.doi).map((r) => ({
    '@type': 'ScholarlyArticle',
    name: r.text,
    sameAs: 'https://doi.org/' + r.doi
  }))
}), 'roadmap.html');
if (write('roadmap.html', roadmap)) changed.push('roadmap.html');

// ════════════════════════════════════════════
// 3. sitemap.xml
// ════════════════════════════════════════════
const PAGE_PRIORITY = { 'index.html': '1.0', 'roadmap.html': '0.9', 'rankings.html': '0.8', 'records.html': '0.8', 'explore.html': '0.7', 'data.html': '0.7', 'downloads.html': '0.7', 'about.html': '0.6', 'meets.html': '0.6', 'athletes.html': '0.6' };
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort((a, b) => (PAGE_PRIORITY[b] || '0.5').localeCompare(PAGE_PRIORITY[a] || '0.5') || a.localeCompare(b));
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map((p) => {
    const loc = SITE + '/' + (p === 'index.html' ? '' : p);
    const lm = gitDate(p);
    return '  <url>\n    <loc>' + loc + '</loc>\n' + (lm ? '    <lastmod>' + lm + '</lastmod>\n' : '') +
      '    <priority>' + (PAGE_PRIORITY[p] || '0.5') + '</priority>\n  </url>';
  }).join('\n') + '\n</urlset>\n';
if (write('sitemap.xml', sitemap)) changed.push('sitemap.xml');

// ════════════════════════════════════════════
// 4. llms.txt (plain-language guide for AI assistants)
// ════════════════════════════════════════════
const PATH_WORDS = { osm: 'answerable with OpenStrongman data', field: 'needs a new OpenStrongman data field', external: 'needs outside lab, clinical, or survey research' };
let llms = '# OpenStrongman\n\n' +
  '> OpenStrongman (openstrongman.org) is a free, open, public-domain (CC0) database of strongman competition results, recorded event by event, built for researchers as well as fans. It also publishes a Research Roadmap of open questions in strongman science, intended to help graduate students and researchers find thesis and dissertation topics.\n\n' +
  'Strongman is one of the least studied strength sports. Only a few dozen peer-reviewed papers deal with it, and no structured, downloadable results dataset existed before OpenStrongman. ' +
  'The project is modeled on OpenPowerlifting, whose open data has supported published research on career trajectories, normative strength standards, and scoring systems.\n\n' +
  'Current coverage: ' + eventResults.toLocaleString('en-US') + ' event-level results from ' + eventMeets.size + ' competitions (' + fedList + '), plus overall placings back to ' + minYear + '; ' +
  athletes.size + ' athletes from ' + nations.size + ' nations. Coverage is growing; qualifiers, more federations, and historical results are being added.\n\n' +
  '## Key pages\n\n' +
  '- [Research Roadmap](' + SITE + '/roadmap.html): ' + rm.counts.risks + ' risk areas and ' + rm.counts.gaps + ' knowledge gaps in strongman science, each with cited evidence and the studies or data needed to close it. Every gap has a stable ID (for example INJ-2) and a direct link.\n' +
  '- [Explore](' + SITE + '/explore.html): build charts from the data without code.\n' +
  '- [Rankings](' + SITE + '/rankings.html): filterable results and world records.\n' +
  '- [About](' + SITE + '/about.html): mission, data collection methods, and how to contribute.\n' +
  '- [Source repository](' + REPO + '): all data, schema, and site code.\n' +
  '- [Contributor guide](' + REPO + '/blob/main/CONTRIBUTING.md): how to add competition results.\n' +
  '- [Data rules](' + REPO + '/blob/main/data/DATA-RULES.md): every column, event type, and edge case; also written as instructions for AI assistants helping with data entry.\n\n' +
  '## Data files (CSV, CC0 public domain)\n\n' +
  files.map((f) => '- [' + prettyName(f.file) + '](' + SITE + '/' + f.file + '): ' + f.rows + ' rows').join('\n') + '\n\n' +
  '## Schema\n\n' +
  'Columns: ' + [...columns].join(', ') + '. Events are grouped into biomechanical categories (Overhead Press, Deadlift, Carry, Load, Pull, Hold, Flip, Toss, Medley, Other); the implement is a separate attribute. Dates are YYYY-MM-DD with 00 for unknown month or day.\n\n' +
  '## License and citation\n\n' +
  'Data: CC0-1.0 (public domain). Code: AGPL-3.0-or-later. Please cite as: OpenStrongman Project. OpenStrongman: An Open Database of Strongman Competition Results' +
  (version ? ' (version ' + version + ')' : '') + '. ' + (doi ? 'https://doi.org/' + doi : SITE) + '. Citation metadata: ' + SITE + '/CITATION.cff\n\n' +
  '## Open research questions (from the Research Roadmap)\n\n' +
  'Each gap below is an open question suitable for a thesis, dissertation, or research project. Full evidence summaries and references: ' + SITE + '/roadmap.html\n\n' +
  roadmapData.risks.map((r) =>
    '### ' + r.id + ': ' + r.title + ' (strongman-specific evidence: ' + RoadmapRender.EV_LABEL[r.evidence].toLowerCase() + ')\n\n' +
    r.gaps.map((g) => {
      const paths = [...new Set(g.tasks.map((t) => PATH_WORDS[t.path]))];
      return '- [' + g.id + '](' + SITE + '/roadmap.html#' + g.id + '): ' + g.question + ' (' + paths.join('; ') + ')';
    }).join('\n')
  ).join('\n\n') + '\n';
if (write('llms.txt', llms)) changed.push('llms.txt');

// ════════════════════════════════════════════
// 5. Reference values in data/DATA-RULES.md
// ════════════════════════════════════════════
{
  const fedMeets = {}, eventInfo = {}, athleteNat = {};
  manifest.forEach((f) => {
    parseCSV(read(f)).rows.forEach((r) => {
      if (r.MeetFederation && r.MeetName) (fedMeets[r.MeetFederation] = fedMeets[r.MeetFederation] || new Set()).add(r.MeetName);
      if (r.Event && r.Event !== 'Overall') {
        const e = eventInfo[r.Event] = eventInfo[r.Event] || { cats: new Set(), impl: new Set() };
        if (r.EventCategory) e.cats.add(r.EventCategory);
        if (r.Implement) e.impl.add(r.Implement);
      }
      if (r.AthleteName) {
        const a = athleteNat[r.AthleteName] = athleteNat[r.AthleteName] || new Set();
        if (r.AthleteNationality) a.add(r.AthleteNationality);
      }
    });
  });
  const byAlpha = (a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' });
  const cell = (s) => String(s).replace(/\|/g, '\\|');
  let ref = '\n_Generated from ' + manifest.length + ' data files. Last rebuilt with the data as of version ' + (version || 'unversioned') + '._\n\n';
  ref += '### Federations and competitions\n\n| MeetFederation | MeetName values in use |\n|---|---|\n' +
    Object.keys(fedMeets).sort(byAlpha).map((fd) => '| ' + cell(fd) + ' | ' + [...fedMeets[fd]].sort().map(cell).join('<br>') + ' |').join('\n') + '\n\n';
  ref += '### Events and their categories\n\nWhen the same event appears again, reuse its category.\n\n| Event | EventCategory | Implement values used |\n|---|---|---|\n' +
    Object.keys(eventInfo).sort(byAlpha).map((ev) => {
      const e = eventInfo[ev];
      return '| ' + cell(ev) + ' | ' + [...e.cats].sort().map(cell).join(', ') + ' | ' + [...e.impl].sort().map(cell).join('; ') + ' |';
    }).join('\n') + '\n\n';
  ref += '### Athlete spellings\n\nFormat: Name (nationality). Reuse these exact spellings.\n\n' +
    Object.keys(athleteNat).sort(byAlpha).map((n) => '- ' + n + ' (' + ([...athleteNat[n]].sort().join(', ') || 'no nationality on file') + ')').join('\n') + '\n\n';
  ref += '### Nation codes in use\n\n' + [...nations].sort().join(', ') + '\n';
  // Flag events that have been given more than one category, so they can be cleaned up.
  const conflicts = Object.keys(eventInfo).filter((ev) => eventInfo[ev].cats.size > 1);
  if (conflicts.length) ref += '\n**Needs cleanup:** these events have more than one category in the data: ' + conflicts.join(', ') + '.\n';

  // ── Automatic checks against DATA-RULES.md ──
  const HEADER = ['MeetName','MeetFederation','MeetDate','MeetLocation','Division','Sex','BodyweightKg','WeightClassKg','AthleteName','AthleteNationality','Event','EventCategory','Implement','ResultValue','ResultUnit','StonesCompleted','ImplementWeightKg','CourseDistanceM','TimeLimitSec','ScoredBy','WorldRecord','Place','OverallPlace','Points','Notes'];
  const CATS = new Set(['Overhead Press','Deadlift','Carry','Load','Pull','Hold','Flip','Toss','Medley','Other']);
  const PAIRS = new Set(['time|sec','distance|m','distance|degrees','weight|kg','weight|lbs','reps|reps']);
  const NUMERIC = ['BodyweightKg','ResultValue','StonesCompleted','CourseDistanceM','TimeLimitSec','Place','OverallPlace','Points'];
  const isNum = (v) => /^-?\d+(\.\d+)?$/.test(v);
  const problems = [];
  manifest.forEach((f) => {
    const text = read(f);
    const { head, rows } = parseCSV(text);
    const eventRows = rows.filter((r) => r.Event && r.Event !== 'Overall');
    const file = path.basename(f);
    if (eventRows.length && head.map((h) => h.trim()).join(',') !== HEADER.join(',')) {
      problems.push({ file, row: 'header', what: 'Header does not match the standard 25 columns' });
    }
    const overallByAthlete = {};
    rows.forEach((r, i) => {
      const where = { file, row: i + 2, who: [r.AthleteName, r.Event].filter(Boolean).join(', ') };
      const flag = (what) => problems.push(Object.assign({ what }, where));
      Object.keys(r).forEach((k) => { if (r[k] !== undefined && /^\s|\s$/.test(String(r[k]))) flag('Extra space in ' + k); });
      if (r.MeetDate && !/^\d{4}-\d{2}-\d{2}$/.test(r.MeetDate)) flag('MeetDate not YYYY-MM-DD: ' + r.MeetDate);
      if (r.Sex && !/^[MF]$/.test(r.Sex)) flag('Sex must be M or F: ' + r.Sex);
      if (r.AthleteNationality && !/^[A-Z]{3}$/.test(r.AthleteNationality)) flag('Nationality not a 3-letter code: ' + r.AthleteNationality);
      if (/[^\x00-\x7F]/.test(r.AthleteName || '')) flag('Athlete name uses accented or special characters');
      if (r.AthleteName && r.OverallPlace) {
        const k = r.MeetName + '|' + r.AthleteName;
        if (overallByAthlete[k] && overallByAthlete[k] !== r.OverallPlace) flag('OverallPlace differs between this athlete\'s rows');
        overallByAthlete[k] = overallByAthlete[k] || r.OverallPlace;
      }
      if (!r.Event || r.Event === 'Overall') return;
      if (!CATS.has(r.EventCategory)) flag('EventCategory not in the list of 10: ' + (r.EventCategory || '(blank)'));
      if (!PAIRS.has(r.ScoredBy + '|' + r.ResultUnit)) flag('ScoredBy "' + r.ScoredBy + '" does not match ResultUnit "' + r.ResultUnit + '" (see section 5)');
      NUMERIC.forEach((k) => { const v = (r[k] || '').trim(); if (v && !isNum(v)) flag(k + ' is not a number: ' + v); });
      const iw = (r.ImplementWeightKg || '').trim();
      if (iw && !/^\d+(\.\d+)?(-\d+(\.\d+)?)?$/.test(iw)) flag('ImplementWeightKg is not a number or range: ' + iw);
      if (r.WorldRecord && r.WorldRecord !== 'Y') flag('WorldRecord must be Y or blank: ' + r.WorldRecord);
    });
  });
  // Manual flags: rows that pass the automatic checks' blind spots but need a human with the source.
  const MANUAL = [
    { file: 'rogue_2024_finals.csv', match: (r) => r.Event === 'Grip and Press' && r.ScoredBy === 'distance' && r.ResultUnit === 'sec',
      what: 'Scored by distance but the unit is seconds. Needs the official results: per section 5, a DNF records the distance reached in m' }
  ];
  problems.forEach((p) => {
    const m = MANUAL.find((x) => x.file === p.file && /ScoredBy/.test(p.what));
    if (m) p.what = m.what;
  });
  ref += '\n### Known problems in existing data\n\n';
  if (!problems.length) {
    ref += 'None. Every data file passes the automatic checks.\n';
  } else {
    ref += 'These rows break the rules above. **Do not copy their patterns.** Each entry disappears automatically once the row is fixed.\n\n' +
      '| File | Row | Athlete, event | Problem |\n|---|---|---|---|\n' +
      problems.map((p) => '| ' + cell(p.file) + ' | ' + p.row + ' | ' + cell(p.who || '') + ' | ' + cell(p.what) + ' |').join('\n') + '\n';
  }
  console.log('Data checks: ' + (problems.length ? problems.length + ' problem(s) flagged in data/DATA-RULES.md' : 'all files pass'));

  let rules = read('data/DATA-RULES.md');
  rules = inject(rules, 'reference-values', ref, 'data/DATA-RULES.md');
  if (write('data/DATA-RULES.md', rules)) changed.push('data/DATA-RULES.md');
}

// ════════════════════════════════════════════
console.log('OpenStrongman build: ' + eventMeets.size + ' competitions with event data (' + meets.size + ' incl. overall-only), ' + athletes.size + ' athletes, ' + eventResults + ' event results, ' + minYear + '-' + maxYear);
console.log('Roadmap: ' + rm.counts.risks + ' risks, ' + rm.counts.gaps + ' gaps, ' + rm.counts.tasks + ' tasks');
console.log(changed.length ? 'Updated: ' + changed.join(', ') : 'No changes');
