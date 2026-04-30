// ─── Yarn Similarity Engine ───────────────────────────────────────────────────
// Standalone — does not depend on app.js.
// getFiberGroupSim and parseNeedleSim are copied from app.js equivalents.

let _similarYarns   = [];
let _similarSort    = 'match';
let _similarFilter  = null;

function getFiberGroupSim(yarn) {
  if (yarn.fiberGroup) return yarn.fiberGroup;
  const fibers = yarn.fiber || [];
  const pct = name => fibers
    .filter(f => f.name.toLowerCase().includes(name))
    .reduce((s, f) => s + (f.pct || 0), 0);
  const mohairPct   = pct('mohair');
  const cashmerePct = pct('cashmere') + pct('kashmir');
  const silkPct     = pct('silk');
  const plantPct    = pct('hør') + pct('linen') + pct('bomuld') + pct('cotton') +
                      pct('bambu') + pct('bamboo') + pct('hamp') + pct('hemp') +
                      pct('lyocell') + pct('tencel');
  if (mohairPct   >= 30) return 'mohair';
  if (cashmerePct >= 50) return 'cashmere';
  if (silkPct     >= 50) return 'silk';
  if (plantPct    >= 50) return 'plant';
  return 'protein';
}

function parseNeedleSim(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const parts = String(val).replace(/,/g, '.').split('-').map(Number).filter(n => !isNaN(n));
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function getWoolTypeSim(yarn) {
  const fibers = yarn.fiber || [];
  const woolFibers = fibers.filter(f => {
    const n = f.name.toLowerCase();
    if (n.includes('bomuld') || n.includes('cotton') || n.includes('bomull')) return false;
    return n.includes('uld') || n.includes('wool') || n.includes('merino') ||
           n.includes('shetland') || n.includes('highland') || n.includes('donegal') ||
           n.includes('lambswool') || n.includes('lammeuld') || n.includes('pelsuld') ||
           n.includes('pelssau');
  });
  if (woolFibers.length === 0) return null;
  const all = woolFibers.map(f => f.name.toLowerCase()).join(' ');
  if (all.includes('pelsuld') || all.includes('gotland') || all.includes('pelssau')) return 'pelsuld';
  if (all.includes('merino')  || all.includes('merin'))      return 'merino';
  if (all.includes('shetland') || all.includes('donegal'))   return 'shetland';
  if (all.includes('highland') || all.includes('højland'))   return 'highland';
  if (all.includes('lambswool') || all.includes('lammeuld')) return 'lambswool';
  return 'generic';
}

function findSimilarYarns(targetYarnId) {
  const target = YARNS.find(y => y.id === targetYarnId);
  if (!target || target.gauge.stitches == null) return [];
  const targetFG       = getFiberGroupSim(target);
  const targetWoolType = getWoolTypeSim(target);
  const targetNeedle   = parseNeedleSim(target.gauge.needle_mm);
  const SYNTH          = ['nylon', 'polyamid', 'polyester', 'akryl', 'acrylic'];

  return YARNS.filter(y => {
    if (y.id === targetYarnId)  return false;
    if (y.isSockYarn)           return false;
    if (y.weight !== target.weight) return false;
    if (y.gauge.stitches == null) return false;
    if (Math.abs(y.gauge.stitches - target.gauge.stitches) > 2) return false;
    if (getFiberGroupSim(y) !== targetFG) return false;
    const yWT = getWoolTypeSim(y);
    if (targetWoolType !== null && targetWoolType !== yWT) return false;
    if (y.fiber.some(f => SYNTH.some(s => f.name.toLowerCase().includes(s)))) return false;
    const yNeedle = parseNeedleSim(y.gauge.needle_mm);
    if (targetNeedle != null && yNeedle != null && Math.abs(yNeedle - targetNeedle) > 1.0) return false;
    return true;
  }).map(y => ({
    yarn:      y,
    gaugeDiff: Math.abs(y.gauge.stitches - target.gauge.stitches),
    priceDiff: y.price_dkk_50g - target.price_dkk_50g,
    pricePct:  Math.round((y.price_dkk_50g - target.price_dkk_50g) / target.price_dkk_50g * 100),
  }));
}

function _sortSimilar(arr, sort) {
  const c = [...arr];
  if (sort === 'price-asc')  return c.sort((a, b) => a.priceDiff - b.priceDiff);
  if (sort === 'price-desc') return c.sort((a, b) => b.priceDiff - a.priceDiff);
  return c.sort((a, b) => a.gaugeDiff - b.gaugeDiff || a.priceDiff - b.priceDiff);
}

function _filterSimilar(arr, filter) {
  if (!filter)               return arr;
  if (filter === 'cheaper')  return arr.filter(s => s.pricePct < -10);
  if (filter === 'same')     return arr.filter(s => s.pricePct >= -10 && s.pricePct <= 10);
  if (filter === 'pricier')  return arr.filter(s => s.pricePct > 10);
  return arr;
}

function _renderSimilarItems(items) {
  if (items.length === 0) {
    return '<div class="similar-empty">Ingen alternativer fundet med det valgte filter.</div>';
  }
  return items.map(({ yarn: y, gaugeDiff, pricePct }) => {
    const fiberStr = y.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
    const priceLbl = pricePct === 0
      ? `<span class="sim-price-same">Samme pris</span>`
      : pricePct < 0
        ? `<span class="sim-price-cheaper">▼ ${Math.abs(pricePct)}% billigere</span>`
        : `<span class="sim-price-pricier">▲ ${pricePct}% dyrere</span>`;
    const gaugeLbl = gaugeDiff === 0
      ? `<span class="sim-gauge-exact">✓ Identisk gauge</span>`
      : `<span class="sim-gauge-close">±${gaugeDiff} m/10 cm</span>`;
    return `
      <div class="similar-yarn-item" onclick="showYarnDetail('${y.id}')">
        <div class="similar-yarn-main">
          <div class="similar-yarn-name">${y.name}</div>
          <div class="similar-yarn-brand">${y.brand}</div>
          <div class="similar-yarn-specs">${y.gauge.stitches} m/10 cm · Pind ${y.gauge.needle_mm} mm · ${fiberStr}</div>
        </div>
        <div class="similar-yarn-price-col">
          <div class="similar-yarn-price">${y.price_dkk_50g} kr.<span class="similar-yarn-unit">/50g</span></div>
          <div class="similar-yarn-diff">${priceLbl}</div>
          <div class="similar-yarn-gauge">${gaugeLbl}</div>
        </div>
      </div>`;
  }).join('');
}

function _refreshSimilarList(yarnId) {
  const listEl = document.getElementById(`similarList-${yarnId}`);
  if (!listEl) return;
  const items = _sortSimilar(_filterSimilar(_similarYarns, _similarFilter), _similarSort);
  listEl.innerHTML = _renderSimilarItems(items);
  document.querySelectorAll('.similar-sort').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.sort === _similarSort));
  document.querySelectorAll('.similar-chip').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.filter === _similarFilter));
}

function applySimilarSort(sort, yarnId) {
  _similarSort = sort;
  _refreshSimilarList(yarnId);
}

function applySimilarFilter(filter, yarnId) {
  _similarFilter = (_similarFilter === filter) ? null : filter;
  _refreshSimilarList(yarnId);
}

function renderSimilarYarnsSection(yarnId) {
  _similarYarns  = findSimilarYarns(yarnId);
  _similarSort   = 'match';
  _similarFilter = null;

  if (_similarYarns.length === 0) return '';

  const initialItems = _sortSimilar(_similarYarns, 'match');

  return `
    <div class="similar-yarns-section">
      <div class="similar-yarns-header">
        <h3 class="similar-yarns-title">Lignende garn</h3>
        <div class="similar-sort-btns">
          <button class="similar-sort active" data-sort="match"      onclick="applySimilarSort('match','${yarnId}')">Mest identisk</button>
          <button class="similar-sort"        data-sort="price-asc"  onclick="applySimilarSort('price-asc','${yarnId}')">Pris ↑</button>
          <button class="similar-sort"        data-sort="price-desc" onclick="applySimilarSort('price-desc','${yarnId}')">Pris ↓</button>
        </div>
      </div>
      <div class="similar-filter-chips">
        <span class="similar-filter-label">Filtrer:</span>
        <button class="similar-chip" data-filter="cheaper" onclick="applySimilarFilter('cheaper','${yarnId}')">Billigere</button>
        <button class="similar-chip" data-filter="same"    onclick="applySimilarFilter('same','${yarnId}')">Tilsvarende pris</button>
        <button class="similar-chip" data-filter="pricier" onclick="applySimilarFilter('pricier','${yarnId}')">Dyrere</button>
      </div>
      <div class="similar-yarns-count">${_similarYarns.length} lignende garn fundet</div>
      <div class="similar-yarns-list" id="similarList-${yarnId}">
        ${_renderSimilarItems(initialItems)}
      </div>
    </div>`;
}
