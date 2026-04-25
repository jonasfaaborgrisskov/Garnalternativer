// ─── Yarn Browser ──────────────────────────────────────────────────

function findYarn(id) {
  return YARNS.find(y => y.id === id);
}

function renderBrowserYarnCard(yarn, tier) {
  const w = WEIGHTS[yarn.weight];
  const t = TIERS[tier || yarn.tier];
  const isFav = (typeof isFavorited === 'function') ? isFavorited(yarn.id) : false;
  const pricePerMeter = (yarn.price_dkk_50g / yarn.meters_per_50g).toFixed(2);

  return `
    <article class="yarn-card" data-yarn-id="${yarn.id}">
      ${typeof isFavorited === 'function' ? `<button class="favorite-btn ${isFav ? 'favorited' : ''}" onclick="event.stopPropagation(); toggleFavorite('${yarn.id}'); location.reload();">
        ${isFav ? '❤️' : '🤍'}
      </button>` : ''}
      <div class="yarn-card-header">
        <h3 class="yarn-name">${yarn.name}</h3>
        <p class="yarn-brand">${yarn.brand}</p>
        <div class="yarn-card-eco-badges">
          ${yarn.eco ? '<span class="eco-badge">🌿 Økologisk</span>' : ''}
          ${yarn.vegan ? '<span class="eco-badge">🌱 Vegansk</span>' : ''}
          ${yarn.mulesing_free ? '<span class="eco-badge">♻️ Mulesing-frit</span>' : ''}
        </div>
      </div>
      <div class="yarn-card-specs">
        <div class="yarn-spec-item">
          <span class="yarn-spec-label">Vægt</span>
          <span class="yarn-spec-value">${w.label}</span>
        </div>
        <div class="yarn-spec-item">
          <span class="yarn-spec-label">Masketæthed</span>
          <span class="yarn-spec-value">${yarn.gauge.stitches} m/10 cm</span>
        </div>
        <div class="yarn-spec-item">
          <span class="yarn-spec-label">Pind</span>
          <span class="yarn-spec-value">${yarn.gauge.needle_mm} mm</span>
        </div>
        <div class="yarn-spec-item">
          <span class="yarn-spec-label">Meter/50g</span>
          <span class="yarn-spec-value">${yarn.meters_per_50g} m</span>
        </div>
      </div>
      <div class="yarn-card-fiber">
        <span class="yarn-spec-label">Fiber</span>
        <div class="fiber-list">
          ${yarn.fiber.map(f => `<span class="fiber-tag">${f.pct}% ${f.name}</span>`).join('')}
        </div>
      </div>
      <div class="yarn-card-pricing">
        <div class="yarn-card-price">
          <span class="yarn-spec-label">Pris per 50g</span>
          <span class="yarn-price">${yarn.price_dkk_50g} kr</span>
        </div>
        <div class="yarn-card-price">
          <span class="yarn-spec-label">Pris per meter</span>
          <span class="yarn-price">${pricePerMeter} kr/m</span>
        </div>
      </div>
      <div class="yarn-card-tier">
        <span class="tier-badge" style="background: ${t.color}; color: white;">
          ${t.emoji} ${t.label}
        </span>
      </div>
      <div class="yarn-card-actions">
        ${yarn.buyUrl ? `<a href="${yarn.buyUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Køb</a>` : ''}
      </div>
    </article>
  `;
}

function renderYarnBrowser() {
  const html = Object.entries(FIBER_GROUPS).map(([fiberKey, group]) => {
    const yarns = group.yarns.map(yarnId => findYarn(yarnId)).filter(Boolean);

    if (yarns.length === 0) return '';

    return `
      <section class="fiber-section">
        <div class="fiber-header">
          <div class="fiber-emoji">${group.emoji}</div>
          <div class="fiber-info">
            <h2 class="fiber-label">${group.label}</h2>
            <p class="fiber-desc">${group.description}</p>
          </div>
        </div>
        <div class="yarn-grid">
          ${yarns.map(yarn => renderBrowserYarnCard(yarn, yarn.tier)).join('')}
        </div>
      </section>
    `;
  }).join('');

  const container = document.getElementById('yarnBrowserContainer');
  if (container) {
    container.innerHTML = html;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('yarnBrowserContainer');
  if (container) {
    renderYarnBrowser();
  }
});
