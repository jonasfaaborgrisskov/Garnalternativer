// ─── Reviews & Ratings ─────────────────────────────────────────────────

const REVIEWS_STORAGE_KEY = 'garnalternativer_reviews';

function getReviews() {
  const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : { reviews: [] };
}

function saveReviews(data) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(data));
}

function addReview(targetId, targetType, rating, comment, author = 'Anonym') {
  const reviews = getReviews();
  const review = {
    id: 'review-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    targetId,
    targetType,
    rating: Math.min(5, Math.max(1, parseInt(rating))),
    comment: comment.trim(),
    author: author.trim() || 'Anonym',
    createdDate: new Date().toISOString().split('T')[0],
    approved: true
  };
  reviews.reviews.push(review);
  saveReviews(reviews);
  return review;
}

function getReviewsForTarget(targetId) {
  const reviews = getReviews();
  return reviews.reviews.filter(r => r.targetId === targetId && r.approved);
}

function calculateAverageRating(targetId) {
  const reviews = getReviewsForTarget(targetId);
  if (reviews.length === 0) return { avg: 0, count: 0 };

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = (sum / reviews.length).toFixed(1);
  return { avg: parseFloat(avg), count: reviews.length };
}

function renderStars(rating, size = 'md') {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '⭐'.repeat(full);
  if (half) stars += '✨';
  stars += '☆'.repeat(5 - full - (half ? 1 : 0));
  return stars;
}

function renderReviewForm(targetId, targetType = 'pattern') {
  return `
    <div class="review-form" id="reviewForm-${targetId}">
      <h4>Din anmeldelse</h4>
      <div class="star-picker">
        <label>Vurdering:</label>
        <div class="stars" id="starPicker-${targetId}">
          ${[1, 2, 3, 4, 5].map(n => `
            <button class="star" data-rating="${n}" onclick="event.preventDefault(); selectStar(${n}, '${targetId}')">
              ⭐
            </button>
          `).join('')}
        </div>
        <span class="selected-rating" id="selectedRating-${targetId}">Vælg stjerner</span>
      </div>
      <textarea class="review-textarea" id="reviewComment-${targetId}" placeholder="Dine tanker om dette mønster..." maxlength="500"></textarea>
      <input type="text" class="review-author" id="reviewAuthor-${targetId}" placeholder="Dit navn (valgfrit)" maxlength="50">
      <button class="btn btn-primary" onclick="submitReview('${targetId}', '${targetType}')">Indsend anmeldelse</button>
    </div>
  `;
}

function selectStar(rating, targetId) {
  const form = document.getElementById(`reviewForm-${targetId}`);
  if (form) {
    const stars = form.querySelectorAll('.star');
    stars.forEach((s, i) => {
      s.classList.toggle('active', i < rating);
    });
    const ratingSpan = document.getElementById(`selectedRating-${targetId}`);
    if (ratingSpan) {
      ratingSpan.textContent = renderStars(rating) + ` (${rating}/5)`;
    }
    form.dataset.rating = rating;
  }
}

function submitReview(targetId, targetType) {
  const form = document.getElementById(`reviewForm-${targetId}`);
  if (!form) return;

  const rating = parseInt(form.dataset.rating || 0);
  const comment = document.getElementById(`reviewComment-${targetId}`).value;
  const author = document.getElementById(`reviewAuthor-${targetId}`).value;

  if (rating === 0) {
    alert('Vælg venligst en vurdering');
    return;
  }
  if (comment.trim().length < 5) {
    alert('Skrive venligst mindst 5 tegn');
    return;
  }

  addReview(targetId, targetType, rating, comment, author);
  form.remove();
  renderReviewsSection(targetId);
}

function renderReviewsSection(targetId) {
  const { avg, count } = calculateAverageRating(targetId);
  const reviews = getReviewsForTarget(targetId);

  let html = `
    <section class="reviews-section">
      <div class="reviews-header">
        <h3>Kunders vurderinger</h3>
        ${count > 0 ? `
          <div class="rating-summary">
            <span class="rating-avg">${renderStars(avg)} ${avg}/5</span>
            <span class="rating-count">(${count} ${count === 1 ? 'anmeldelse' : 'anmeldelser'})</span>
          </div>
        ` : '<p class="no-reviews">Ingen anmeldelser endnu</p>'}
      </div>
  `;

  if (reviews.length > 0) {
    html += '<div class="reviews-list">';
    reviews.slice(0, 5).forEach(review => {
      html += `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">${review.author}</span>
            <span class="review-date">${review.createdDate}</span>
          </div>
          <div class="review-rating">${renderStars(review.rating)}</div>
          <p class="review-comment">${escapeHtml(review.comment)}</p>
        </div>
      `;
    });
    html += '</div>';
    if (reviews.length > 5) {
      html += `<button class="btn btn-secondary" onclick="expandReviews('${targetId}')">Se alle ${reviews.length} anmeldelser</button>`;
    }
  }

  html += renderReviewForm(targetId);
  html += '</section>';

  const section = document.getElementById(`reviewsSection-${targetId}`);
  if (section) {
    section.innerHTML = html;
  }
}

function expandReviews(targetId) {
  const reviews = getReviewsForTarget(targetId);
  let html = '<div class="reviews-expanded">';
  reviews.forEach(review => {
    html += `
      <div class="review-card">
        <div class="review-header">
          <span class="review-author">${review.author}</span>
          <span class="review-date">${review.createdDate}</span>
        </div>
        <div class="review-rating">${renderStars(review.rating)}</div>
        <p class="review-comment">${escapeHtml(review.comment)}</p>
      </div>
    `;
  });
  html += '</div>';

  const section = document.getElementById(`reviewsSection-${targetId}`);
  if (section) {
    section.innerHTML = html;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
