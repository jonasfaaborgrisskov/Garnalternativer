// ─── Yarn Browser ──────────────────────────────────────────────────

function findYarn(id) {
  return YARNS.find(y => y.id === id);
}

function renderBrowserYarnCard(yarn) {
  const w = WEIGHTS[yarn.weight];
  const isFav = (typeof isFavorited === 'function') ? isFavorited(yarn.id) : false;
  const pricePerMeter = (yarn.price_dkk_50g / yarn.meters_per_50g).toFixed(2);
  const fiberStr = yarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');

  const ecoBadges = [
    yarn.eco          ? '<span class="bc-badge bc-badge--eco">🌿 Øko</span>'          : '',
    yarn.vegan        ? '<span class="bc-badge bc-badge--eco">🌱 Vegansk</span>'        : '',
    yarn.mulesing_free? '<span class="bc-badge bc-badge--eco">♻️ Mulesing-frit</span>' : '',
  ].filter(Boolean).join('');

  return `
    <article class="bc-yarn-card" data-yarn-id="${yarn.id}">

      <div class="bc-yarn-top">
        <div class="bc-yarn-identity">
          <h3 class="bc-yarn-name">${yarn.name}</h3>
          <p class="bc-yarn-brand">${yarn.brand}</p>
        </div>
        <div class="bc-yarn-price-block">
          <span class="bc-price-main">${yarn.price_dkk_50g} kr</span>
          <span class="bc-price-sub">${pricePerMeter} kr/m</span>
        </div>
      </div>

      <p class="bc-yarn-fiber">${fiberStr}</p>

      <div class="bc-yarn-specs">
        <div class="bc-spec">
          <span class="bc-spec-label">Vægt</span>
          <span class="bc-spec-value">${w ? w.label : yarn.weight}</span>
        </div>
        <div class="bc-spec">
          <span class="bc-spec-label">Masker/10 cm</span>
          <span class="bc-spec-value">${yarn.gauge.stitches}</span>
        </div>
        <div class="bc-spec">
          <span class="bc-spec-label">Pind</span>
          <span class="bc-spec-value">${yarn.gauge.needle_mm} mm</span>
        </div>
        <div class="bc-spec">
          <span class="bc-spec-label">Meter/50g</span>
          <span class="bc-spec-value">${yarn.meters_per_50g} m</span>
        </div>
      </div>

      ${ecoBadges ? `<div class="bc-yarn-badges">${ecoBadges}</div>` : ''}

      <div class="bc-yarn-footer">
        ${typeof isFavorited === 'function' ? `
          <button class="bc-fav-btn ${isFav ? 'bc-fav-btn--active' : ''}"
            onclick="event.stopPropagation(); toggleFavorite('${yarn.id}'); location.reload();"
            aria-label="${isFav ? 'Fjern fra favoritter' : 'Gem som favorit'}">
            ${isFav ? '❤️' : '🤍'}
          </button>` : '<span></span>'}
        ${yarn.buyUrl
          ? `<a href="${yarn.buyUrl}" target="_blank" rel="noopener noreferrer" class="bc-buy-btn">Køb →</a>`
          : ''}
      </div>

    </article>
  `;
}

// renderYarnBrowser and init are handled by yarn-browser-controls.js
