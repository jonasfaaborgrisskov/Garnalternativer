// ─── Yarn-to-Patterns Cross-linking ──────────────────────────────────

function getPatternsForYarn(yarnId) {
  const patterns = [];

  PATTERNS.forEach(pattern => {
    // Check if yarn is in any tier
    const isInPattern =
      pattern.originalYarn_id === yarnId ||
      pattern.secondaryYarn_id === yarnId ||
      Object.values(pattern.tiers).some(tier => tier.includes(yarnId));

    if (isInPattern) {
      patterns.push(pattern);
    }
  });

  return patterns;
}

function renderYarnWithPatterns(yarnId) {
  const yarn = findYarn(yarnId);
  if (!yarn) return '';

  const patterns = getPatternsForYarn(yarnId);
  const w = WEIGHTS[yarn.weight];
  const t = TIERS[yarn.tier];
  const isFav = (typeof isFavorited === 'function') ? isFavorited(yarnId) : false;
  const pricePerMeter = (yarn.price_dkk_50g / yarn.meters_per_50g).toFixed(2);

  let patternsList = '';
  if (patterns.length > 0) {
    patternsList = `
      <div class="yarn-patterns-section">
        <h3 class="yarn-patterns-title">Opskrifter der bruger dette garn</h3>
        <div class="yarn-patterns-list">
          ${patterns.map(p => `
            <div class="yarn-pattern-item">
              <div class="yarn-pattern-emoji">${p.emoji}</div>
              <div class="yarn-pattern-info">
                <div class="yarn-pattern-name">${p.name}</div>
                <div class="yarn-pattern-designer">${p.type} · ${p.designer}</div>
              </div>
              <button class="yarn-pattern-btn" onclick="if(typeof showDetail==='function'){closeYarnDetail();showDetail('${p.id}');}else{window.location.href='index.html?pattern=${p.id}';}">Se opskrift →</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="yarn-detail-modal-overlay" onclick="closeYarnDetail(event)">
      <div class="yarn-detail-modal" onclick="event.stopPropagation()">
        <button class="yarn-detail-close" onclick="closeYarnDetail()">✕</button>

        ${yarn.imageUrl ? `<img class="yarn-detail-hero-img" src="${yarn.imageUrl}" alt="${yarn.name}" onerror="this.remove()">` : ''}

        <div class="yarn-detail-content">
          <div class="yarn-detail-header">
            <div class="yarn-detail-price">
              <div class="yarn-price-main">${yarn.price_dkk_50g} kr.</div>
              <div class="yarn-price-unit">pr. 50g</div>
            </div>
            <div class="yarn-detail-info">
              <h2 class="yarn-detail-name">${yarn.name}</h2>
              <p class="yarn-detail-brand">${yarn.brand}</p>
              <div class="yarn-detail-badges">
                ${yarn.eco ? '<span class="detail-badge eco-badge">🌿 Økologisk</span>' : ''}
                ${yarn.vegan ? '<span class="detail-badge vegan-badge">🌱 Vegansk</span>' : ''}
                ${yarn.mulesing_free ? '<span class="detail-badge mulesing-badge">♻️ Mulesing-frit</span>' : ''}
              </div>
            </div>
          </div>

          <div class="yarn-detail-specs">
            <div class="spec-group">
              <div class="spec-item">
                <div class="spec-label">Vægt</div>
                <div class="spec-value">${w.label}</div>
              </div>
              <div class="spec-item">
                <div class="spec-label">Strikkefasthed</div>
                <div class="spec-value">${yarn.gauge.stitches != null ? yarn.gauge.stitches + ' m/10 cm' : '–'}</div>
              </div>
              <div class="spec-item">
                <div class="spec-label">Pindestørrelse</div>
                <div class="spec-value">${yarn.gauge.needle_mm} mm</div>
              </div>
              <div class="spec-item">
                <div class="spec-label">Meter/50g</div>
                <div class="spec-value">${yarn.meters_per_50g} m</div>
              </div>
            </div>
          </div>

          <div class="yarn-detail-fiber">
            <div class="fiber-label">Fiber</div>
            <div class="fiber-composition">
              ${yarn.fiber.map(f => `<span class="fiber-item">${f.pct}% ${f.name}</span>`).join(', ')}
            </div>
          </div>

          <div class="yarn-detail-care">
            <div class="care-label">Pasning</div>
            <p class="care-text">${yarn.care || 'Se garnetiket for pasningstips'}</p>
          </div>

          ${yarn.buyUrl ? `
            <a href="${yarn.buyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
              🛒 Køb garn
            </a>
          ` : ''}

          ${patternsList}
          ${typeof renderSimilarYarnsSection === 'function' ? renderSimilarYarnsSection(yarnId) : ''}
        </div>
      </div>
    </div>
  `;
}

function showYarnDetail(yarnId) {
  const modal = renderYarnWithPatterns(yarnId);
  const modalContainer = document.getElementById('yarnDetailModal') || createYarnDetailContainer();
  modalContainer.innerHTML = modal;
  modalContainer.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeYarnDetail(event) {
  if (event && event.target.id !== 'yarnDetailModal' && event.target.className !== 'yarn-detail-modal-overlay') {
    return;
  }
  const modalContainer = document.getElementById('yarnDetailModal');
  if (modalContainer) {
    modalContainer.style.display = 'none';
  }
  document.body.style.overflow = 'auto';
}

function createYarnDetailContainer() {
  const div = document.createElement('div');
  div.id = 'yarnDetailModal';
  div.style.display = 'none';
  document.body.appendChild(div);
  return div;
}

// Make yarn cards clickable to show details
// Handles both .yarn-card (pattern detail page) and .bc-yarn-card (browse page)
function enhanceYarnCardClick() {
  document.addEventListener('click', (e) => {
    const yarnCard = e.target.closest('.yarn-card, .bc-yarn-card');
    if (yarnCard && !e.target.closest('a, button, .favorite-btn, .bc-fav-btn')) {
      const yarnId = yarnCard.getAttribute('data-yarn-id');
      if (yarnId) {
        showYarnDetail(yarnId);
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  enhanceYarnCardClick();
});
