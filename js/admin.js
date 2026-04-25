// ─── Admin Dashboard ──────────────────────────────────────────────────────

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;

      if (document.querySelector('#submissions-tab').style.display !== 'none') {
        renderSubmissions();
      } else if (document.querySelector('#reviews-tab').style.display !== 'none') {
        renderReviews();
      }
    });
  });

  // Initial render
  updateStats();
  renderSubmissions();
});

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });

  // Show selected tab
  const selectedTab = document.getElementById(tabName + '-tab');
  if (selectedTab) {
    selectedTab.classList.add('active');
    selectedTab.style.display = 'block';
  }

  // Update nav buttons
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.tab === tabName) btn.classList.add('active');
  });

  // Render tab content
  if (tabName === 'submissions') {
    renderSubmissions();
  } else if (tabName === 'reviews') {
    renderReviews();
  } else if (tabName === 'stats') {
    updateStats();
  } else if (tabName === 'security') {
    // Security tab just needs to show the form, no special rendering needed
  }
}

// ─── Submissions ───────────────────────────────────────────────────────

function renderSubmissions() {
  const submissions = getSubmissions().submissions;
  let filtered = submissions;

  if (currentFilter !== 'all') {
    filtered = submissions.filter(s => s.status === currentFilter);
  }

  const container = document.getElementById('submissionsContainer');

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No submissions yet.</p>';
    return;
  }

  container.innerHTML = filtered.map(sub => `
    <div class="submission-card">
      <div class="submission-header">
        <div>
          <h3>${sub.data.name || sub.data.brand}</h3>
          <p class="submission-type">${sub.type === 'pattern' ? '📝 Pattern' : '🧵 Yarn'}</p>
        </div>
        <span class="submission-status ${sub.status}">${sub.status.toUpperCase()}</span>
      </div>
      <div class="submission-meta">
        <p><strong>From:</strong> ${sub.author} ${sub.email ? `(${sub.email})` : ''}</p>
        <p><strong>Date:</strong> ${sub.submittedDate}</p>
      </div>
      <div class="submission-content">
        ${sub.type === 'pattern' ? `
          <p><strong>Designer:</strong> ${sub.data.designer}</p>
          <p><strong>Difficulty:</strong> ${sub.data.difficulty}</p>
          <p><strong>Meters:</strong> ${sub.data.totalMeters_M}m</p>
          <p><strong>Description:</strong> ${sub.data.description}</p>
        ` : `
          <p><strong>Brand:</strong> ${sub.data.brand}</p>
          <p><strong>Weight:</strong> ${sub.data.weight}</p>
          <p><strong>Meters/50g:</strong> ${sub.data.meters_per_50g}m</p>
          <p><strong>Price:</strong> ${sub.data.price_dkk_50g} kr</p>
          <p><strong>Fiber:</strong> ${sub.data.fiberComposition}</p>
        `}
      </div>
      <div class="submission-actions">
        ${sub.status === 'pending' ? `
          <button class="btn btn-success" onclick="approveAndRender('${sub.id}')">✓ Approve</button>
          <button class="btn btn-danger" onclick="rejectAndRender('${sub.id}')">✕ Reject</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="deleteAndRender('${sub.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function approveAndRender(submissionId) {
  approveSubmission(submissionId);
  renderSubmissions();
  updateStats();
}

function rejectAndRender(submissionId) {
  rejectSubmission(submissionId);
  renderSubmissions();
  updateStats();
}

function deleteAndRender(submissionId) {
  if (confirm('Are you sure? This cannot be undone.')) {
    deleteSubmission(submissionId);
    renderSubmissions();
    updateStats();
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────

function renderReviews() {
  const reviews = getReviews().reviews;
  let filtered = reviews;

  if (currentFilter !== 'all') {
    filtered = reviews.filter(r => r.targetType === currentFilter);
  }

  const container = document.getElementById('reviewsContainer');

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No reviews yet.</p>';
    return;
  }

  container.innerHTML = filtered.map(review => `
    <div class="review-card-admin">
      <div class="review-header-admin">
        <div>
          <h4>${review.targetId} <span class="review-type">${review.targetType}</span></h4>
          <p class="review-author">${review.author}</p>
        </div>
        <div class="review-rating-admin">${renderStars(review.rating)}</div>
      </div>
      <p class="review-comment-admin">"${review.comment}"</p>
      <p class="review-date-admin">${review.createdDate}</p>
      <div class="review-actions-admin">
        ${!review.approved ? `
          <button class="btn btn-sm btn-success" onclick="toggleReviewApproval('${review.id}')">Approve</button>
        ` : `
          <button class="btn btn-sm btn-secondary" onclick="toggleReviewApproval('${review.id}')">Unapprove</button>
        `}
        <button class="btn btn-sm btn-danger" onclick="deleteReview('${review.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function toggleReviewApproval(reviewId) {
  const reviews = getReviews();
  const review = reviews.reviews.find(r => r.id === reviewId);
  if (review) {
    review.approved = !review.approved;
    saveReviews(reviews);
    renderReviews();
    updateStats();
  }
}

function deleteReview(reviewId) {
  if (confirm('Delete this review?')) {
    const reviews = getReviews();
    reviews.reviews = reviews.reviews.filter(r => r.id !== reviewId);
    saveReviews(reviews);
    renderReviews();
    updateStats();
  }
}

// ─── Stats ────────────────────────────────────────────────────────

function updateStats() {
  const reviews = getReviews().reviews;
  const submissions = getSubmissions().submissions;
  const collections = getCollections();

  // Basic counts
  document.getElementById('patternCount').textContent = PATTERNS.length;
  document.getElementById('yarnCount').textContent = YARNS.length;
  document.getElementById('reviewCount').textContent = reviews.filter(r => r.approved).length;
  document.getElementById('submissionCount').textContent = submissions.filter(s => s.status === 'pending').length;

  // Average rating
  const ratings = reviews.filter(r => r.approved).map(r => r.rating);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b) / ratings.length).toFixed(1) : 0;
  document.getElementById('avgRating').textContent = avgRating;

  // Total favorites
  const favorites = collections.favorites || [];
  document.getElementById('favoriteCount').textContent = favorites.length;

  // Recent submissions
  const recent = submissions.slice(-5).reverse();
  const recentContainer = document.getElementById('recentSubmissionsContainer');
  recentContainer.innerHTML = recent.map(sub => `
    <div class="stat-item">
      <span class="stat-item-name">${sub.data.name || sub.data.brand}</span>
      <span class="stat-item-type">${sub.type}</span>
      <span class="stat-item-status ${sub.status}">${sub.status}</span>
    </div>
  `).join('');
}

// ─── Export ───────────────────────────────────────────────────────

function downloadSubmissionsJSON() {
  const submissions = getSubmissions();
  const json = JSON.stringify(submissions, null, 2);
  downloadFile(json, 'submissions.json', 'application/json');
}

function downloadAllDataJSON() {
  const allData = {
    submissions: getSubmissions(),
    reviews: getReviews(),
    collections: getCollections(),
  };
  const json = JSON.stringify(allData, null, 2);
  downloadFile(json, 'garnalternativer-backup.json', 'application/json');
}

function exportApprovedAsDataJs() {
  const submissions = getSubmissions().submissions.filter(s => s.status === 'approved');

  let js = '// Approved community submissions - add to PATTERNS or YARNS array\n\n';

  const patterns = submissions.filter(s => s.type === 'pattern');
  if (patterns.length > 0) {
    js += '// PATTERNS\n';
    patterns.forEach(sub => {
      js += exportPatternAsDataJs(sub) + '\n';
    });
  }

  const yarns = submissions.filter(s => s.type === 'yarn');
  if (yarns.length > 0) {
    js += '\n// YARNS\n';
    yarns.forEach(sub => {
      js += exportYarnAsDataJs(sub) + '\n';
    });
  }

  downloadFile(js, 'approved-submissions.js', 'text/javascript');
}

function clearAllLocalStorage() {
  if (confirm('This will delete all reviews, submissions, collections, and favorites. Are you absolutely sure?')) {
    if (confirm('Last chance - type OK to confirm')) {
      localStorage.clear();
      alert('All localStorage data cleared. Refreshing page...');
      location.reload();
    }
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
