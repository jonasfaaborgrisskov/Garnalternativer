// ─── Yarn Browser ──────────────────────────────────────────────────

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
          ${yarns.map(yarn => renderYarnCard(yarn, null, null, yarn.tier)).join('')}
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
