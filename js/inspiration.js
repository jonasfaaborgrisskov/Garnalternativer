// ─── Inspiration / Aesthetic Filtering ─────────────────────────────

function renderInspirations() {
  const html = Object.entries(AESTHETICS).map(([id, aes]) => `
    <div class="aesthetic-card" style="--aesthetic-color: ${aes.color}">
      <div class="aesthetic-emoji">${aes.emoji}</div>
      <h3 class="aesthetic-label">${aes.label}</h3>
      <p class="aesthetic-desc">${aes.description}</p>
      <button class="aesthetic-btn" onclick="filterByAesthetic('${id}')">Udforsk</button>
    </div>
  `).join('');

  const container = document.getElementById('aestheticGrid');
  if (container) {
    container.innerHTML = html;
  }
}

function filterByAesthetic(aestheticId) {
  const aesthetic = AESTHETICS[aestheticId];
  if (!aesthetic || aesthetic.patterns.length === 0) {
    renderPatternGrid([]);
    return;
  }

  const filtered = PATTERNS.filter(p => aesthetic.patterns.includes(p.id));
  renderPatternGrid(filtered);

  // Scroll to patterns
  const patternsSection = document.getElementById('patternSection');
  if (patternsSection) {
    patternsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderInspirations();
});
