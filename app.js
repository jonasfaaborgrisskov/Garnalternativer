// ─── State ────────────────────────────────────────────────────────
let currentPattern = null;
let filterState = getDefaultFilters();

// ─── Boot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populatePatternTiers();
  initializeFilters();
  applyAllFilters();
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.target.value = ''; filterState.searchQuery = ''; applyAllFilters(); }
  });

  // Check for pattern parameter in URL (e.g., ?pattern=scarlet-sweater)
  const urlParams = new URLSearchParams(window.location.search);
  const patternParam = urlParams.get('pattern');
  if (patternParam) {
    const pattern = PATTERNS.find(p => p.id === patternParam);
    if (pattern) {
      // Use replaceState to set the correct state for this initial URL
      history.replaceState({ pattern: patternParam }, '', '?pattern=' + patternParam);
      setTimeout(() => showDetail(patternParam, false), 100);
    }
  } else {
    // Ensure the initial list view has a state entry for back-navigation
    history.replaceState({}, '', window.location.pathname + window.location.search);
  }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.pattern) {
    showDetail(e.state.pattern, false);
  } else {
    showPatternList(false);
  }
});

// ─── Tier Population (Auto-match alternatives) ─────────────────────
//
// Two tiers:
//   exact — same stitches/10 cm AND same needle (float tolerance 0.001)
//   close — ±1-2 stitches AND needle within ±0.5 mm of original's range endpoints
//
// Held-double variants are included with effective gauge/needle applied.
// Fiber-group, wool-type, blow-yarn, synthetic and sock-yarn rules still apply.
//
const MAX_PER_TIER = 20;

// Parse needle_mm which may be a number (3.75) or a range string ("3,5-4" / "3-3,5").
// Returns the midpoint as a number for algorithmic comparisons.
function parseNeedle(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const parts = String(val).replace(/,/g, '.').split('-').map(Number).filter(n => !isNaN(n));
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// Returns [low, high] endpoints of a needle value or range.
function needleEndpoints(val) {
  if (val == null) return null;
  if (typeof val === 'number') return [val, val];
  const parts = String(val).replace(/,/g, '.').split('-').map(Number).filter(n => !isNaN(n));
  if (parts.length === 0) return null;
  return [Math.min(...parts), Math.max(...parts)];
}

// Classify yarn into broad visual-character groups.
// Alternatives must share the same group — merino and linen look nothing alike.
// A yarn may override its computed group via the fiberGroup field in data.js.
function getFiberGroup(yarn) {
  if (yarn.fiberGroup) return yarn.fiberGroup;
  const fibers = yarn.fiber || [];
  const pct = name => fibers
    .filter(f => f.name.toLowerCase().includes(name))
    .reduce((s, f) => s + (f.pct || 0), 0);

  const mohairPct   = pct('mohair');
  const cashmerePct = pct('cashmere') + pct('kashmir');
  const silkPct     = pct('silk'); // 'silk' matches both 'silk' and 'silke' (Danish)
  const plantPct    = pct('hør') + pct('linen') + pct('bomuld') + pct('cotton') +
                      pct('bambu') + pct('bamboo') + pct('hamp') + pct('hemp') +
                      pct('lyocell') + pct('tencel');

  if (mohairPct   >= 30) return 'mohair'; // 30%+ gives visible halo
  if (cashmerePct >= 50) return 'cashmere';
  if (silkPct     >= 50) return 'silk';
  if (plantPct    >= 50) return 'plant';  // 50%+ = plant-dominant (fixes alpaka+bomuld blends)
  return 'protein'; // wool, merino, alpaca, lambswool, blends, etc.
}

// Classify the sheep-wool character of a yarn for visual matching.
// Returns null when the yarn has no sheep wool (pure alpaca, cashmere, silk, cotton…) — check is skipped.
// Pelsuld (Gotland, pelt sheep) has a lustrous, airy character unlike merino or shetland.
function getWoolType(yarn) {
  const fibers = yarn.fiber || [];
  const woolFibers = fibers.filter(f => {
    const n = f.name.toLowerCase();
    if (n.includes('bomuld') || n.includes('cotton') || n.includes('bomull')) return false; // cotton ≠ wool
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
  return 'generic'; // plain uld, norsk uld, dansk uld, portugisisk uld, etc.
}

function populatePatternTiers() {
  const HALSNÆRT_TYPES = ['tørklæde', 'halstørklæde', 'halskrave', 'sjal'];
  const SYNTH = ['nylon', 'polyamid', 'polyester', 'akryl', 'acrylic'];

  PATTERNS.forEach(pattern => {
    const originalIds = pattern.originalYarns || (pattern.originalYarn_id ? [pattern.originalYarn_id] : []);
    const originals   = originalIds.map(findYarn).filter(Boolean);
    if (originals.length === 0) return;

    const isHalsnært = HALSNÆRT_TYPES.some(t => (pattern.type || '').toLowerCase().includes(t));

    pattern._allOriginalTiers      = {};
    pattern._allOriginalHeldDouble = {};

    originals.forEach(origYarn => {
      const origGroup    = getFiberGroup(origYarn);
      const origWoolType = getWoolType(origYarn);
      const origIsBlow   = origYarn.spinType === 'blow';
      const origNeedleEP  = needleEndpoints(origYarn.gauge.needle_mm);
      const origNeedleMid = parseNeedle(origYarn.gauge.needle_mm);

      // Shared filter: fiber group, wool type, blow, synthetics, sock, halsnært
      const baseFilter = y => {
        if (y.id === origYarn.id) return false;
        if (originalIds.includes(y.id)) return false;
        if (y.gauge.stitches == null || origYarn.gauge.stitches == null) return false;
        if (getFiberGroup(y) !== origGroup) return false;
        const yWT = getWoolType(y);
        if (origWoolType !== null && origWoolType !== yWT) return false;
        if (origIsBlow !== (y.spinType === 'blow')) return false;
        if (y.isSockYarn) return false;
        if (y.fiber.some(f => SYNTH.some(s => f.name.toLowerCase().includes(s)))) return false;
        if (isHalsnært && y.fiber.some(f => f.name.toLowerCase().includes('mohair'))) return false;
        return true;
      };

      // ── Exact tier: same stitches + same needle ──
      const exactYarns = YARNS
        .filter(y => {
          if (!baseFilter(y)) return false;
          if (y.gauge.stitches !== origYarn.gauge.stitches) return false;
          if (y.gauge.needle_mm != null && origNeedleMid != null &&
              Math.abs(parseNeedle(y.gauge.needle_mm) - origNeedleMid) > 0.001) return false;
          return true;
        })
        .sort((a, b) => (a.price_dkk_50g ?? 9999) - (b.price_dkk_50g ?? 9999))
        .slice(0, MAX_PER_TIER);

      const exactIds = new Set(exactYarns.map(y => y.id));

      // ── Close tier: ±1-2 stitches AND needle within ±0.5 mm from original range ──
      const closeYarns = YARNS
        .filter(y => {
          if (!baseFilter(y)) return false;
          if (exactIds.has(y.id)) return false;
          const stitchDiff = Math.abs(y.gauge.stitches - origYarn.gauge.stitches);
          if (stitchDiff === 0 || stitchDiff > 2) return false;
          if (y.gauge.needle_mm != null && origNeedleEP != null) {
            const altNeedle = parseNeedle(y.gauge.needle_mm);
            if (altNeedle == null) return false;
            if (altNeedle < origNeedleEP[0] - 0.5 || altNeedle > origNeedleEP[1] + 0.5) return false;
          }
          return true;
        })
        .sort((a, b) =>
          Math.abs(a.gauge.stitches - origYarn.gauge.stitches) - Math.abs(b.gauge.stitches - origYarn.gauge.stitches) ||
          (a.price_dkk_50g ?? 9999) - (b.price_dkk_50g ?? 9999)
        )
        .slice(0, MAX_PER_TIER);

      const closeIds = new Set(closeYarns.map(y => y.id));

      // ── Held-double candidates (not for blow or lace originals) ──
      const heldExact = new Set();
      const heldClose = new Set();

      if (!origIsBlow && origYarn.weight !== 'lace') {
        YARNS.forEach(y => {
          if (!baseFilter(y)) return;
          if (exactIds.has(y.id) || closeIds.has(y.id)) return;
          if (y.spinType === 'blow' || y.gauge.stitches == null) return;

          const hdStitches = Math.round(y.gauge.stitches * 0.72);
          const hdNeedle   = y.gauge.needle_mm != null
            ? Math.round(parseNeedle(y.gauge.needle_mm) * 1.4 * 4) / 4
            : null;

          // Exact held-double
          if (hdStitches === origYarn.gauge.stitches &&
              hdNeedle != null && origNeedleMid != null &&
              Math.abs(hdNeedle - origNeedleMid) <= 0.001) {
            heldExact.add(y.id);
            return;
          }

          // Close held-double: ±1-2 effective stitches AND effective needle within ±0.5 mm
          const stitchDiff = Math.abs(hdStitches - origYarn.gauge.stitches);
          if (stitchDiff >= 1 && stitchDiff <= 2 &&
              hdNeedle != null && origNeedleEP != null &&
              hdNeedle >= origNeedleEP[0] - 0.5 && hdNeedle <= origNeedleEP[1] + 0.5) {
            heldClose.add(y.id);
          }
        });
      }

      pattern._allOriginalTiers[origYarn.id] = {
        exact: [...exactYarns.map(y => y.id), ...[...heldExact]],
        close: [...closeYarns.map(y => y.id), ...[...heldClose]],
      };
      pattern._allOriginalHeldDouble[origYarn.id] = new Set([...heldExact, ...heldClose]);
    });

    const primaryOrig = originals[0];
    pattern.tiers       = pattern._allOriginalTiers[primaryOrig.id];
    pattern._heldDouble = pattern._allOriginalHeldDouble[primaryOrig.id];
    pattern._curatedCount = { exact: 0, close: 0 };
  });
}

// ─── Filters ──────────────────────────────────────────────────────
function initializeFilters() {
  const options = getFilterOptions();

  // Populate weight dropdown
  const weightSelect = document.getElementById('filterWeight');
  options.weights.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = formatFilterLabel(w, 'weight');
    weightSelect.appendChild(opt);
  });
  weightSelect.addEventListener('change', e => {
    filterState.weight = e.target.value || null;
    applyAllFilters();
  });

  // Populate fiber checkboxes
  const fibersContainer = document.getElementById('filterFibers');
  options.fibers.forEach(f => {
    const id = `fiber-${f.toLowerCase().replace(/\s+/g, '-')}`;
    const item = document.createElement('div');
    item.className = 'filter-checkbox-item';
    item.innerHTML = `
      <input type="checkbox" id="${id}" class="fiber-checkbox" value="${f}" />
      <label for="${id}">${f}</label>
    `;
    fibersContainer.appendChild(item);
    item.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        if (!filterState.fiber.includes(f)) filterState.fiber.push(f);
      } else {
        filterState.fiber = filterState.fiber.filter(x => x !== f);
      }
      applyAllFilters();
    });
  });

  // Populate difficulty checkboxes
  const difficultyContainer = document.getElementById('filterDifficulty');
  options.difficulties.forEach(d => {
    const id = `difficulty-${d.toLowerCase()}`;
    const item = document.createElement('div');
    item.className = 'filter-checkbox-item';
    item.innerHTML = `
      <input type="checkbox" id="${id}" class="difficulty-checkbox" value="${d}" />
      <label for="${id}">${formatFilterLabel(d, 'difficulty')}</label>
    `;
    difficultyContainer.appendChild(item);
    item.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        if (!filterState.difficulty.includes(d)) filterState.difficulty.push(d);
      } else {
        filterState.difficulty = filterState.difficulty.filter(x => x !== d);
      }
      applyAllFilters();
    });
  });

  // Populate seasonality checkboxes
  const seasonalityContainer = document.getElementById('filterSeasonality');
  options.seasons.forEach(s => {
    const id = `season-${s.toLowerCase()}`;
    const item = document.createElement('div');
    item.className = 'filter-checkbox-item';
    item.innerHTML = `
      <input type="checkbox" id="${id}" class="season-checkbox" value="${s}" />
      <label for="${id}">${formatFilterLabel(s, 'seasonality')}</label>
    `;
    seasonalityContainer.appendChild(item);
    item.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        if (!filterState.seasonality.includes(s)) filterState.seasonality.push(s);
      } else {
        filterState.seasonality = filterState.seasonality.filter(x => x !== s);
      }
      applyAllFilters();
    });
  });

  // Eco-only checkbox
  const ecoCheckbox = document.getElementById('filterEco');
  ecoCheckbox.addEventListener('change', e => {
    filterState.ecoOnly = e.target.checked;
    applyAllFilters();
  });

  // Budget filter
  const budgetInput = document.getElementById('filterBudget');
  if (budgetInput) {
    budgetInput.addEventListener('input', e => {
      const value = e.target.value.trim();
      filterState.maxBudget = value ? parseInt(value) : null;
      applyAllFilters();
    });
  }

  // Reset button
  document.getElementById('filterReset').addEventListener('click', () => {
    filterState = getDefaultFilters();
    document.getElementById('searchInput').value = '';
    document.getElementById('filterWeight').value = '';
    document.querySelectorAll('.fiber-checkbox, .difficulty-checkbox, .season-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('filterEco').checked = false;
    if (budgetInput) budgetInput.value = '';
    applyAllFilters();
  });
}

function applyAllFilters() {
  const results = applyFilters(PATTERNS, filterState);
  renderPatternGrid(results);
}

// ─── Search ──────────────────────────────────────────────────────
function handleSearch(e) {
  filterState.searchQuery = e.target.value.trim();
  applyAllFilters();
}

// ─── Pattern Grid ─────────────────────────────────────────────────
function renderPatternGrid(patterns) {
  document.getElementById('patternSection').style.display = '';
  document.getElementById('detailSection').style.display = 'none';

  const countEl = document.getElementById('patternCount');
  if (countEl) countEl.textContent = patterns.length + ' opskrifter';

  const grid = document.getElementById('patternGrid');

  if (patterns.length === 0) {
    grid.innerHTML = `<p class="no-results">Ingen opskrifter fundet. Prøv et andet søgeord.</p>`;
    return;
  }

  grid.innerHTML = patterns.map(p => {
    const primaryId = p.originalYarn_id || (p.originalYarns && p.originalYarns[0]);
    const yarn = findYarn(primaryId);
    const w = WEIGHTS[yarn.weight];
    const tierCount = Object.values(p.tiers).flat().length;
    const activeTiers = Object.values(p.tiers).filter(t => t && t.length > 0).length;
    const isFav = isFavorited(p.id);
    const materials = p.materials?.join(', ') || '';
    const hoursText = p.estimatedHours ? ` · ${p.estimatedHours}h` : '';
    const imageHtml = p.imageUrl
      ? `<div class="pattern-card-image"><img src="${p.imageUrl}" alt="${p.name}" onerror="this.parentElement.style.display='none'"></div>`
      : `<div class="pattern-card-emoji">${p.emoji}</div>`;
    return `
      <article class="pattern-card" data-pattern-id="${p.id}" onclick="showDetail('${p.id}')" role="button" tabindex="0"
               onkeydown="if(event.key==='Enter')showDetail('${p.id}')">
        <button class="favorite-btn ${isFav ? 'favorited' : ''}" onclick="event.stopPropagation(); toggleFavorite('${p.id}')">
          ${isFav ? '❤️' : '🤍'}
        </button>
        ${imageHtml}
        <div class="pattern-card-body">
          <div class="pattern-card-type">${p.type} · ${p.designer} · ${typeof p.difficulty === 'number' ? p.difficulty + '/10' : (formatFilterLabel(p.difficulty, 'difficulty') || p.difficulty)}${hoursText}</div>
          <h3 class="pattern-card-name">${p.name}</h3>
          <div class="pattern-card-yarn">Originalt garn: <strong>${yarn.name}</strong> — ${yarn.brand}</div>
          ${materials ? `<div class="pattern-card-materials">Fiber: ${materials}</div>` : ''}
          <div class="pattern-card-pills">
            <span class="pill pill-weight">${w.label}</span>
            <span class="pill pill-gauge">${yarn.gauge.stitches} m/10 cm</span>
            <span class="pill pill-needle">Pind ${yarn.gauge.needle_mm} mm</span>
          </div>
          <div class="pattern-card-footer">
            <span class="alt-count">${tierCount} ${tierCount === 1 ? 'alternativ' : 'alternativer'} i ${activeTiers} prisniveauer</span>
            <span class="card-arrow">→</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
  updateFavoriteButtons();
}

// ─── Size helpers ─────────────────────────────────────────────────
function getPatternMeters(pattern) {
  if (pattern.sizes) {
    const key = pattern._selectedSize || Object.keys(pattern.sizes)[0];
    return pattern.sizes[key].meters;
  }
  return pattern.totalMeters_M;
}

function getPatternSizeLabel(pattern) {
  if (pattern.sizes) {
    const key = pattern._selectedSize || Object.keys(pattern.sizes)[0];
    return `str. ${key}`;
  }
  return pattern.sizeLabel || 'str. M';
}

function selectPatternSize(patternId, sizeKey) {
  const p = PATTERNS.find(x => x.id === patternId);
  if (p) { p._selectedSize = sizeKey; showDetail(patternId, false); }
}

// ─── Pattern Detail ───────────────────────────────────────────────
function showDetail(patternId, pushToHistory = true) {
  currentPattern = PATTERNS.find(p => p.id === patternId);

  document.getElementById('patternSection').style.display = 'none';
  document.getElementById('detailSection').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('detailContent').innerHTML = `
    ${renderPatternHeader(currentPattern)}
    ${renderTierComparison(currentPattern.id)}
    ${renderAllOriginalSections(currentPattern)}
    ${renderShareSection(currentPattern)}
    <div id="reviewsSection-${currentPattern.id}"></div>
  `;

  // Update URL so users can share/bookmark this pattern
  if (pushToHistory) {
    history.pushState({ pattern: patternId }, '', '?pattern=' + patternId);
  }

  // Render reviews after DOM is ready
  setTimeout(() => renderReviewsSection(currentPattern.id), 100);
}

function showPatternList(pushToHistory = true) {
  document.getElementById('patternSection').style.display = '';
  document.getElementById('detailSection').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pushToHistory) {
    history.pushState({}, '', window.location.pathname);
  }
}

// ─── Pattern Header ───────────────────────────────────────────────
function renderPatternHeader(pattern) {
  const originalIds = pattern.originalYarns || (pattern.originalYarn_id ? [pattern.originalYarn_id] : []);
  const originals   = originalIds.map(findYarn).filter(Boolean);

  const imageCol = pattern.imageUrl
    ? `<div class="detail-image-col"><img src="${pattern.imageUrl}" alt="${pattern.name}" onerror="this.parentElement.className='detail-image-col detail-image-col--fallback'; this.outerHTML='<div class=&quot;detail-emoji-fallback&quot;>${pattern.emoji}</div>'"></div>`
    : `<div class="detail-image-col detail-image-col--fallback"><div class="detail-emoji-fallback">${pattern.emoji}</div></div>`;

  const priceUnitG  = pattern.priceUnit_g || 50;
  const totalMeters = getPatternMeters(pattern);
  const sizeLabel   = getPatternSizeLabel(pattern);
  const currentSizeData = pattern.sizes
    ? pattern.sizes[pattern._selectedSize || Object.keys(pattern.sizes)[0]]
    : null;
  const originalsHtml = originals.map(y => {
    const fiberStr   = y.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
    const skeinUnit  = y.packageSize_g || 50;
    const displayPrice = Math.round(y.price_dkk_50g * skeinUnit / 50);
    const displayMeters = Math.round(y.meters_per_50g * skeinUnit / 50);
    const gramsNeeded = currentSizeData?.gramsPerYarn?.[y.id] ?? null;
    const displaySkeinCount = gramsNeeded !== null
      ? Math.ceil(gramsNeeded / skeinUnit)
      : Math.ceil(totalMeters / (y.meters_per_50g * skeinUnit / 50));
    const displayCostTotal = displaySkeinCount * displayPrice;
    return `
      <div class="pk-original-item">
        <div class="pk-original-top">
          <div>
            <div class="pk-original-name">${y.name}</div>
            <div class="pk-original-brand">${y.brand}</div>
          </div>
          <div class="pk-original-price">${displayPrice} kr.<span class="pk-original-price-unit">/${skeinUnit}g</span></div>
        </div>
        <div class="pk-original-attrs">
          <span>${y.gauge.stitches} m/10 cm</span>
          <span>Pind ${y.gauge.needle_mm} mm</span>
          <span>${displayMeters} m/${skeinUnit}g</span>
          <span>${fiberStr}</span>
        </div>
        <div class="pk-original-cost">Ca. ${displayCostTotal} kr. til ${sizeLabel} (${displaySkeinCount} nøgle${displaySkeinCount !== 1 ? 'r' : ''})</div>
        ${y.buyUrl ? `<a class="pk-original-buy" href="${y.buyUrl}" target="_blank" rel="noopener noreferrer">Køb ${y.name} →</a>` : ''}
      </div>`;
  }).join('');

  const intro = pattern.unifiedAlternatives
    ? `Herunder finder du alternativer til opskriftens garn samlet i tre prisniveauer. Husk altid at strikke en prøvelap.`
    : originals.length > 1
      ? `Herunder finder du alternativer til hvert af PetiteKnits anbefalede garn, opdelt i tre prisniveauer. Husk altid at strikke en prøvelap.`
      : originals.length === 1
        ? `Herunder finder du alternativer til <em>${originals[0].name}</em> i tre prisniveauer. Husk altid at strikke en prøvelap.`
        : '';

  return `
    <button class="back-btn" onclick="showPatternList()">← Alle opskrifter</button>

    <div class="detail-hero">
      ${imageCol}
      <div class="detail-data">
        <div class="detail-type">${pattern.type} · ${pattern.designer} · Sværhedsgrad: ${typeof pattern.difficulty === 'number' ? pattern.difficulty + '/10' : (formatFilterLabel(pattern.difficulty, 'difficulty') || pattern.difficulty)}</div>
        <h1 class="detail-title">${pattern.name}</h1>
        <p class="detail-desc">${pattern.description}</p>

        ${pattern.sizes ? `
        <div class="size-selector">
          <span class="size-selector-label">Størrelse:</span>
          ${Object.keys(pattern.sizes).map(key => `
            <button class="size-selector-btn${(pattern._selectedSize || Object.keys(pattern.sizes)[0]) === key ? ' active' : ''}"
              onclick="selectPatternSize('${pattern.id}','${key}'); return false;">${key}</button>
          `).join('')}
        </div>` : ''}
        <div class="pk-originals-box">
          <div class="yarn-spec-label">${originals.length > 1 ? 'PetiteKnit anbefaler' : 'Originalt garn'}</div>
          <div class="pk-originals-list">${originalsHtml}</div>
        </div>
      </div>
    </div>

    <div class="tier-intro"><p>${intro}</p></div>
  `;
}

// ─── Multi-original rendering ─────────────────────────────────────
function renderAllOriginalSections(pattern) {
  if (pattern.unifiedAlternatives) {
    return renderUnifiedAlternativesSection(pattern);
  }

  const originalIds = pattern.originalYarns || (pattern.originalYarn_id ? [pattern.originalYarn_id] : []);
  const originals   = originalIds.map(findYarn).filter(Boolean);

  return originals.map((origYarn, idx) => {
    const tiers       = pattern._allOriginalTiers?.[origYarn.id]        || pattern.tiers;
    const heldDouble  = pattern._allOriginalHeldDouble?.[origYarn.id]   || pattern._heldDouble || new Set();
    const curatedCount = pattern._allOriginalCuratedCount?.[origYarn.id] || pattern._curatedCount || {};

    const headerHtml = originals.length > 1
      ? renderOriginalYarnSubheader(pattern, origYarn)
      : '';

    return `
      <div class="original-alternatives-section${idx > 0 ? ' original-alternatives-section--secondary' : ''}">
        ${headerHtml}
        ${renderTierSections(pattern, origYarn, tiers, heldDouble, curatedCount)}
      </div>`;
  }).join('');
}

function renderUnifiedAlternativesSection(pattern) {
  const originalIds   = pattern.originalYarns || (pattern.originalYarn_id ? [pattern.originalYarn_id] : []);
  const primaryOrig   = findYarn(originalIds[0]);
  if (!primaryOrig) return '';

  const tiers        = pattern._allOriginalTiers?.[originalIds[0]]        || pattern.tiers;
  const hd           = pattern._allOriginalHeldDouble?.[originalIds[0]]   || new Set();
  const curatedCount = pattern._allOriginalCuratedCount?.[originalIds[0]] || {};

  return `<div class="original-alternatives-section">${renderTierSections(pattern, primaryOrig, tiers, hd, curatedCount)}</div>`;
}

function renderOriginalYarnSubheader(pattern, origYarn) {
  const fiberStr = origYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const costEst  = estimateCost(origYarn, getPatternMeters(pattern));
  const priceUnitG = pattern.priceUnit_g || 50;
  const displayOrigPrice = Math.round(origYarn.price_dkk_50g * priceUnitG / 50);
  return `
    <div class="original-yarn-subheader">
      <h2 class="original-yarn-subheader-title">Alternativer til ${origYarn.name}</h2>
      <div class="original-yarn-subheader-meta">
        ${origYarn.brand} · ${origYarn.gauge.stitches} m/10 cm · Pind ${origYarn.gauge.needle_mm} mm ·
        ${fiberStr} · ${displayOrigPrice} kr./${priceUnitG}g · ${origYarn.meters_per_50g} m/50g ·
        ca. ${costEst.total} kr. til ${getPatternSizeLabel(pattern)}
        ${origYarn.buyUrl ? `· <a href="${origYarn.buyUrl}" target="_blank" rel="noopener noreferrer">Køb →</a>` : ''}
      </div>
    </div>`;
}

// ─── Tier Sections ────────────────────────────────────────────────
function renderTierSections(pattern, origYarn, tiersOverride, hdOverride) {
  const activeTiers = tiersOverride || pattern.tiers;
  const hd          = hdOverride    || pattern._heldDouble || new Set();

  return ['exact', 'close'].map(tierId => {
    const tier    = TIERS[tierId];
    const yarnIds = (activeTiers[tierId] || []);
    const yarns   = yarnIds.map(findYarn).filter(Boolean);

    if (yarns.length === 0) {
      return `
        <section class="tier-section">
          <div class="tier-heading">
            <span class="tier-emoji">${tier.emoji}</span>
            <div>
              <div class="tier-label" style="color:${tier.color}">${tier.label}</div>
              <div class="tier-sublabel">${tier.sublabel}</div>
            </div>
          </div>
          <p class="tier-empty">Ingen alternativer fundet.</p>
        </section>`;
    }

    const renderCard = y => renderYarnCard(y, origYarn, pattern, tierId, hd.has(y.id));
    const cardsHtml  = `<div class="yarn-cards">${yarns.map(renderCard).join('')}</div>`;

    return `
      <section class="tier-section">
        <div class="tier-heading">
          <span class="tier-emoji">${tier.emoji}</span>
          <div>
            <div class="tier-label" style="color:${tier.color}">${tier.label}</div>
            <div class="tier-sublabel">${tier.sublabel} · ${yarns.length} ${yarns.length === 1 ? 'alternativ' : 'alternativer'}</div>
          </div>
        </div>
        ${cardsHtml}
      </section>`;
  }).join('');
}

function renderShareSection(pattern) {
  return `
    <section class="share-section">
      <h3>Del på Instagram</h3>
      <p class="share-intro">Gør dine venner klar til at strikke ${pattern.name} 🧶</p>
      <div class="share-buttons">
        <button class="share-btn instagram-btn" onclick="shareOnInstagram('${pattern.id}')">
          📷 Del på Instagram
        </button>
        <button class="share-btn copy-btn" onclick="copyShareLink()">
          📋 Kopier link
        </button>
      </div>
    </section>`;
}

// ─── Yarn Card ────────────────────────────────────────────────────
function renderYarnCard(yarn, origYarn, pattern, tierId, heldDouble = false) {
  // For held-double: effective gauge/needle/price are different from single-strand
  const effStitches = heldDouble ? Math.round(yarn.gauge.stitches * 0.72) : yarn.gauge.stitches;
  const effNeedleNum = heldDouble ? Math.round(parseNeedle(yarn.gauge.needle_mm) * 1.4 * 4) / 4 : parseNeedle(yarn.gauge.needle_mm);
  const effNeedle    = heldDouble ? effNeedleNum : yarn.gauge.needle_mm;
  const effPrice    = heldDouble ? yarn.price_dkk_50g * 2 : yarn.price_dkk_50g;
  const effMeters   = heldDouble ? Math.round(yarn.meters_per_50g / 2) : yarn.meters_per_50g;

  const patternMeters = getPatternMeters(pattern);
  const costEst   = heldDouble
    ? estimateCost({ ...yarn, meters_per_50g: effMeters, price_dkk_50g: effPrice }, patternMeters)
    : estimateCost(yarn, patternMeters);
  const gaugeDiff = effStitches - origYarn.gauge.stitches;
  const gaugeStatus = gaugeLabel(gaugeDiff);
  const needleDiff  = effNeedleNum - parseNeedle(origYarn.gauge.needle_mm);
  const needleStatus = needleLabel(needleDiff);
  const fiberStr  = yarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const origFiber = origYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const priceDiff = effPrice - origYarn.price_dkk_50g;
  const priceUnitG = pattern.priceUnit_g || 50;
  const displayEffPrice  = Math.round(effPrice * priceUnitG / 50);
  const displayOrigPrice = Math.round(origYarn.price_dkk_50g * priceUnitG / 50);
  const displayPriceDiff = displayEffPrice - displayOrigPrice;
  const metersPerDisplayUnit = yarn.meters_per_50g * priceUnitG / 50;
  const displaySkeins = Math.ceil(patternMeters / metersPerDisplayUnit);
  const displayTotal  = displaySkeins * displayEffPrice;
  const badges    = buildBadges(yarn, origYarn);
  const why       = buildWhy(yarn, origYarn, tierId, gaugeDiff);

  return `
    <div class="yarn-card" data-yarn-id="${yarn.id}">
      <div class="yarn-card-top">
        <div>
          <div class="yarn-card-name">${yarn.name}${heldDouble ? ' <span class="held-double-badge">× 2 tråde</span>' : ''}</div>
          <div class="yarn-card-brand">${yarn.brand} · ${WEIGHTS[yarn.weight].label}</div>
          ${badges ? `<div class="yarn-card-badges">${badges}</div>` : ''}
        </div>
        <div class="yarn-card-price">
          <div class="price-main">${displayEffPrice} kr.</div>
          <div class="price-unit">${heldDouble ? `pr. 2×${priceUnitG}g` : `pr. ${priceUnitG}g`}</div>
          ${displayPriceDiff !== 0 ? `<div class="price-diff ${displayPriceDiff < 0 ? 'cheaper' : 'pricier'}">${displayPriceDiff < 0 ? '▼' : '▲'} ${Math.abs(displayPriceDiff)} kr.</div>` : '<div class="price-diff same">Samme pris</div>'}
        </div>
      </div>

      <div class="spec-compare">
        <div class="spec-column spec-column-orig">
          <div class="spec-column-label">Originalt</div>
          <div class="spec-item">
            <div class="spec-item-label">Strikkefasthed</div>
            <div class="spec-item-value">${origYarn.gauge.stitches} m/10 cm</div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Pind</div>
            <div class="spec-item-value">${origYarn.gauge.needle_mm} mm</div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Fiber</div>
            <div class="spec-item-value">${origFiber}</div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Meter/50g</div>
            <div class="spec-item-value">${origYarn.meters_per_50g} m</div>
          </div>
        </div>

        <div class="spec-divider"></div>

        <div class="spec-column spec-column-alt">
          <div class="spec-column-label">Alternativ</div>
          <div class="spec-item">
            <div class="spec-item-label">Strikkefasthed</div>
            <div class="spec-item-value ${gaugeStatus.cls}">
              ${effStitches} m/10 cm${heldDouble ? ` <span class="spec-note">(enkelt: ${yarn.gauge.stitches})</span>` : ''}
              <span class="spec-item-verdict">${gaugeStatus.icon} ${gaugeStatus.text}</span>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Pind</div>
            <div class="spec-item-value ${needleStatus.cls}">
              ${effNeedle} mm${heldDouble ? ` <span class="spec-note">(enkelt: ${yarn.gauge.needle_mm})</span>` : ''}
              <span class="spec-item-verdict">${needleStatus.icon} ${needleStatus.text}</span>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Fiber</div>
            <div class="spec-item-value">${fiberStr}</div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Meter/50g</div>
            <div class="spec-item-value">${effMeters} m${heldDouble ? ` <span class="spec-note">(enkelt: ${yarn.meters_per_50g})</span>` : ''}</div>
          </div>
        </div>
      </div>

      <div class="cost-estimate">
        <span class="cost-label">Estimeret projektkost (${getPatternSizeLabel(pattern)}, ~${patternMeters} m)</span>
        <span class="cost-value">${heldDouble ? `${costEst.skeins} nøgler × ${effPrice} kr. (2×${yarn.price_dkk_50g} kr.)` : `${displaySkeins} nøgler × ${displayEffPrice} kr.`} = <strong>${heldDouble ? costEst.total : displayTotal} kr.</strong></span>
      </div>

      <div class="why-box">
        <span class="why-label">Derfor virker det</span>
        <span class="why-text">${why}</span>
      </div>

      ${yarn.buyUrl
        ? `<a class="buy-btn" href="${yarn.buyUrl}" target="_blank" rel="noopener noreferrer">Køb ${yarn.name} →</a>`
        : `<span class="buy-btn buy-btn--unavailable">Køb-link kommer snart</span>`}
    </div>
  `;
}

// ─── Gauge Logic ──────────────────────────────────────────────────
function gaugeLabel(diff) {
  if (diff === 0)           return { cls: 'exact',  icon: '✓', text: 'Præcist match' };
  if (Math.abs(diff) <= 1) return { cls: 'close',  icon: '≈', text: `${diff > 0 ? '+' : ''}${diff} maske — tæt match` };
  if (Math.abs(diff) <= 2) return { cls: 'close',  icon: '≈', text: `${diff > 0 ? '+' : ''}${diff} masker — acceptabelt` };
  return { cls: 'diff', icon: '!', text: `${diff > 0 ? '+' : ''}${diff} masker — prøvestrik anbefales` };
}

function needleLabel(diff) {
  if (diff === 0)            return { cls: 'exact', icon: '✓', text: 'Samme pind' };
  if (Math.abs(diff) <= 0.5) return { cls: 'close', icon: '≈', text: `Lidt ${diff > 0 ? 'større' : 'mindre'} pind` };
  return { cls: 'diff',  icon: '!', text: `OBS ${diff > 0 ? 'større' : 'mindre'} pind` };
}

// ─── Cost Estimation ──────────────────────────────────────────────
function estimateCost(yarn, totalMeters) {
  const skeins = Math.ceil(totalMeters / yarn.meters_per_50g);
  const total  = skeins * yarn.price_dkk_50g;
  return { skeins, total };
}

// ─── "Derfor virker det" text ────────────────────────────────────
function buildWhy(yarn, origYarn, tierId, gaugeDiff) {
  const parts = [];

  // Gauge
  if (gaugeDiff === 0) {
    parts.push('Identisk strikkefasthed — du behøver ikke justere dit strikketøj.');
  } else if (Math.abs(gaugeDiff) <= 2) {
    parts.push(`Strikkefastheden afviger kun ${Math.abs(gaugeDiff)} maske${Math.abs(gaugeDiff) > 1 ? 'r' : ''}/10 cm — en lille justerring af pindestørrelse løser det normalt.`);
  } else {
    parts.push('Husk prøvestrik — strikkefastheden afviger, og du skal muligvis justere pindevalget.');
  }

  // Fiber comparison
  const origFibers = origYarn.fiber.map(f => f.name.toLowerCase());
  const newFibers  = yarn.fiber.map(f => f.name.toLowerCase());
  const shared = origFibers.filter(f => newFibers.some(nf => nf.includes(f) || f.includes(nf)));

  if (shared.length === origFibers.length && shared.length === newFibers.length) {
    parts.push('Identisk fiberindhold — du får samme egenskaber som originalen.');
  } else {
    // Specific fiber swaps — check both Danish (alpaka/bomuld) and English (alpaca/cotton) spellings
    const isAlpaka   = f => f.includes('alpaka') || f.includes('alpaca');
    const isMerino   = f => f.includes('merino');
    const isMohair   = f => f.includes('mohair');
    const isBomuld   = f => f.includes('bomuld') || f.includes('cotton');
    const isSilke    = f => f.includes('silke')  || f.includes('silk');
    const isCashmere = f => f.includes('cashmere') || f.includes('kashmir');

    const hasAlpaka   = newFibers.some(isAlpaka);
    const hasMerino   = newFibers.some(isMerino);
    const hasMohair   = newFibers.some(isMohair);
    const hasBomuld   = newFibers.some(isBomuld);
    const hasYak      = newFibers.some(f => f.includes('yak'));
    const hasCashmere = newFibers.some(isCashmere);
    const origMohair  = origFibers.some(isMohair);
    const origAlpaka  = origFibers.some(isAlpaka);
    const origCashmere = origFibers.some(isCashmere);

    if (hasCashmere && !origCashmere) {
      parts.push('Cashmere er ekstremt blødt og luksurøst — blødere end merino og draper smukt.');
    }
    if (hasMerino && !origFibers.some(isMerino)) {
      parts.push('Merino giver mere elasticitet end originalens fiber — ribber og strukturmønstre vil sidde skarpere.');
    }
    if (hasAlpaka && !origAlpaka) {
      parts.push('Alpaka giver ekstra blødhed og drape — blødt mod huden, men lav elasticitet (undgå tætte ribber).');
    }
    if (hasMohair && !origMohair) {
      parts.push('Mohair-fibre skaber en karakteristisk halo-effekt der løfter garnets visuelle udtryk.');
    }
    if (hasBomuld && !origFibers.some(isBomuld)) {
      parts.push('Bomuld har ingen elasticitet — perfekt til sommerstrik og luftige projekter.');
    }
    if (hasYak) {
      parts.push('Yak-fiber er ekstraordinært blødt og varmt — en sjælden luksus der overgår selv cashmere i blødhed.');
    }
  }

  // Price difference (neutral)
  const priceDiff = (yarn.price_dkk_50g ?? 0) - (origYarn.price_dkk_50g ?? 0);
  if (priceDiff < -20) {
    parts.push(`Ca. ${Math.abs(priceDiff)} kr. billigere pr. 50g end originalen.`);
  } else if (priceDiff > 20) {
    parts.push(`Ca. ${priceDiff} kr. dyrere pr. 50g end originalen.`);
  }

  // Special props
  if (yarn.eco)          parts.push('🌿 GOTS-certificeret økologisk produktion.');
  if (yarn.mulesing_free && !origYarn.mulesing_free) parts.push('Mulesing-fri produktion.');
  if (yarn.care === 'Maskinvask 40°C' && origYarn.care !== 'Maskinvask 40°C') {
    parts.push('Tåler maskinen — praktisk fordel i hverdagen.');
  }

  return parts.join(' ');
}

// ─── Badges ───────────────────────────────────────────────────────
function buildBadges(yarn, origYarn) {
  const b = [];
  if (yarn.eco)          b.push(`<span class="badge badge-eco">🌿 Øko</span>`);
  if (yarn.vegan)        b.push(`<span class="badge badge-vegan">🐾 Vegansk</span>`);
  if (yarn.mulesing_free) b.push(`<span class="badge badge-mf">✓ Mulesing-fri</span>`);
  if (yarn.care === 'Maskinvask 40°C') b.push(`<span class="badge badge-wash">💧 Maskinvask</span>`);
  const hasAlpaka = yarn.fiber.some(f => f.name.toLowerCase().includes('alpaka'));
  const hasMohair = yarn.fiber.some(f => f.name.toLowerCase().includes('mohair'));
  if (hasAlpaka && !origYarn.fiber.some(f => f.name.toLowerCase().includes('alpaka'))) {
    b.push(`<span class="badge badge-fiber">Alpaka</span>`);
  }
  if (hasMohair && !origYarn.fiber.some(f => f.name.toLowerCase().includes('mohair'))) {
    b.push(`<span class="badge badge-fiber">Mohair halo</span>`);
  }
  return b.join('');
}

// ─── Helpers ──────────────────────────────────────────────────────
function findYarn(id) {
  return YARNS.find(y => y.id === id);
}

function shareOnInstagram(patternId) {
  const pattern = PATTERNS.find(p => p.id === patternId);
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}?pattern=${patternId}`;
  const text = `Se ${pattern.name} på Garnalternativer! 🧶\n\n${url}`;

  // Copy to clipboard then open Instagram
  navigator.clipboard.writeText(text).then(() => {
    alert('Link kopieret! Indsæt det i din Instagram bio, story eller DM.');
    window.open('https://www.instagram.com/', '_blank');
  }).catch(() => {
    alert('Kunne ikke kopiere link. Prøv igen.');
  });
}

function copyShareLink() {
  if (!currentPattern) return;
  // Use current URL directly — URL routing keeps it in sync
  const url = window.location.href;

  navigator.clipboard.writeText(url).then(() => {
    alert('Link kopieret til udklipsholder!');
  }).catch(() => {
    alert('Kunne ikke kopiere link. Prøv igen.');
  });
}
