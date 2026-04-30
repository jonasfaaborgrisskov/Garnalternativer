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
// Rules (per editorial decisions):
// 1. Tier is RELATIVE to original yarn price — budget = cheaper, premium = pricier
// 2. Gauge preference: exact match > ±1 > ±2 > reject (>±2 never used)
// 3. Halsnært strik (tørklæde/sjal/halskrave): exclude mohair
// 4. Mid tier: similar price (±25%) with different fiber — original always included
// 5. Manually curated entries always stay at the top; auto-matches are appended
//
const MAX_PER_TIER = 12; // max alternatives shown per tier (manual + auto)

// Parse needle_mm which may be a number (3.75) or a range string ("3,5-4" / "3-3,5").
// Returns the midpoint as a number for algorithmic comparisons.
function parseNeedle(val) {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const parts = String(val).replace(/,/g, '.').split('-').map(Number).filter(n => !isNaN(n));
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// Classify yarn into broad visual-character groups.
// Alternatives must share the same group — merino and linen look nothing alike.
function getFiberGroup(yarn) {
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

function populatePatternTiers() {
  const HALSNÆRT_TYPES = ['tørklæde', 'halstørklæde', 'halskrave', 'sjal'];

  PATTERNS.forEach(pattern => {
    const origYarn = findYarn(pattern.originalYarn_id);
    if (!origYarn) return;

    const origPrice = origYarn.price_dkk_50g;
    const isHalsnært = HALSNÆRT_TYPES.some(t => (pattern.type || '').toLowerCase().includes(t));

    // Candidate pool: ±2 gauge stitches, ±1 mm needle, same fiber group (weight label irrelevant)
    const origGroup = getFiberGroup(origYarn);
    const candidates = YARNS
      .filter(y => {
        if (y.id === origYarn.id) return false;
        if (y.gauge.stitches == null || origYarn.gauge.stitches == null) return false;
        if (Math.abs(y.gauge.stitches - origYarn.gauge.stitches) > 2) return false;
        if (y.gauge.needle_mm != null && origYarn.gauge.needle_mm != null &&
            Math.abs(parseNeedle(y.gauge.needle_mm) - parseNeedle(origYarn.gauge.needle_mm)) > 1.0) return false;
        if (getFiberGroup(y) !== origGroup) return false;
        // Blow yarns only match blow yarns, regular yarns don't get blow yarn alternatives
        const origIsBlow = origYarn.spinType === 'blow';
        if (origIsBlow !== (y.spinType === 'blow')) return false;
        // No sock yarns in sweater alternatives
        if (y.isSockYarn) return false;
        // No synthetic fibers (nylon, polyester, akryl) — only allowed in sock yarns
        const SYNTH = ['nylon', 'polyamid', 'polyester', 'akryl', 'acrylic'];
        if (y.fiber.some(f => SYNTH.some(s => f.name.toLowerCase().includes(s)))) return false;
        // Halsnært: no mohair
        if (isHalsnært && y.fiber.some(f => f.name.toLowerCase().includes('mohair'))) return false;
        return true;
      })
      .map(y => ({
        yarn: y,
        gaugeDelta: Math.abs(y.gauge.stitches - origYarn.gauge.stitches),
      }))
      // Sort: gauge quality first (exact > ±1 > ±2), then price ascending
      .sort((a, b) => a.gaugeDelta - b.gaugeDelta || a.yarn.price_dkk_50g - b.yarn.price_dkk_50g);

    // Tier boundaries relative to original
    const isBudget  = y => y.price_dkk_50g < origPrice * 0.90;       // >10% cheaper
    const isMid     = y => y.price_dkk_50g >= origPrice * 0.75        // within ±25%
                        && y.price_dkk_50g <= origPrice * 1.25;
    const isPremium = y => y.price_dkk_50g > origPrice * 1.10;        // >10% pricier

    // Save manual curation counts before augmenting (used by renderTierSections)
    pattern._curatedCount = {
      budget:  (pattern.tiers.budget  || []).length,
      mid:     (pattern.tiers.mid     || []).length,
      premium: (pattern.tiers.premium || []).length,
    };

    // All manually curated IDs across all tiers — auto-matches must not duplicate these
    const allManual = new Set([
      ...(pattern.tiers.budget  || []),
      ...(pattern.tiers.mid     || []),
      ...(pattern.tiers.premium || []),
      origYarn.id,
    ]);
    // Track auto-assigned IDs to prevent cross-tier duplicates
    const autoAssigned = new Set();

    // ── Budget tier ──
    {
      const manual = pattern.tiers.budget || [];
      const slots  = Math.max(0, MAX_PER_TIER - manual.length);
      const auto   = candidates
        .filter(({yarn}) => isBudget(yarn) && !allManual.has(yarn.id) && !autoAssigned.has(yarn.id))
        .slice(0, slots)
        .map(({yarn}) => yarn.id);
      auto.forEach(id => autoAssigned.add(id));
      pattern.tiers.budget = [...manual, ...auto];
    }

    // ── Mid tier ──
    {
      const manual = pattern.tiers.mid || [];
      const slots  = Math.max(0, MAX_PER_TIER - manual.length);
      const auto   = candidates
        .filter(({yarn}) => isMid(yarn) && !allManual.has(yarn.id) && !autoAssigned.has(yarn.id))
        .slice(0, slots)
        .map(({yarn}) => yarn.id);
      auto.forEach(id => autoAssigned.add(id));
      pattern.tiers.mid = [...manual, ...auto];
    }

    // ── Premium tier ──
    {
      const manual = pattern.tiers.premium || [];
      const slots  = Math.max(0, MAX_PER_TIER - manual.length);
      const auto   = candidates
        .filter(({yarn}) => isPremium(yarn) && !allManual.has(yarn.id) && !autoAssigned.has(yarn.id))
        .sort((a, b) => b.yarn.price_dkk_50g - a.yarn.price_dkk_50g) // priciest first
        .slice(0, slots)
        .map(({yarn}) => yarn.id);
      pattern.tiers.premium = [...manual, ...auto];
    }

    // ── Held-double candidates ──
    // Lighter yarns (fingering/sport) that match when used two strands together.
    // Effective gauge ≈ stitches × 0.72, effective needle ≈ needle × 1.4.
    // Blow yarn originals are excluded: held-double regular yarn ≠ blow yarn character.
    pattern._heldDouble = new Set();
    const origIsBlow = origYarn.spinType === 'blow';
    if (!origIsBlow) {
    const SYNTH = ['nylon', 'polyamid', 'polyester', 'akryl', 'acrylic'];
    const hdCandidates = YARNS
      .filter(y => {
        if (y.id === origYarn.id) return false;
        if (y.gauge.stitches == null || origYarn.gauge.stitches == null) return false;
        const hdStitches = Math.round(y.gauge.stitches * 0.72);
        const hdNeedle   = y.gauge.needle_mm != null ? parseNeedle(y.gauge.needle_mm) * 1.4 : null;
        if (Math.abs(hdStitches - origYarn.gauge.stitches) > 2) return false;
        if (hdNeedle != null && origYarn.gauge.needle_mm != null &&
            Math.abs(hdNeedle - parseNeedle(origYarn.gauge.needle_mm)) > 1.0) return false;
        if (getFiberGroup(y) !== origGroup) return false;
        if (y.spinType === 'blow') return false;
        if (y.isSockYarn) return false;
        if (y.fiber.some(f => SYNTH.some(s => f.name.toLowerCase().includes(s)))) return false;
        if (allManual.has(y.id) || autoAssigned.has(y.id)) return false;
        return true;
      })
      .map(y => ({
        yarn: y,
        gaugeDelta:     Math.abs(Math.round(y.gauge.stitches * 0.72) - origYarn.gauge.stitches),
        effectivePrice: y.price_dkk_50g * 2,
      }))
      .sort((a, b) => a.gaugeDelta - b.gaugeDelta || a.effectivePrice - b.effectivePrice);

    const isBudgetHD  = c => c.effectivePrice < origPrice * 0.90;
    const isMidHD     = c => c.effectivePrice >= origPrice * 0.75 && c.effectivePrice <= origPrice * 1.25;
    const isPremiumHD = c => c.effectivePrice > origPrice * 1.10;

    ['budget', 'mid', 'premium'].forEach(tier => {
      const isPriceTier = tier === 'budget' ? isBudgetHD : tier === 'mid' ? isMidHD : isPremiumHD;
      const sorted = tier === 'premium'
        ? [...hdCandidates].sort((a, b) => b.effectivePrice - a.effectivePrice)
        : hdCandidates;
      const slots = Math.max(0, MAX_PER_TIER - pattern.tiers[tier].length);
      const hdIds = sorted
        .filter(c => isPriceTier(c) && !autoAssigned.has(c.yarn.id))
        .slice(0, slots)
        .map(c => c.yarn.id);
      hdIds.forEach(id => { autoAssigned.add(id); pattern._heldDouble.add(id); });
      pattern.tiers[tier] = [...pattern.tiers[tier], ...hdIds];
    });
    } // end if (!origIsBlow)
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
    const yarn = findYarn(p.originalYarn_id);
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

// ─── Pattern Detail ───────────────────────────────────────────────
function showDetail(patternId, pushToHistory = true) {
  currentPattern = PATTERNS.find(p => p.id === patternId);
  const origYarn = findYarn(currentPattern.originalYarn_id);
  const secYarn  = currentPattern.secondaryYarn_id ? findYarn(currentPattern.secondaryYarn_id) : null;

  document.getElementById('patternSection').style.display = 'none';
  document.getElementById('detailSection').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('detailContent').innerHTML = `
    ${renderPatternHeader(currentPattern, origYarn, secYarn)}
    ${renderTierComparison(currentPattern.id)}
    ${renderTierSections(currentPattern, origYarn)}
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
function renderPatternHeader(pattern, origYarn, secYarn) {
  const w = WEIGHTS[origYarn.weight];
  const fiberStr = origYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const costEst  = estimateCost(origYarn, pattern.totalMeters_M);

  let secondaryBox = '';
  if (secYarn) {
    const sf = secYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
    const secCostEst = estimateCost(secYarn, pattern.totalMeters_M);
    secondaryBox = `
      <div class="original-yarn-header">
        <div class="yarn-spec-label">Sekundært garn (holdes dobbelt)</div>

        <div class="orig-yarn-top">
          <div>
            <div class="orig-yarn-name">${secYarn.name}</div>
            <div class="orig-yarn-brand">${secYarn.brand}</div>
          </div>
          <div class="orig-yarn-price">
            <div class="orig-price-main">${secYarn.price_dkk_50g} kr.</div>
            <div class="orig-price-unit">pr. 50g</div>
          </div>
        </div>

        <div class="orig-yarn-attrs">
          <div class="orig-attr">
            <div class="orig-attr-label">Strikkefasthed</div>
            <div class="orig-attr-value">${secYarn.gauge.stitches} m/10 cm</div>
          </div>
          <div class="orig-attr">
            <div class="orig-attr-label">Pind</div>
            <div class="orig-attr-value">${secYarn.gauge.needle_mm} mm</div>
          </div>
          <div class="orig-attr">
            <div class="orig-attr-label">Fiber</div>
            <div class="orig-attr-value">${sf}</div>
          </div>
          <div class="orig-attr">
            <div class="orig-attr-label">Meter/50g</div>
            <div class="orig-attr-value">${secYarn.meters_per_50g} m</div>
          </div>
        </div>

        <div class="orig-yarn-cost">
          <div class="orig-cost-label">Estimeret projektkost (str. M, ~${pattern.totalMeters_M} m)</div>
          <div class="orig-cost-value">${secCostEst.skeins} nøgler × ${secYarn.price_dkk_50g} kr. = <strong>${secCostEst.total} kr.</strong></div>
        </div>
      </div>`;
  }

  const imageCol = pattern.imageUrl
    ? `<div class="detail-image-col"><img src="${pattern.imageUrl}" alt="${pattern.name}" onerror="this.parentElement.className='detail-image-col detail-image-col--fallback'; this.outerHTML='<div class=&quot;detail-emoji-fallback&quot;>${pattern.emoji}</div>'"></div>`
    : `<div class="detail-image-col detail-image-col--fallback"><div class="detail-emoji-fallback">${pattern.emoji}</div></div>`;

  return `
    <button class="back-btn" onclick="showPatternList()">← Alle opskrifter</button>

    <div class="detail-hero">
      ${imageCol}
      <div class="detail-data">
        <div class="detail-type">${pattern.type} · ${pattern.designer} · Sværhedsgrad: ${typeof pattern.difficulty === 'number' ? pattern.difficulty + '/10' : (formatFilterLabel(pattern.difficulty, 'difficulty') || pattern.difficulty)}</div>
        <h1 class="detail-title">${pattern.name}</h1>
        <p class="detail-desc">${pattern.description}</p>

        <div class="original-yarn-header">
          <div class="yarn-spec-label">Originalt garn</div>

          <div class="orig-yarn-top">
            <div>
              <div class="orig-yarn-name">${origYarn.name}</div>
              <div class="orig-yarn-brand">${origYarn.brand}</div>
            </div>
            <div class="orig-yarn-price">
              <div class="orig-price-main">${origYarn.price_dkk_50g} kr.</div>
              <div class="orig-price-unit">pr. 50g</div>
            </div>
          </div>

          <div class="orig-yarn-attrs">
            <div class="orig-attr">
              <div class="orig-attr-label">Strikkefasthed</div>
              <div class="orig-attr-value">${origYarn.gauge.stitches} m/10 cm</div>
            </div>
            <div class="orig-attr">
              <div class="orig-attr-label">Pind</div>
              <div class="orig-attr-value">${origYarn.gauge.needle_mm} mm</div>
            </div>
            <div class="orig-attr">
              <div class="orig-attr-label">Fiber</div>
              <div class="orig-attr-value">${fiberStr}</div>
            </div>
            <div class="orig-attr">
              <div class="orig-attr-label">Meter/50g</div>
              <div class="orig-attr-value">${origYarn.meters_per_50g} m</div>
            </div>
          </div>

          <div class="orig-yarn-cost">
            <div class="orig-cost-label">Estimeret projektkost (str. M, ~${pattern.totalMeters_M} m)</div>
            <div class="orig-cost-value">${costEst.skeins} nøgler × ${origYarn.price_dkk_50g} kr. = <strong>${costEst.total} kr.</strong></div>
          </div>
        </div>
        ${secondaryBox}
      </div>
    </div>

    <div class="tier-intro">
      <p>Herunder finder du alternativer til <em>${origYarn.name}</em> i tre prisniveauer.
      Strikkefasthed og pindestørrelse er angivet på hvert garn — husk altid at strikke en prøvelap.</p>
    </div>
  `;
}

// ─── Tier Sections ────────────────────────────────────────────────
function renderTierSections(pattern, origYarn) {
  return ['mid', 'budget', 'premium'].map(tierId => {
    const tier    = TIERS[tierId];
    const yarnIds = pattern.tiers[tierId] || [];
    const yarns   = yarnIds.map(findYarn).filter(Boolean);
    const curatedN = (pattern._curatedCount && pattern._curatedCount[tierId]) || 0;

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
          <p class="tier-empty">Ingen alternativer endnu.</p>
        </section>`;
    }

    // Split into curated + auto sections
    const curatedYarns = yarns.slice(0, curatedN);
    const autoYarns    = yarns.slice(curatedN);

    const hd = pattern._heldDouble || new Set();
    const renderCard = y => renderYarnCard(y, origYarn, pattern, tierId, hd.has(y.id));

    let cardsHtml = '';
    if (curatedYarns.length > 0) {
      cardsHtml += `<div class="yarn-cards">${curatedYarns.map(renderCard).join('')}</div>`;
    }
    if (autoYarns.length > 0) {
      const divider = curatedYarns.length > 0
        ? `<div class="tier-auto-divider"><span>Flere matchende alternativer fra databasen</span></div>`
        : '';
      cardsHtml += `${divider}<div class="yarn-cards yarn-cards--auto">${autoYarns.map(renderCard).join('')}</div>`;
    }

    return `
      <section class="tier-section">
        <div class="tier-heading">
          <span class="tier-emoji">${tier.emoji}</span>
          <div>
            <div class="tier-label" style="color:${tier.color}">${tier.label}</div>
            <div class="tier-sublabel">${tier.sublabel} · ${yarns.length} alternativer</div>
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

  const costEst   = heldDouble
    ? estimateCost({ ...yarn, meters_per_50g: effMeters, price_dkk_50g: effPrice }, pattern.totalMeters_M)
    : estimateCost(yarn, pattern.totalMeters_M);
  const gaugeDiff = effStitches - origYarn.gauge.stitches;
  const gaugeStatus = gaugeLabel(gaugeDiff);
  const needleDiff  = effNeedleNum - parseNeedle(origYarn.gauge.needle_mm);
  const needleStatus = needleLabel(needleDiff);
  const fiberStr  = yarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const origFiber = origYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const priceDiff = effPrice - origYarn.price_dkk_50g;
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
          <div class="price-main">${effPrice} kr.</div>
          <div class="price-unit">${heldDouble ? 'pr. 2×50g' : 'pr. 50g'}</div>
          ${priceDiff !== 0 ? `<div class="price-diff ${priceDiff < 0 ? 'cheaper' : 'pricier'}">${priceDiff < 0 ? '▼' : '▲'} ${Math.abs(priceDiff)} kr.</div>` : '<div class="price-diff same">Samme pris</div>'}
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
        <span class="cost-label">Estimeret projektkost (str. M, ~${pattern.totalMeters_M} m)</span>
        <span class="cost-value">${heldDouble ? `${costEst.skeins} nøgler × ${effPrice} kr. (2×${yarn.price_dkk_50g} kr.)` : `${costEst.skeins} nøgler × ${yarn.price_dkk_50g} kr.`} = <strong>${costEst.total} kr.</strong></span>
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

  // Price
  const priceDiff = yarn.price_dkk_50g - origYarn.price_dkk_50g;
  const costEst   = estimateCost(yarn, 1500); // rough baseline
  if (tierId === 'budget' && priceDiff < -20) {
    parts.push(`Du sparer ca. ${Math.abs(priceDiff)} kr. pr. nøgle vs. originalen.`);
  } else if (tierId === 'premium' && priceDiff > 20) {
    parts.push(`Den højere pris afspejler fiber-kvaliteten og produktionsforhold.`);
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
