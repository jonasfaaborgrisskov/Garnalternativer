// ─── State ────────────────────────────────────────────────────────
let currentPattern = null;
let activeFilters = { sortBy: 'match', fiber: 'alle', maxPrice: 9999, onlyEco: false, onlyVegan: false };

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPatternGrid(PATTERNS);

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
});

// ─── Search ──────────────────────────────────────────────────────
function handleSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q) { renderPatternGrid(PATTERNS); return; }
  const results = PATTERNS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.designer.toLowerCase().includes(q) ||
    p.type.toLowerCase().includes(q) ||
    p.tags.some(t => t.includes(q))
  );
  renderPatternGrid(results);
}

// ─── Pattern Grid ─────────────────────────────────────────────────
function renderPatternGrid(patterns) {
  const grid = document.getElementById('patternGrid');
  document.getElementById('patternSection').style.display = '';
  document.getElementById('detailSection').style.display = 'none';

  if (patterns.length === 0) {
    grid.innerHTML = `<div class="no-results">Ingen opskrifter fundet. Prøv et andet søgeord.</div>`;
    return;
  }

  grid.innerHTML = patterns.map(p => {
    const yarn = YARNS.find(y => y.id === p.yarn_id);
    return `
      <div class="pattern-card" onclick="showPatternDetail('${p.id}')">
        <div class="pattern-card-img">${p.emoji}</div>
        <div class="pattern-card-body">
          <div class="pattern-card-title">${p.name}</div>
          <div class="pattern-card-meta">${p.type} · ${p.designer} · ${p.difficulty}</div>
          <div class="tags">
            <span class="tag tag-weight">${yarn.weight}</span>
            <span class="tag tag-needle">Pind ${yarn.needle_mm} mm</span>
            <span class="tag tag-fiber">${shortFiber(yarn.fiber)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Pattern Detail ───────────────────────────────────────────────
function showPatternDetail(patternId) {
  currentPattern = PATTERNS.find(p => p.id === patternId);
  const yarn = YARNS.find(y => y.id === currentPattern.yarn_id);

  activeFilters = { sortBy: 'match', fiber: 'alle', maxPrice: 9999, onlyEco: false, onlyVegan: false };

  document.getElementById('patternSection').style.display = 'none';
  document.getElementById('detailSection').style.display = '';

  const altYarns = currentPattern.alternatives.map(id => YARNS.find(y => y.id === id)).filter(Boolean);
  const fiberOptions = [...new Set(altYarns.map(y => y.fiber))];

  document.getElementById('detailContent').innerHTML = `
    <!-- Pattern header -->
    <div class="detail-header">
      <div class="detail-img">${currentPattern.emoji}</div>
      <div class="detail-info">
        <h1>${currentPattern.name}</h1>
        <div class="designer">${currentPattern.type} · ${currentPattern.designer} · ${currentPattern.difficulty}</div>
        <p style="font-family:Arial,sans-serif;font-size:0.95rem;color:#6b6460;margin-bottom:20px;">${currentPattern.description}</p>

        <div class="yarn-box">
          <h3>Originalt garn</h3>
          <div class="yarn-name">${yarn.name}</div>
          <div class="yarn-specs">
            <span class="spec">🧵 <strong>${yarn.fiber}</strong></span>
            <span class="spec">📐 <strong>${yarn.gauge_10cm} m/10 cm</strong></span>
            <span class="spec">🪡 <strong>Pind ${yarn.needle_mm} mm</strong></span>
            <span class="spec">📏 <strong>${yarn.meters_per_100g} m/100g</strong></span>
            <span class="spec">💰 <strong>${yarn.price_dkk} kr.</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>Sorter efter</label>
        <select onchange="updateFilter('sortBy', this.value)">
          <option value="match">Bedste match</option>
          <option value="price_asc">Billigst først</option>
          <option value="price_desc">Dyrest først</option>
          <option value="gauge">Strikkefasthed</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Materiale</label>
        <select onchange="updateFilter('fiber', this.value)">
          <option value="alle">Alle materialer</option>
          <option value="uld">Indeholder uld</option>
          <option value="alpaka">Indeholder alpaka</option>
          <option value="bomuld">Indeholder bomuld</option>
          <option value="merino">Indeholder merino</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Maks. pris (kr.)</label>
        <select onchange="updateFilter('maxPrice', parseInt(this.value))">
          <option value="9999">Alle priser</option>
          <option value="60">Op til 60 kr.</option>
          <option value="100">Op til 100 kr.</option>
          <option value="150">Op til 150 kr.</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Særlige</label>
        <select onchange="updateSpecial(this.value)">
          <option value="none">Ingen filter</option>
          <option value="eco">Kun øko</option>
          <option value="vegan">Kun vegansk</option>
        </select>
      </div>
      <button class="filter-reset" onclick="resetFilters()">Nulstil filtre</button>
    </div>

    <!-- Alternatives list -->
    <h2 class="alternatives-title">
      Garnalternativer
      <span class="alt-count" id="altCount"></span>
    </h2>
    <div class="alternatives-list" id="alternativesList"></div>
  `;

  renderAlternatives();
}

function showPatternList() {
  currentPattern = null;
  document.getElementById('patternSection').style.display = '';
  document.getElementById('detailSection').style.display = 'none';
}

// ─── Filter Logic ────────────────────────────────────────────────
function updateFilter(key, value) {
  activeFilters[key] = value;
  renderAlternatives();
}

function updateSpecial(value) {
  activeFilters.onlyEco = value === 'eco';
  activeFilters.onlyVegan = value === 'vegan';
  renderAlternatives();
}

function resetFilters() {
  activeFilters = { sortBy: 'match', fiber: 'alle', maxPrice: 9999, onlyEco: false, onlyVegan: false };
  // reset selects
  document.querySelectorAll('.filter-bar select').forEach(s => s.selectedIndex = 0);
  renderAlternatives();
}

// ─── Alternatives Rendering ───────────────────────────────────────
function renderAlternatives() {
  const originalYarn = YARNS.find(y => y.id === currentPattern.yarn_id);
  let alts = currentPattern.alternatives
    .map(id => YARNS.find(y => y.id === id))
    .filter(Boolean);

  // Filter
  if (activeFilters.fiber !== 'alle') {
    alts = alts.filter(y => y.fiber.toLowerCase().includes(activeFilters.fiber));
  }
  if (activeFilters.maxPrice < 9999) {
    alts = alts.filter(y => y.price_dkk <= activeFilters.maxPrice);
  }
  if (activeFilters.onlyEco) alts = alts.filter(y => y.eco);
  if (activeFilters.onlyVegan) alts = alts.filter(y => y.vegan);

  // Score
  alts = alts.map(y => ({ ...y, matchScore: computeMatch(originalYarn, y) }));

  // Sort
  switch (activeFilters.sortBy) {
    case 'price_asc':  alts.sort((a, b) => a.price_dkk - b.price_dkk); break;
    case 'price_desc': alts.sort((a, b) => b.price_dkk - a.price_dkk); break;
    case 'gauge':      alts.sort((a, b) => Math.abs(a.gauge_10cm - originalYarn.gauge_10cm) - Math.abs(b.gauge_10cm - originalYarn.gauge_10cm)); break;
    default:           alts.sort((a, b) => b.matchScore - a.matchScore);
  }

  document.getElementById('altCount').textContent = `(${alts.length} alternativer)`;

  if (alts.length === 0) {
    document.getElementById('alternativesList').innerHTML =
      `<div class="no-results">Ingen alternativer matcher dine filtre. Prøv at nulstille filtrene.</div>`;
    return;
  }

  document.getElementById('alternativesList').innerHTML = alts.map((yarn, i) => {
    const isFirst = i === 0 && activeFilters.sortBy === 'match';
    const priceDiff = yarn.price_dkk - originalYarn.price_dkk;
    const priceDiffText = priceDiff < 0
      ? `<span class="price-diff cheaper">▼ ${Math.abs(priceDiff)} kr. billigere</span>`
      : priceDiff > 0
      ? `<span class="price-diff pricier">▲ ${priceDiff} kr. dyrere</span>`
      : `<span class="price-diff">Samme pris</span>`;

    const gaugePct = gaugeMatchPct(originalYarn.gauge_10cm, yarn.gauge_10cm);
    const needlePct = needleMatchPct(originalYarn.needle_mm, yarn.needle_mm);
    const badges = buildBadges(originalYarn, yarn);

    return `
      <div class="alt-card${isFirst ? ' best-match' : ''}">
        <div>
          <div class="alt-card-name">${yarn.name}</div>
          <div class="alt-card-brand">${yarn.brand} · ${yarn.weight}</div>

          <table class="compare-table">
            <thead>
              <tr>
                <th></th>
                <th>Original</th>
                <th>Dette garn</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="compare-label">Strikkefasthed</td>
                <td class="compare-orig">${originalYarn.gauge_10cm} m/10 cm</td>
                <td class="compare-alt ${gaugePct >= 90 ? 'match-exact' : gaugePct >= 60 ? 'match-close' : 'match-diff'}">${yarn.gauge_10cm} m/10 cm</td>
                <td class="compare-icon">${gaugePct >= 90 ? '✓' : gaugePct >= 60 ? '~' : '✗'}</td>
              </tr>
              <tr>
                <td class="compare-label">Pind</td>
                <td class="compare-orig">${originalYarn.needle_mm} mm</td>
                <td class="compare-alt ${needlePct >= 90 ? 'match-exact' : needlePct >= 60 ? 'match-close' : 'match-diff'}">${yarn.needle_mm} mm</td>
                <td class="compare-icon">${needlePct >= 90 ? '✓' : needlePct >= 60 ? '~' : '✗'}</td>
              </tr>
              <tr>
                <td class="compare-label">Materiale</td>
                <td class="compare-orig">${originalYarn.fiber}</td>
                <td class="compare-alt" colspan="2">${yarn.fiber}</td>
              </tr>
              <tr>
                <td class="compare-label">Meter/100g</td>
                <td class="compare-orig">${originalYarn.meters_per_100g} m</td>
                <td class="compare-alt" colspan="2">${yarn.meters_per_100g} m</td>
              </tr>
            </tbody>
          </table>

          <div class="alt-badges">${badges}</div>
        </div>
        <div>
          <div class="match-score">${yarn.matchScore}%</div>
          <div class="match-score-label">samlet match</div>
          <div style="margin-top:16px;">
            <div class="price-value">${yarn.price_dkk} kr.</div>
            <span class="price-unit">pr. nøgle (100g)</span>
            ${priceDiffText}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Match Scoring ────────────────────────────────────────────────
function computeMatch(original, candidate) {
  const g = gaugeMatchPct(original.gauge_10cm, candidate.gauge_10cm);
  const n = needleMatchPct(original.needle_mm, candidate.needle_mm);
  const f = fiberMatchPct(original.fiber, candidate.fiber);
  // Weighted: gauge 50%, needle 25%, fiber 25%
  return Math.round(g * 0.50 + n * 0.25 + f * 0.25);
}

function gaugeMatchPct(orig, cand) {
  const diff = Math.abs(orig - cand);
  if (diff === 0) return 100;
  if (diff <= 1)  return 90;
  if (diff <= 2)  return 75;
  if (diff <= 3)  return 55;
  if (diff <= 5)  return 30;
  return 10;
}

function needleMatchPct(orig, cand) {
  const diff = Math.abs(orig - cand);
  if (diff === 0)   return 100;
  if (diff <= 0.5)  return 90;
  if (diff <= 1.0)  return 70;
  if (diff <= 2.0)  return 45;
  return 15;
}

function fiberMatchPct(origFiber, candFiber) {
  const o = origFiber.toLowerCase();
  const c = candFiber.toLowerCase();
  if (o === c) return 100;

  const keywords = ['uld', 'merino', 'alpaka', 'bomuld', 'silke', 'bambus', 'yak', 'mohair', 'linned'];
  const sharedKeywords = keywords.filter(k => o.includes(k) && c.includes(k));
  if (sharedKeywords.length > 0) return 70 + sharedKeywords.length * 10;

  const isOrigNatural = keywords.some(k => o.includes(k));
  const isCandNatural = keywords.some(k => c.includes(k));
  if (isOrigNatural && isCandNatural) return 50;

  return 20;
}

// ─── UI Helpers ───────────────────────────────────────────────────

function buildBadges(original, yarn) {
  const badges = [];
  const priceDiff = yarn.price_dkk - original.price_dkk;

  if (priceDiff < -20) badges.push(`<span class="badge badge-cheaper">💰 Billigere</span>`);
  else if (priceDiff > 20) badges.push(`<span class="badge badge-pricier">💎 Mere eksklusiv</span>`);

  if (yarn.eco)   badges.push(`<span class="badge badge-eco">🌿 Øko</span>`);
  if (yarn.vegan) badges.push(`<span class="badge badge-vegan">🐑 Vegansk</span>`);

  const softWords = ['merino', 'alpaka', 'yak', 'mohair', 'bambus'];
  if (softWords.some(w => yarn.fiber.toLowerCase().includes(w))) {
    badges.push(`<span class="badge badge-soft">✨ Ekstra blød</span>`);
  }

  if (yarn.gauge_10cm !== original.gauge_10cm) {
    const faster = yarn.gauge_10cm < original.gauge_10cm;
    badges.push(`<span class="badge badge-fiber">${faster ? '⚡ Hurtigere strik' : '🔍 Finere strik'}</span>`);
  }

  return badges.join('');
}

function shortFiber(fiber) {
  if (fiber.includes('%')) {
    // Return first material
    const match = fiber.match(/\d+%\s*([A-Za-zÆæØøÅå]+)/);
    return match ? match[1] : fiber;
  }
  return fiber;
}
