// ─── Filter System ────────────────────────────────────────────────

/**
 * Default filter state
 */
function getDefaultFilters() {
  return {
    weight: null,              // null or 'sport', 'DK', 'worsted', etc.
    fiber: [],                 // array of fiber names
    difficulty: [],            // array of 'Begynder', 'Intermediate', 'Advanced'
    ecoOnly: false,            // boolean
    seasonality: null,         // null or 'spring', 'summer', 'fall', 'winter'
    searchQuery: '',           // text search
  };
}

/**
 * Apply all active filters to PATTERNS array
 * @param {Array} patterns - PATTERNS array
 * @param {Object} filterState - current filter state
 * @returns {Array} filtered patterns
 */
function applyFilters(patterns, filterState) {
  return patterns.filter(pattern => {
    const yarn = findYarn(pattern.originalYarn_id);

    // Weight filter
    if (filterState.weight && yarn.weight !== filterState.weight) {
      return false;
    }

    // Fiber filter - pattern must have at least one matching fiber
    if (filterState.fiber.length > 0) {
      const patternFibers = pattern.materials || [];
      const hasMatchingFiber = filterState.fiber.some(fib =>
        patternFibers.some(pf => pf.toLowerCase().includes(fib.toLowerCase()))
      );
      if (!hasMatchingFiber) return false;
    }

    // Difficulty filter
    if (filterState.difficulty.length > 0) {
      if (!filterState.difficulty.includes(pattern.difficulty)) {
        return false;
      }
    }

    // Eco-only filter
    if (filterState.ecoOnly && !yarn.eco) {
      return false;
    }

    // Seasonality filter
    if (filterState.seasonality) {
      const patternSeasons = pattern.seasonality || [];
      if (!patternSeasons.includes(filterState.seasonality)) {
        return false;
      }
    }

    // Text search - search name, designer, type, tags, materials
    if (filterState.searchQuery) {
      const q = filterState.searchQuery.toLowerCase();
      const searchableText = [
        pattern.name,
        pattern.designer,
        pattern.type,
        pattern.description,
        ...(pattern.tags || []),
        ...(pattern.materials || []),
      ].join(' ').toLowerCase();

      if (!searchableText.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get unique values for a given filter from PATTERNS
 */
function getFilterOptions() {
  const weights = new Set();
  const fibers = new Set();
  const difficulties = new Set();
  const seasons = new Set();

  PATTERNS.forEach(pattern => {
    const yarn = findYarn(pattern.originalYarn_id);

    if (yarn.weight) weights.add(yarn.weight);
    if (pattern.difficulty) difficulties.add(pattern.difficulty);

    (pattern.materials || []).forEach(m => fibers.add(m));
    (pattern.seasonality || []).forEach(s => seasons.add(s));
  });

  return {
    weights: Array.from(weights).sort(),
    fibers: Array.from(fibers).sort(),
    difficulties: Array.from(difficulties).sort(),
    seasons: Array.from(seasons).sort(),
  };
}

/**
 * Format filter value for display
 */
function formatFilterLabel(value, type) {
  const labels = {
    'Begynder': 'Begynder',
    'Intermediate': 'Intermediate',
    'Advanced': 'Advanced',
    'sport': 'Sport',
    'DK': 'DK',
    'worsted': 'Worsted',
    'bulky': 'Bulky',
    'spring': '🌸 Forår',
    'summer': '☀️ Sommer',
    'fall': '🍂 Efterår',
    'winter': '❄️ Vinter',
  };

  return labels[value] || value;
}
