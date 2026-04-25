// ─── Admin Authentication ────────────────────────────────────────
// Default password: "garn2026"
// Change this to something unique before deploying!

const ADMIN_PASSWORD = 'garn2026';  // Change this to a unique password
const ADMIN_SESSION_KEY = 'garnalternativer_admin_session';
const ADMIN_SESSION_TIMEOUT = 8 * 60 * 60 * 1000;  // 8 hours

function isAdminAuthenticated() {
  const session = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!session) return false;

  try {
    const data = JSON.parse(session);
    const now = Date.now();

    // Check if session expired
    if (now - data.timestamp > ADMIN_SESSION_TIMEOUT) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }

    return data.authenticated === true;
  } catch (e) {
    return false;
  }
}

function handleAdminLogin(event) {
  event.preventDefault();

  const passwordInput = document.getElementById('adminPassword');
  const password = passwordInput.value;
  const errorDiv = document.getElementById('loginError');

  // Simple password comparison
  if (password === ADMIN_PASSWORD) {
    // Store session
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
      authenticated: true,
      timestamp: Date.now()
    }));

    // Hide login screen, show admin panel
    showAdminPanel();
  } else {
    errorDiv.textContent = '❌ Forkert password';
    errorDiv.style.display = 'block';
    passwordInput.value = '';
    passwordInput.focus();
  }
}

function showAdminPanel() {
  document.getElementById('adminLoginScreen').style.display = 'none';
  document.querySelector('.admin-container').style.display = 'flex';
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById('adminLoginScreen').style.display = 'flex';
  document.querySelector('.admin-container').style.display = 'none';
  document.getElementById('adminPassword').value = '';
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  if (isAdminAuthenticated()) {
    showAdminPanel();
  } else {
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.querySelector('.admin-container').style.display = 'none';
  }
});
