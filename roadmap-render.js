/*
 * OpenStrongman Research Roadmap renderer.
 *
 * One rendering function, used in two places:
 *   1. scripts/build.js (Node) bakes the roadmap into roadmap.html as plain HTML,
 *      so search engines and AI crawlers that do not run JavaScript can read it.
 *   2. roadmap.html (browser) re-renders from roadmap.json only if the baked copy
 *      is out of date, then wires up the filters.
 * Because both use this file, the baked HTML and the live HTML are identical.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RoadmapRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var EV_LABEL = { none: 'None', minimal: 'Minimal', limited: 'Limited', developing: 'Developing' };
  var PATH_LABEL = { osm: 'OpenStrongman data', field: 'New field needed', external: 'Outside research' };
  var STATUS_LABEL = { open: 'Open', partial: 'Partially addressed' };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var ISSUE_BASE = 'https://github.com/campoheidi-oss/openstrongman.org/issues/new?title=';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Small, deterministic string hash (djb2). Used to tell whether the baked HTML
  // matches the current roadmap.json.
  function hash(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(16);
  }

  function sourceHash(data) { return hash(JSON.stringify(data)); }

  function formatDate(iso) {
    var p = String(iso).split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  function build(data) {
    var refIndex = {};
    data.references.forEach(function (r, i) { refIndex[r.key] = i + 1; });

    // Turn "{key1} {key2}" runs into one superscript citation like 3,4
    function withCites(text) {
      return esc(text).replace(/(\{[a-z0-9]+\}\s*)+/gi, function (run) {
        var keys = run.match(/\{([a-z0-9]+)\}/gi).map(function (k) { return k.slice(1, -1); });
        var links = keys.map(function (k) {
          var n = refIndex[k];
          return n ? '<a href="#ref-' + n + '">' + n + '</a>' : '';
        }).filter(Boolean).join(',');
        return '<sup class="cite">' + links + '</sup>' + (/\s$/.test(run) ? ' ' : '');
      });
    }

    var risks = data.risks;
    var allGaps = [], allTasks = [];
    risks.forEach(function (r) {
      r.gaps.forEach(function (g) { allGaps.push(g); g.tasks.forEach(function (t) { allTasks.push(t); }); });
    });
    var nOsm = allTasks.filter(function (t) { return t.path === 'osm'; }).length;
    var nField = allTasks.filter(function (t) { return t.path === 'field'; }).length;

    function stat(n, label) {
      return '<div class="stat"><div class="num">' + n + '</div><div class="lbl">' + label + '</div></div>';
    }
    function chip(key, label) {
      return '<button type="button" class="chip-btn" data-filter="' + key + '" aria-pressed="' + (key === 'all' ? 'true' : 'false') + '">' + esc(label) + '</button>';
    }

    var h = '';
    h += '<div class="stats">' +
      stat(risks.length, 'risk areas') +
      stat(allGaps.length, 'knowledge gaps') +
      stat(nOsm, 'tasks OpenStrongman data can take on') +
      stat(nField, 'tasks that need a new data field') +
      '</div>';

    h += '<div class="rm-filter" role="group" aria-label="Filter tasks by path">' +
      '<span class="flabel">Show tasks</span>' +
      chip('all', 'All') + chip('osm', PATH_LABEL.osm) + chip('field', PATH_LABEL.field) + chip('external', PATH_LABEL.external) +
      '<span class="filter-count" id="filter-count" aria-live="polite">' + allTasks.length + ' tasks</span></div>';

    h += '<div class="risk-grid">';
    risks.forEach(function (r) {
      h += '<a class="risk-tile" href="#' + r.id + '" data-risk="' + r.id + '">' +
        '<span class="code">' + r.id + '</span>' +
        '<h3>' + esc(r.title) + '</h3>' +
        '<span class="meta"><span class="ev ev-' + r.evidence + '">' + EV_LABEL[r.evidence] + '</span>' +
        '<span data-tile-count="' + r.id + '">' + r.gaps.length + ' gaps</span></span></a>';
    });
    h += '</div>';

    h += '<section class="rm-section"><h2>Risk areas</h2>';
    risks.forEach(function (r) {
      h += '<details class="risk" id="' + r.id + '">' +
        '<summary>' +
          '<span class="code">' + r.id + '</span>' +
          '<h3>' + esc(r.title) + '</h3>' +
          '<span class="sum-meta"><span class="ev ev-' + r.evidence + '">Evidence: ' + EV_LABEL[r.evidence] + '</span>' +
          '<span data-sum-count="' + r.id + '">' + r.gaps.length + ' gaps</span><span class="chev" aria-hidden="true"></span></span>' +
        '</summary>' +
        '<div class="risk-body">' +
          '<p class="risk-statement">' + esc(r.statement) + '</p>' +
          '<p class="sub-label">What the evidence says</p>' +
          '<p class="evidence-text">' + withCites(r.summary) + '</p>' +
          '<p class="sub-label">Knowledge gaps</p>';
      r.gaps.forEach(function (g) {
        h += '<div class="gap" id="' + g.id + '" data-risk="' + r.id + '">' +
          '<div class="gap-head">' +
            '<a class="gap-id" href="#' + g.id + '">' + g.id + '</a>' +
            '<span class="gap-q">' + esc(g.question) + '</span>' +
            '<span class="gstatus">' + STATUS_LABEL[g.status] + '</span>' +
          '</div><ul class="task-list">';
        g.tasks.forEach(function (t) {
          h += '<li class="task" data-path="' + t.path + '">' +
            '<span class="path path-' + t.path + '">' + PATH_LABEL[t.path] + '</span>' +
            '<span>' + withCites(t.text) + (t.field ? ' <span class="field-chip" title="Proposed field">' + esc(t.field) + '</span>' : '') + '</span>' +
            '</li>';
        });
        h += '</ul><div class="gap-foot"><a href="' + ISSUE_BASE + encodeURIComponent('Roadmap ' + g.id + ': ') +
          '" target="_blank" rel="noopener">Discuss ' + g.id + ' on GitHub</a></div></div>';
      });
      h += '</div></details>';
    });
    h += '</section>';

    // Proposed fields, derived from tasks
    var fields = {};
    risks.forEach(function (r) {
      r.gaps.forEach(function (g) {
        g.tasks.forEach(function (t) {
          if (!t.field) return;
          fields[t.field] = fields[t.field] || [];
          if (fields[t.field].indexOf(g.id) === -1) fields[t.field].push(g.id);
        });
      });
    });
    var fieldRows = Object.keys(fields).sort(function (a, b) {
      return fields[b].length - fields[a].length || (a < b ? -1 : a > b ? 1 : 0);
    }).map(function (f) {
      return '<tr><td>' + esc(f) + '</td><td>' + fields[f].map(function (id) { return '<a href="#' + id + '">' + id + '</a>'; }).join('') + '</td></tr>';
    }).join('');

    var refs = data.references.map(function (r, i) {
      var links = [];
      if (r.doi) links.push('<a href="https://doi.org/' + esc(r.doi) + '" target="_blank" rel="noopener">doi:' + esc(r.doi) + '</a>');
      if (r.pmid) links.push('<a href="https://pubmed.ncbi.nlm.nih.gov/' + esc(r.pmid) + '/" target="_blank" rel="noopener">PubMed ' + esc(r.pmid) + '</a>');
      if (r.url) links.push('<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')) + '</a>');
      return '<li id="ref-' + (i + 1) + '">' + esc(r.text) + ' ' + links.join(' &middot; ') + '</li>';
    }).join('');

    return {
      main: h,
      fieldRows: fieldRows,
      refs: refs,
      method: esc('Last reviewed ' + formatDate(data.lastReviewed) + '. ' + data.searchNote),
      hash: sourceHash(data),
      counts: { risks: risks.length, gaps: allGaps.length, tasks: allTasks.length, osm: nOsm, field: nField }
    };
  }

  return { build: build, sourceHash: sourceHash, esc: esc, formatDate: formatDate, EV_LABEL: EV_LABEL, PATH_LABEL: PATH_LABEL, STATUS_LABEL: STATUS_LABEL };
});
