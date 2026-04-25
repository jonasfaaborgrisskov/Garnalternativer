// ─── State ────────────────────────────────────────────────────────
let currentPattern = null;

// ─── Boot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderPatternGrid(PATTERNS);
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.target.value = ''; renderPatternGrid(PATTERNS); }
  });
});

// ─── Search ──────────────────────────────────────────────────────
function handleSearch(e) {
  const q = e.target.value.trim().toLowerCase();
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
    return `
      <article class="pattern-card" onclick="showDetail('${p.id}')" role="button" tabindex="0"
               onkeydown="if(event.key==='Enter')showDetail('${p.id}')">
        <div class="pattern-card-emoji">${p.emoji}</div>
        <div class="pattern-card-body">
          <div class="pattern-card-type">${p.type} · ${p.designer}</div>
          <h3 class="pattern-card-name">${p.name}</h3>
          <div class="pattern-card-yarn">Originalt garn: <strong>${yarn.name}</strong> — ${yarn.brand}</div>
          <div class="pattern-card-pills">
            <span class="pill pill-weight">${w.label}</span>
            <span class="pill pill-gauge">${yarn.gauge.stitches} m/10 cm</span>
            <span class="pill pill-needle">Pind ${yarn.gauge.needle_mm} mm</span>
          </div>
          <div class="pattern-card-footer">
            <span class="alt-count">${tierCount} alternativer i 3 prisniveauer</span>
            <span class="card-arrow">→</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ─── Pattern Detail ───────────────────────────────────────────────
function showDetail(patternId) {
  currentPattern = PATTERNS.find(p => p.id === patternId);
  const origYarn = findYarn(currentPattern.originalYarn_id);
  const secYarn  = currentPattern.secondaryYarn_id ? findYarn(currentPattern.secondaryYarn_id) : null;

  document.getElementById('patternSection').style.display = 'none';
  document.getElementById('detailSection').style.display = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('detailContent').innerHTML = `
    ${renderPatternHeader(currentPattern, origYarn, secYarn)}
    ${renderTierSections(currentPattern, origYarn)}
    ${renderShareSection(currentPattern)}
  `;
}

function showPatternList() {
  document.getElementById('patternSection').style.display = '';
  document.getElementById('detailSection').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return `
    <button class="back-btn" onclick="showPatternList()">← Alle opskrifter</button>

    <div class="detail-header">
      <div class="detail-emoji">${pattern.emoji}</div>
      <div class="detail-meta">
        <div class="detail-type">${pattern.type} · ${pattern.designer} · ${pattern.difficulty}</div>
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
      Alle alternativer er indenfor samme garnvægt og max ±2 maskers afvigelse i strikkefasthed.</p>
    </div>
  `;
}

// ─── Tier Sections ────────────────────────────────────────────────
function renderTierSections(pattern, origYarn) {
  return ['mid', 'budget', 'premium'].map(tierId => {
    const tier = TIERS[tierId];
    const yarnIds = pattern.tiers[tierId] || [];
    const yarns = yarnIds.map(findYarn).filter(Boolean);

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
          <p class="tier-empty">Ingen kuraterede alternativer i dette niveau endnu.</p>
        </section>`;
    }

    const cards = yarns.map(yarn => renderYarnCard(yarn, origYarn, pattern, tierId)).join('');

    return `
      <section class="tier-section">
        <div class="tier-heading">
          <span class="tier-emoji">${tier.emoji}</span>
          <div>
            <div class="tier-label" style="color:${tier.color}">${tier.label}</div>
            <div class="tier-sublabel">${tier.sublabel}</div>
          </div>
        </div>
        <div class="yarn-cards">${cards}</div>
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
function renderYarnCard(yarn, origYarn, pattern, tierId) {
  const costEst   = estimateCost(yarn, pattern.totalMeters_M);
  const gaugeDiff = yarn.gauge.stitches - origYarn.gauge.stitches;
  const gaugeStatus = gaugeLabel(gaugeDiff);
  const needleDiff  = yarn.gauge.needle_mm - origYarn.gauge.needle_mm;
  const needleStatus = needleLabel(needleDiff);
  const fiberStr  = yarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const origFiber = origYarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');
  const priceDiff = yarn.price_dkk_50g - origYarn.price_dkk_50g;
  const badges    = buildBadges(yarn, origYarn);
  const why       = buildWhy(yarn, origYarn, tierId, gaugeDiff);

  return `
    <div class="yarn-card">
      <div class="yarn-card-top">
        <div>
          <div class="yarn-card-name">${yarn.name}</div>
          <div class="yarn-card-brand">${yarn.brand} · ${WEIGHTS[yarn.weight].label}</div>
          ${badges ? `<div class="yarn-card-badges">${badges}</div>` : ''}
        </div>
        <div class="yarn-card-price">
          <div class="price-main">${yarn.price_dkk_50g} kr.</div>
          <div class="price-unit">pr. 50g</div>
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
              ${yarn.gauge.stitches} m/10 cm
              <span class="spec-item-verdict">${gaugeStatus.icon} ${gaugeStatus.text}</span>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Pind</div>
            <div class="spec-item-value ${needleStatus.cls}">
              ${yarn.gauge.needle_mm} mm
              <span class="spec-item-verdict">${needleStatus.icon} ${needleStatus.text}</span>
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Fiber</div>
            <div class="spec-item-value">${fiberStr}</div>
          </div>
          <div class="spec-item">
            <div class="spec-item-label">Meter/50g</div>
            <div class="spec-item-value">${yarn.meters_per_50g} m</div>
          </div>
        </div>
      </div>

      <div class="cost-estimate">
        <span class="cost-label">Estimeret projektkost (str. M, ~${pattern.totalMeters_M} m)</span>
        <span class="cost-value">${costEst.skeins} nøgler × ${yarn.price_dkk_50g} kr. = <strong>${costEst.total} kr.</strong></span>
      </div>

      <div class="why-box">
        <span class="why-label">Derfor virker det</span>
        <span class="why-text">${why}</span>
      </div>

      <a class="buy-btn" href="${yarn.buyUrl}" target="_blank" rel="noopener">
        Køb ${yarn.name} →
      </a>
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
  if (Math.abs(diff) <= 0.5) return { cls: 'close', icon: '≈', text: `${diff > 0 ? '+' : ''}${diff} mm` };
  return { cls: 'diff',  icon: '!', text: `${diff > 0 ? 'større' : 'mindre'} pind (${Math.abs(diff)} mm forskel)` };
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
    // Specific fiber swaps
    const hasAlpaka   = newFibers.some(f => f.includes('alpaka'));
    const hasMerino   = newFibers.some(f => f.includes('merino'));
    const hasMohair   = newFibers.some(f => f.includes('mohair'));
    const hasBomuld   = newFibers.some(f => f.includes('bomuld'));
    const hasYak      = newFibers.some(f => f.includes('yak'));
    const origMohair  = origFibers.some(f => f.includes('mohair'));
    const origAlpaka  = origFibers.some(f => f.includes('alpaka'));

    if (hasMerino && !origFibers.some(f => f.includes('merino'))) {
      parts.push('Merino giver mere elasticitet end originalens fiber — ribber og strukturmønstre vil sidde skarpere.');
    }
    if (hasAlpaka && !origAlpaka) {
      parts.push('Alpaka giver ekstra blødhed og drape, men lav elasticitet — undgå tætte ribber.');
    }
    if (hasMohair && !origMohair) {
      parts.push('Mohair-fibre skaber en karakteristisk halo-effekt der løfter garnets visuelle udtryk.');
    }
    if (hasBomuld) {
      parts.push('Bomuld har ingen elasticitet — perfekt til sommerstrik, men undgå ribber og farvespil.');
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
  const text = `Check out ${pattern.name} on Garnalternativer! 🧶\n\n${url}`;

  // Copy to clipboard
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied! Paste it in your Instagram bio, story, or DM.');
    window.open('https://www.instagram.com/', '_blank');
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Could not copy link. Please try again.');
  });
}

function copyShareLink() {
  if (!currentPattern) return;
  const baseUrl = window.location.origin + window.location.pathname;
  const url = `${baseUrl}?pattern=${currentPattern.id}`;

  navigator.clipboard.writeText(url).then(() => {
    alert('Link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Could not copy link. Please try again.');
  });
}
