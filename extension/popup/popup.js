// ── WishFlow Extension Popup Script ────────────────────────────────────────────
// Handles auth state, scrapes the active tab via content script,
// and saves items directly to Supabase.

import { signIn, signUp, refreshSession, getCategories, addItem } from '../supabase.js';

// ── DOM refs ────────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

const screenLogin = $('screen-login');
const screenSignup = $('screen-signup');
const screenVerify = $('screen-verify');
const screenMain = $('screen-main');
const screenSuccess = $('screen-success');

const formLogin = $('form-login');
const formSignup = $('form-signup');
const formSave = $('form-save');

const inpEmail = $('inp-email');
const inpPassword = $('inp-password');
const btnLogin = $('btn-login');
const loginError = $('login-error');

const inpName = $('inp-name');
const inpSignupEmail = $('inp-signup-email');
const inpSignupPass = $('inp-signup-password');
const btnSignup = $('btn-signup');
const signupError = $('signup-error');

const btnLogout = $('btn-logout');
const btnTogglePass = $('btn-toggle-pass');

const productLoading = $('product-loading');
const productInfo = $('product-info');
const productError = $('product-error');
const productImg = $('product-img');
const productTitle = $('product-title');
const productPrice = $('product-price');
const productUrl = $('product-url');

const inpTitle = $('inp-title');
const inpPrice = $('inp-price');
const selCategory = $('sel-category');
const btnSave = $('btn-save');
const saveError = $('save-error');

const btnSaveAnother = $('btn-save-another');

// ── Session helpers ─────────────────────────────────────────────────────────────

async function getSession() {
  return new Promise(resolve => {
    chrome.storage.local.get(['wf_session'], result => resolve(result.wf_session || null));
  });
}

async function saveSession(session) {
  return new Promise(resolve => {
    chrome.storage.local.set({ wf_session: session }, resolve);
  });
}

async function clearSession() {
  return new Promise(resolve => {
    chrome.storage.local.remove(['wf_session'], resolve);
  });
}

// Validate session and auto-refresh if expired
async function getValidToken() {
  const session = await getSession();
  if (!session) return null;

  const { access_token, refresh_token, expires_at } = session;
  const nowSec = Math.floor(Date.now() / 1000);

  // Token still valid (with 60s buffer)
  if (access_token && expires_at && nowSec < expires_at - 60) {
    return access_token;
  }

  // Try to refresh
  if (refresh_token) {
    try {
      const refreshed = await refreshSession(refresh_token);
      if (refreshed?.access_token) {
        const newSession = {
          ...session,
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || refresh_token,
          expires_at: nowSec + (refreshed.expires_in || 3600),
        };
        await saveSession(newSession);
        return newSession.access_token;
      }
    } catch { /* fall through to logout */ }
  }

  // Refresh failed — clear session, show login
  await clearSession();
  return null;
}

// ── UI helpers ──────────────────────────────────────────────────────────────────

function showScreen(name) {
  screenLogin.style.display = name === 'login' ? 'block' : 'none';
  screenSignup.style.display = name === 'signup' ? 'block' : 'none';
  screenVerify.style.display = name === 'verify' ? 'block' : 'none';
  screenMain.style.display = name === 'main' ? 'block' : 'none';
  screenSuccess.style.display = name === 'success' ? 'block' : 'none';
  btnLogout.style.display = name === 'main' ? 'flex' : 'none';
}

function setLoading(btn, loading) {
  const label = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled = loading;
  if (label) label.style.display = loading ? 'none' : 'inline';
  if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(el) {
  el.style.display = 'none';
}

function formatPrice(price, currency = 'INR') {
  if (!price && price !== 0) return '';
  const symbol = currency === 'INR' ? '₹' : (currency === 'USD' ? '$' : currency + ' ');
  return symbol + Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

// ── Populate dropdowns ──────────────────────────────────────────────────────────

async function loadDropdowns(token, session) {
  const userId = session.user.id;

  const cats = await getCategories(token, userId).catch(() => []);

  // Categories
  selCategory.innerHTML = '<option value="-1">Select category…</option>';
  (cats || []).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    selCategory.appendChild(opt);
  });
}

// ── Product data from content script ───────────────────────────────────────────

async function fetchProductData() {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0];
      if (!tab?.id) return resolve(null);

      // First try messaging the already-injected content script
      chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_DATA' }, response => {
        if (chrome.runtime.lastError) {
          // Content script not yet injected (e.g., extension just installed) — inject it now
          chrome.scripting.executeScript(
            { target: { tabId: tab.id }, files: ['content/content.js'] },
            () => {
              if (chrome.runtime.lastError) return resolve(null);
              setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_DATA' }, r => {
                  if (chrome.runtime.lastError) return resolve(null);
                  resolve(r?.success ? r.data : null);
                });
              }, 200);
            }
          );
        } else {
          resolve(response?.success ? response.data : null);
        }
      });
    });
  });
}

// ── Main init ───────────────────────────────────────────────────────────────────

async function init() {
  const token = await getValidToken();
  const session = await getSession();

  if (!token || !session) {
    showScreen('login');
    return;
  }

  showScreen('main');
  loadMainScreen(token, session);
}

async function loadMainScreen(token, session) {
  // Load dropdowns and product data in parallel
  const [, productData] = await Promise.all([
    loadDropdowns(token, session),
    fetchProductData(),
  ]);

  // Show product card
  productLoading.style.display = 'none';

  if (productData && (productData.title || productData.image)) {
    productInfo.style.display = 'flex';

    if (productData.image) {
      productImg.src = productData.image;
      productImg.onerror = () => {
        productImg.parentElement.innerHTML = '<span style="font-size:28px;">🛍️</span>';
      };
    } else {
      productImg.parentElement.innerHTML = '<span style="font-size:28px;">🛍️</span>';
    }

    productTitle.textContent = productData.title || '';
    productPrice.textContent = formatPrice(productData.price);
    productUrl.textContent = getDomain(productData.url);

    // Pre-fill the form
    inpTitle.value = productData.title || '';
    if (productData.price) inpPrice.value = productData.price;
  } else {
    productError.style.display = 'flex';
    productInfo.style.display = 'none';
  }
}

// ── Screen toggles ─────────────────────────────────────────────────────

$('btn-go-signup').addEventListener('click', () => {
  hideError(loginError);
  showScreen('signup');
});

$('btn-go-login').addEventListener('click', () => {
  hideError(signupError);
  showScreen('login');
});

$('btn-verify-back').addEventListener('click', () => {
  showScreen('login');
});

// ── Login handler ───────────────────────────────────────────────────────────────

formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  hideError(loginError);

  const email = inpEmail.value.trim();
  const password = inpPassword.value;
  if (!email || !password) return;

  setLoading(btnLogin, true);
  try {
    const data = await signIn(email, password);
    if (!data?.access_token) throw new Error('Sign in failed. Check your credentials.');

    const nowSec = Math.floor(Date.now() / 1000);
    await saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: nowSec + (data.expires_in || 3600),
      user: data.user,
    });

    showScreen('main');
    loadMainScreen(data.access_token, data);
  } catch (err) {
    showError(loginError, err.message || 'Sign in failed.');
  } finally {
    setLoading(btnLogin, false);
  }
});

// ── Sign up handler ───────────────────────────────────────────────────

formSignup.addEventListener('submit', async e => {
  e.preventDefault();
  hideError(signupError);

  const name = inpName.value.trim();
  const email = inpSignupEmail.value.trim();
  const password = inpSignupPass.value;

  if (!name) return showError(signupError, 'Please enter your name.');
  if (!email) return showError(signupError, 'Please enter your email.');
  if (password.length < 8) return showError(signupError, 'Password must be at least 8 characters.');

  setLoading(btnSignup, true);
  try {
    const data = await signUp(name, email, password);

    if (data.needsVerification) {
      // Email confirmation required — show verify screen
      showScreen('verify');
      return;
    }

    // Auto-confirmed — save session and go straight to main
    const nowSec = Math.floor(Date.now() / 1000);
    await saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: nowSec + (data.expires_in || 3600),
      user: data.user,
    });
    showScreen('main');
    loadMainScreen(data.access_token, data);
  } catch (err) {
    showError(signupError, err.message || 'Sign up failed. Please try again.');
  } finally {
    setLoading(btnSignup, false);
  }
});

// Toggle password visibility on sign-up form
$('btn-toggle-signup-pass').addEventListener('click', () => {
  const isHidden = inpSignupPass.type === 'password';
  inpSignupPass.type = isHidden ? 'text' : 'password';
  $('eye-icon-signup').style.opacity = isHidden ? '0.5' : '1';
});

// ── Logout handler ──────────────────────────────────────────────────────────────

btnLogout.addEventListener('click', async () => {
  await clearSession();
  showScreen('login');
  inpEmail.value = '';
  inpPassword.value = '';
});

// ── Toggle password visibility ──────────────────────────────────────────────────

btnTogglePass.addEventListener('click', () => {
  const isHidden = inpPassword.type === 'password';
  inpPassword.type = isHidden ? 'text' : 'password';
  $('eye-icon').style.opacity = isHidden ? '0.5' : '1';
});

// ── Save handler ────────────────────────────────────────────────────────────────

formSave.addEventListener('submit', async e => {
  e.preventDefault();
  hideError(saveError);

  const title = inpTitle.value.trim();
  const price = parseFloat(inpPrice.value) || null;
  const categoryId = parseInt(selCategory.value, 10);

  if (!title) return showError(saveError, 'Please enter a product name.');
  if (!price || price <= 0) return showError(saveError, 'Please enter a valid price.');

  const token = await getValidToken();
  const session = await getSession();
  if (!token || !session) {
    await clearSession();
    showScreen('login');
    return;
  }

  setLoading(btnSave, true);

  try {
    // Get the current tab URL for the product link
    const tabs = await new Promise(r => chrome.tabs.query({ active: true, currentWindow: true }, r));
    const link = tabs[0]?.url || '';

    // Get the product image from the product card (already extracted)
    const image = productImg.src && productImg.src !== window.location.href
      ? productImg.src
      : null;

    await addItem(token, {
      user_id: session.user.id,
      name: title,
      price,
      image,
      link,
      category_id: categoryId > 0 ? categoryId : null,
    });

    showScreen('success');
  } catch (err) {
    console.error('[WishFlow] Save failed:', err);
    showError(saveError, err.message || 'Failed to save. Please try again.');
  } finally {
    setLoading(btnSave, false);
  }
});

// ── Save another ────────────────────────────────────────────────────────────────

btnSaveAnother.addEventListener('click', async () => {
  const token = await getValidToken();
  const session = await getSession();
  if (!token || !session) { showScreen('login'); return; }

  // Reset form
  inpTitle.value = '';
  inpPrice.value = '';
  selCategory.value = '-1';
  hideError(saveError);

  // Reset product card
  productLoading.style.display = 'flex';
  productInfo.style.display = 'none';
  productError.style.display = 'none';

  showScreen('main');
  loadMainScreen(token, session);
});

// ── Boot ────────────────────────────────────────────────────────────────────────

init();
