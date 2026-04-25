// ─── Budget Calculator & Cost Analysis ────────────────────────────────────

function findPattern(patternId) {
  return PATTERNS.find(p => p.id === patternId);
}

function calculatePatternCost(patternId, yarnId) {
  const pattern = findPattern(patternId);
  const yarn = findYarn(yarnId);

  if (!pattern || !yarn) return { ballsNeeded: 0, totalCost: 0, costPerMeter: 0 };

  const ballsNeeded = Math.ceil(pattern.totalMeters_M / yarn.meters_per_50g);
  const totalCost = ballsNeeded * yarn.price_dkk_50g;
  const costPerMeter = pattern.totalMeters_M > 0 ? (totalCost / pattern.totalMeters_M).toFixed(2) : 0;

  return {
    ballsNeeded,
    totalCost,
    costPerMeter: parseFloat(costPerMeter)
  };
}

function getTierComparison(patternId) {
  const pattern = findPattern(patternId);
  if (!pattern) return null;

  const origCost = calculatePatternCost(patternId, pattern.originalYarn_id);
  const origTotal = origCost.totalCost;

  let budgetCost = origTotal;
  let premiumCost = origTotal;

  if (pattern.tiers.budget && pattern.tiers.budget.length > 0) {
    const budgetCosts = pattern.tiers.budget.map(yid => calculatePatternCost(patternId, yid).totalCost);
    budgetCost = Math.min(...budgetCosts);
  }

  if (pattern.tiers.premium && pattern.tiers.premium.length > 0) {
    const premiumCosts = pattern.tiers.premium.map(yid => calculatePatternCost(patternId, yid).totalCost);
    premiumCost = Math.max(...premiumCosts);
  }

  const savings = origTotal > 0 ? Math.round((origTotal - budgetCost) / origTotal * 100) : 0;
  const premiumUpcharge = origTotal > 0 ? Math.round((premiumCost - origTotal) / origTotal * 100) : 0;

  return {
    budget: budgetCost,
    original: origTotal,
    premium: premiumCost,
    savings,
    premiumUpcharge
  };
}

function filterByBudget(patterns, maxPrice) {
  if (!maxPrice || maxPrice <= 0) return patterns;

  return patterns.filter(p => {
    const cost = calculatePatternCost(p.id, p.originalYarn_id).totalCost;
    return cost <= maxPrice;
  });
}

function sortYarnsByPrice(yarns) {
  return [...yarns].sort((a, b) => {
    const priceA = parseFloat(a.price_dkk_50g) / a.meters_per_50g;
    const priceB = parseFloat(b.price_dkk_50g) / b.meters_per_50g;
    return priceA - priceB;
  });
}

function renderCostBreakdown(pattern, yarnId) {
  const yarn = findYarn(yarnId);
  if (!yarn || !pattern) return '';

  const cost = calculatePatternCost(pattern.id, yarnId);
  const fiberStr = yarn.fiber.map(f => `${f.pct}% ${f.name}`).join(', ');

  return `
    <div class="cost-breakdown">
      <div class="cost-item">
        <span class="cost-label">Nøgler nødvendig:</span>
        <span class="cost-value">${cost.ballsNeeded} × 50g</span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Pris pr. 50g:</span>
        <span class="cost-value">${yarn.price_dkk_50g} kr.</span>
      </div>
      <div class="cost-item cost-total">
        <span class="cost-label">Total projektkost:</span>
        <span class="cost-value"><strong>${cost.totalCost} kr.</strong></span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Pris pr. meter:</span>
        <span class="cost-value">${cost.costPerMeter} kr.</span>
      </div>
      <div class="cost-item">
        <span class="cost-label">Fiber:</span>
        <span class="cost-value">${fiberStr}</span>
      </div>
    </div>
  `;
}

function renderTierComparison(patternId) {
  const comparison = getTierComparison(patternId);
  if (!comparison) return '';

  return `
    <div class="tier-comparison">
      <h4>Prissammenligning</h4>
      <div class="comparison-bars">
        <div class="comparison-item budget">
          <div class="comparison-label">Budget</div>
          <div class="comparison-amount">${comparison.budget} kr.</div>
          <div class="comparison-percent">-${comparison.savings}%</div>
        </div>
        <div class="comparison-item original">
          <div class="comparison-label">Original</div>
          <div class="comparison-amount">${comparison.original} kr.</div>
          <div class="comparison-percent">baseline</div>
        </div>
        <div class="comparison-item premium">
          <div class="comparison-label">Premium</div>
          <div class="comparison-amount">${comparison.premium} kr.</div>
          <div class="comparison-percent">+${comparison.premiumUpcharge}%</div>
        </div>
      </div>
    </div>
  `;
}
