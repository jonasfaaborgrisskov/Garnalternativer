// ─── Instagram Gallery ─────────────────────────────────────────────

function renderInstagramGallery() {
  if (!INSTAGRAM_FEATURES || INSTAGRAM_FEATURES.length === 0) {
    return; // Don't render if no features
  }

  const html = INSTAGRAM_FEATURES.map(post => {
    const pattern = PATTERNS.find(p => p.id === post.patternId);
    const yarn = pattern ? findYarn(pattern.originalYarn_id) : null;

    return `
      <div class="ig-post">
        <div class="ig-header">
          <span class="ig-emoji">${pattern ? pattern.emoji : '🧶'}</span>
          <div class="ig-info">
            <p class="ig-pattern">${pattern ? pattern.name : 'Pattern'}</p>
            <p class="ig-designer">${pattern ? pattern.designer : ''}</p>
          </div>
        </div>
        <p class="ig-caption">"${post.caption}"</p>
        <a href="${post.instagramUrl}" class="ig-link" target="_blank" rel="noopener noreferrer">
          Se på Instagram →
        </a>
      </div>
    `;
  }).join('');

  const container = document.getElementById('igGallery');
  if (container) {
    container.innerHTML = html;
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  renderInstagramGallery();
});
