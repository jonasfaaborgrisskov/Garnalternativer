// ─── Collections (localStorage) ────────────────────────────────────

const COLLECTIONS_STORAGE_KEY = 'garnalternativer_collections';

function getCollections() {
  const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
  if (!stored) {
    return {
      favorites: [],
      myPatterns: [],
    };
  }
  return JSON.parse(stored);
}

function saveCollections(collections) {
  localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
}

function toggleFavorite(patternId) {
  const collections = getCollections();
  const pattern = PATTERNS.find(p => p.id === patternId);

  // Check if already saved
  const existingIdx = collections.myPatterns.findIndex(p => p.patternId === patternId);

  if (existingIdx > -1) {
    // Remove from saved
    collections.myPatterns.splice(existingIdx, 1);
  } else {
    // Add to saved (with first available yarn option or original yarn)
    const originalYarnId = pattern ? pattern.originalYarn_id : null;
    collections.myPatterns.push({
      patternId,
      selectedYarn: originalYarnId,
      tier: 'mid',
      addedDate: new Date().toISOString(),
    });
  }

  saveCollections(collections);
  updateFavoriteButtons();
}

function savePattern(patternId, yarnId, tier) {
  const collections = getCollections();
  // Remove if already exists
  collections.myPatterns = collections.myPatterns.filter(p => !(p.patternId === patternId && p.selectedYarn === yarnId));
  // Add new
  collections.myPatterns.push({
    patternId,
    selectedYarn: yarnId,
    tier,
    addedDate: new Date().toISOString(),
  });
  saveCollections(collections);
}

function isFavorited(patternId) {
  const collections = getCollections();
  return collections.myPatterns.some(p => p.patternId === patternId);
}

function getSavedPatterns() {
  return getCollections().myPatterns;
}

function updateFavoriteButtons() {
  document.querySelectorAll('[data-pattern-id]').forEach(el => {
    const patternId = el.dataset.patternId;
    const isFav = isFavorited(patternId);
    const btn = el.querySelector('.favorite-btn');
    if (btn) {
      btn.classList.toggle('favorited', isFav);
      btn.textContent = isFav ? '❤️' : '🤍';
    }
  });
}

document.addEventListener('DOMContentLoaded', updateFavoriteButtons);
