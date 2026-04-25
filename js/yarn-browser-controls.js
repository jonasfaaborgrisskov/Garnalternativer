// ─── Yarn Browser Search & Filter ────────────────────────────────────────

let yarnBrowserState = {
  searchQuery: '',
  sortBy: 'name',  // name, price, weight
  filterWeight: '',
  filterFiber: [],
  filterEco: false
};

function initYarnBrowserControls() {
  // Search input
  const searchInput = document.getElementById('yarnSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      yarnBrowserState.searchQuery = e.target.value.trim().toLowerCase();
      renderYarnBrowser();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('yarnSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      yarnBrowserState.sortBy = e.target.value;
      renderYarnBrowser();
    });
  }

  // Weight filter
  const weightSelect = document.getElementById('yarnFilterWeight');
  if (weightSelect) {
    weightSelect.addEventListener('change', e => {
      yarnBrowserState.filterWeight = e.target.value || '';
      renderYarnBrowser();
    });
  }

  // Eco filter
  const ecoCheckbox = document.getElementById('yarnFilterEco');
  if (ecoCheckbox) {
    ecoCheckbox.addEventListener('change', e => {
      yarnBrowserState.filterEco = e.target.checked;
      renderYarnBrowser();
    });
  }

  // Fiber checkboxes
  document.querySelectorAll('.yarn-fiber-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const fiber = e.target.value;
      if (e.target.checked) {
        if (!yarnBrowserState.filterFiber.includes(fiber)) {
          yarnBrowserState.filterFiber.push(fiber);
        }
      } else {
        yarnBrowserState.filterFiber = yarnBrowserState.filterFiber.filter(f => f !== fiber);
      }
      renderYarnBrowser();
    });
  });

  // Reset button
  const resetBtn = document.getElementById('yarnResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      yarnBrowserState = {
        searchQuery: '',
        sortBy: 'name',
        filterWeight: '',
        filterFiber: [],
        filterEco: false
      };
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'name';
      if (weightSelect) weightSelect.value = '';
      if (ecoCheckbox) ecoCheckbox.checked = false;
      document.querySelectorAll('.yarn-fiber-checkbox').forEach(cb => cb.checked = false);
      renderYarnBrowser();
    });
  }
}

function filterAndSortYarns(yarns) {
  let filtered = [...yarns];

  // Search filter
  if (yarnBrowserState.searchQuery) {
    const query = yarnBrowserState.searchQuery;
    filtered = filtered.filter(y =>
      y.name.toLowerCase().includes(query) ||
      y.brand.toLowerCase().includes(query) ||
      y.fiber.some(f => f.name.toLowerCase().includes(query))
    );
  }

  // Weight filter
  if (yarnBrowserState.filterWeight) {
    filtered = filtered.filter(y => y.weight === yarnBrowserState.filterWeight);
  }

  // Fiber filter
  if (yarnBrowserState.filterFiber.length > 0) {
    filtered = filtered.filter(y =>
      yarnBrowserState.filterFiber.some(selectedFiber =>
        y.fiber.some(yf => yf.name.toLowerCase() === selectedFiber.toLowerCase())
      )
    );
  }

  // Eco filter
  if (yarnBrowserState.filterEco) {
    filtered = filtered.filter(y => y.eco === true);
  }

  // Sort
  filtered.sort((a, b) => {
    switch (yarnBrowserState.sortBy) {
      case 'price':
        return a.price_dkk_50g - b.price_dkk_50g;
      case 'price-desc':
        return b.price_dkk_50g - a.price_dkk_50g;
      case 'weight':
        const weightOrder = { 'fingering': 1, 'sport': 2, 'DK': 3, 'worsted': 4, 'bulky': 5 };
        return (weightOrder[a.weight] || 999) - (weightOrder[b.weight] || 999);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return filtered;
}

function renderYarnBrowserEnhanced() {
  const html = Object.entries(FIBER_GROUPS).map(([fiberKey, group]) => {
    let yarns = group.yarns.map(yarnId => findYarn(yarnId)).filter(Boolean);
    yarns = filterAndSortYarns(yarns);

    if (yarns.length === 0) return '';

    const cards = yarns.map(yarn => renderBrowserYarnCard(yarn, yarn.tier)).join('');

    return `
      <section class="fiber-section">
        <div class="fiber-header">
          <div class="fiber-emoji">${group.emoji}</div>
          <div class="fiber-info">
            <h2 class="fiber-label">${group.label}</h2>
            <p class="fiber-desc">${group.description}</p>
            <span class="fiber-count">${yarns.length} garn</span>
          </div>
        </div>
        <div class="yarn-grid">
          ${cards}
        </div>
      </section>
    `;
  }).join('');

  const container = document.getElementById('yarnBrowserContainer');
  if (container) {
    container.innerHTML = html;
  }
}

// Override the original renderYarnBrowser
const originalRenderYarnBrowser = typeof renderYarnBrowser === 'function' ? renderYarnBrowser : null;

function renderYarnBrowser() {
  renderYarnBrowserEnhanced();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initYarnBrowserControls();
  if (typeof renderYarnBrowser === 'function') {
    renderYarnBrowser();
  }
});
