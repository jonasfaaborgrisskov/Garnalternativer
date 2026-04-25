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
  const idx = collections.favorites.indexOf(patternId);
  if (idx > -1) {
    collections.favorites.splice(idx, 1);
  } else {
    collections.favorites.push(patternId);
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
  return collections.favorites.includes(patternId);
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
