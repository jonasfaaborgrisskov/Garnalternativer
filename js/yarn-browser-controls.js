// ─── Yarn Browser Search & Filter ────────────────────────────────────────

// Maps checkbox values (English) to Danish fiber names used in data.js
const FIBER_NAME_MAP = {
  'Wool':      ['uld', 'wool'],
  'Cotton':    ['bomuld', 'cotton', 'merceriseret bomuld'],
  'Silk':      ['silke', 'silk'],
  'Alpaca':    ['alpaka', 'alpaca'],
  'Acrylic':   ['akryl', 'acrylic'],
  'Merino':    ['merino'],
  'Nylon':     ['nylon'],
  'Mohair':    ['mohair'],
  'Cashmere':  ['cashmere', 'kashmir'],
  'Linen':     ['hør', 'linen', 'lin'],
  'Lambswool': ['lammeuld', 'lambswool'],
  'Shetland':  ['shetland'],
  'Falkland':  ['falkland'],
  'Gotland':   ['gotland', 'pelsuld'],
  'Iceland':   ['islandsk uld', 'islandsk'],
  'Yak':       ['yak'],
  'BabyLama':  ['baby lama', 'babylama'],
};

let yarnBrowserState = {
  searchQuery: '',
  sortBy: 'name',
  filterWeight: '',
  filterFiber: [],
  filterEco: false,
  filterMaxPrice: null,
  filterTier: '',
};

function buildFiberFilters() {
  const container = document.getElementById('yarnFiberFilters');
  if (!container) return;

  // Collect which canonical fiber keys actually appear in YARNS
  const present = new Set();
  YARNS.forEach(yarn => {
    if (!yarn.fiber) return;
    yarn.fiber.forEach(yf => {
      if (!yf || !yf.name) return;
      const name = yf.name.toLowerCase();
      Object.entries(FIBER_NAME_MAP).forEach(([key, aliases]) => {
        if (aliases.some(alias => name.includes(alias) || alias.includes(name))) {
          present.add(key);
        }
      });
    });
  });

  // Label map for display
  const labels = {
    Wool:       'Uld',
    Merino:     'Merino',
    Lambswool:  'Lammeuld',
    Shetland:   'Shetlandsuld',
    Falkland:   'Falklandsuld',
    Gotland:    'Gotlandsk uld',
    Iceland:    'Islandsk uld',
    Yak:        'Yak',
    BabyLama:   'Baby lama',
    Alpaca:     'Alpaka',
    Cotton:     'Bomuld',
    Silk:       'Silke',
    Mohair:     'Mohair',
    Cashmere:   'Cashmere',
    Nylon:      'Nylon',
    Acrylic:    'Akryl',
    Linen:      'Hør',
  };

  // Render only fibers that exist, in a fixed order
  const order = ['Merino','Wool','Lambswool','Shetland','Falkland','Gotland','Iceland','Yak','BabyLama','Alpaca','Mohair','Cashmere','Cotton','Silk','Linen','Nylon','Acrylic'];
  order.filter(k => present.has(k)).forEach(key => {
    const label = document.createElement('label');
    label.className = 'fiber-filter-checkbox';
    label.innerHTML = `<input type="checkbox" class="yarn-fiber-checkbox" value="${key}" />${labels[key] || key}`;
    container.appendChild(label);
    label.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) {
        if (!yarnBrowserState.filterFiber.includes(key)) yarnBrowserState.filterFiber.push(key);
      } else {
        yarnBrowserState.filterFiber = yarnBrowserState.filterFiber.filter(f => f !== key);
      }
      renderYarnBrowser();
    });
  });
}

function initYarnBrowserControls() {
  buildFiberFilters();

  const searchInput  = document.getElementById('yarnSearchInput');
  const sortSelect   = document.getElementById('yarnSortSelect');
  const weightSelect = document.getElementById('yarnFilterWeight');
  const ecoCheckbox  = document.getElementById('yarnFilterEco');
  const priceInput   = document.getElementById('yarnFilterPrice');
  const tierSelect   = document.getElementById('yarnFilterTier');
  const resetBtn     = document.getElementById('yarnResetFilters');

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      yarnBrowserState.searchQuery = e.target.value.trim().toLowerCase();
      renderYarnBrowser();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      yarnBrowserState.sortBy = e.target.value;
      renderYarnBrowser();
    });
  }
  if (weightSelect) {
    weightSelect.addEventListener('change', e => {
      yarnBrowserState.filterWeight = e.target.value || '';
      renderYarnBrowser();
    });
  }
  if (ecoCheckbox) {
    ecoCheckbox.addEventListener('change', e => {
      yarnBrowserState.filterEco = e.target.checked;
      renderYarnBrowser();
    });
  }
  if (priceInput) {
    priceInput.addEventListener('input', e => {
      const v = parseFloat(e.target.value);
      yarnBrowserState.filterMaxPrice = isNaN(v) ? null : v;
      renderYarnBrowser();
    });
  }
  if (tierSelect) {
    tierSelect.addEventListener('change', e => {
      yarnBrowserState.filterTier = e.target.value || '';
      renderYarnBrowser();
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      yarnBrowserState = { searchQuery: '', sortBy: 'name', filterWeight: '', filterFiber: [], filterEco: false, filterMaxPrice: null, filterTier: '' };
      if (searchInput)  searchInput.value  = '';
      if (sortSelect)   sortSelect.value   = 'name';
      if (weightSelect) weightSelect.value = '';
      if (ecoCheckbox)  ecoCheckbox.checked = false;
      if (priceInput)   priceInput.value   = '';
      if (tierSelect)   tierSelect.value   = '';
      document.querySelectorAll('#yarnFiberFilters .yarn-fiber-checkbox').forEach(cb => cb.checked = false);
      renderYarnBrowser();
    });
  }
}

function yarnMatchesFiberFilter(yarn, selectedFibers) {
  if (selectedFibers.length === 0) return true;
  if (!yarn.fiber || !Array.isArray(yarn.fiber) || yarn.fiber.length === 0) return false;
  return selectedFibers.some(selected => {
    const aliases = FIBER_NAME_MAP[selected] || [selected.toLowerCase()];
    return yarn.fiber.some(yf => {
      if (!yf || !yf.name) return false;
      const name = yf.name.toLowerCase();
      return aliases.some(alias => name.includes(alias) || alias.includes(name));
    });
  });
}

function filterAndSortAllYarns() {
  let filtered = [...YARNS];

  if (yarnBrowserState.searchQuery) {
    const q = yarnBrowserState.searchQuery;
    filtered = filtered.filter(y =>
      y.name.toLowerCase().includes(q) ||
      y.brand.toLowerCase().includes(q) ||
      y.fiber.some(f => f.name.toLowerCase().includes(q))
    );
  }
  if (yarnBrowserState.filterWeight) {
    filtered = filtered.filter(y => y.weight === yarnBrowserState.filterWeight);
  }
  if (yarnBrowserState.filterFiber.length > 0) {
    filtered = filtered.filter(y => yarnMatchesFiberFilter(y, yarnBrowserState.filterFiber));
  }
  if (yarnBrowserState.filterEco) {
    filtered = filtered.filter(y => y.eco === true);
  }
  if (yarnBrowserState.filterMaxPrice != null) {
    filtered = filtered.filter(y => y.price_dkk_50g <= yarnBrowserState.filterMaxPrice);
  }
  if (yarnBrowserState.filterTier) {
    filtered = filtered.filter(y => y.tier === yarnBrowserState.filterTier);
  }

  const weightOrder = { lace: 0, fingering: 1, sport: 2, DK: 3, worsted: 4, bulky: 5, superbulky: 6 };
  filtered.sort((a, b) => {
    switch (yarnBrowserState.sortBy) {
      case 'price':      return a.price_dkk_50g - b.price_dkk_50g;
      case 'price-desc': return b.price_dkk_50g - a.price_dkk_50g;
      case 'weight':     return (weightOrder[a.weight] || 99) - (weightOrder[b.weight] || 99);
      default:           return a.name.localeCompare(b.name, 'da');
    }
  });
  return filtered;
}

function renderYarnBrowser() {
  const container   = document.getElementById('yarnBrowserContainer');
  const countEl     = document.getElementById('yarnResultCount');
  if (!container) return;

  const yarns = filterAndSortAllYarns();

  if (countEl) {
    countEl.textContent = `${yarns.length} garn ud af ${YARNS.length} i alt`;
  }

  if (yarns.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--ink-3);">
        <p style="font-size:1.1rem;">Ingen garn matcher dine filtre.</p>
        <p style="font-size:0.9rem; margin-top:0.5rem;">Prøv at nulstille filteret.</p>
      </div>`;
    return;
  }

  // Group by weight
  const byWeight = {};
  const weightLabels = {
    lace:       'Lace / 0-ply',
    fingering:  'Fingering / 2-ply',
    sport:      'Sport / 4-ply',
    DK:         'DK / Double Knit',
    worsted:    'Worsted / Aran',
    bulky:      'Bulky / Chunky',
    superbulky: 'Super Bulky',
  };

  yarns.forEach(yarn => {
    const w = yarn.weight || 'other';
    if (!byWeight[w]) byWeight[w] = [];
    byWeight[w].push(yarn);
  });

  const weightOrder = ['lace', 'fingering', 'sport', 'DK', 'worsted', 'bulky', 'superbulky'];
  const keys = [...weightOrder.filter(k => byWeight[k]), ...Object.keys(byWeight).filter(k => !weightOrder.includes(k))];

  container.innerHTML = keys.map(weight => {
    const group = byWeight[weight];
    const label = weightLabels[weight] || weight;
    return `
      <section class="fiber-section">
        <div class="fiber-header">
          <div class="fiber-info">
            <h2 class="fiber-label">${label}</h2>
            <span class="fiber-count">${group.length} garn</span>
          </div>
        </div>
        <div class="yarn-grid">
          ${group.map(yarn => renderBrowserYarnCard(yarn, yarn.tier)).join('')}
        </div>
      </section>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const totalEl = document.getElementById('yarnTotalCount');
  if (totalEl) totalEl.textContent = `${YARNS.length} garn i databasen`;
  initYarnBrowserControls();
  renderYarnBrowser();
});
