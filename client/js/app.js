// NovaCart Core Application Script

// Pre-load theme preference immediately to prevent UI flashes
(function() {
  const savedTheme = localStorage.getItem('novacart_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

// API Config - Fallback to port 3000 if hosted on another development port (e.g., Live Server 5500)
const API_BASE = (window.location.port !== '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) 
  ? `http://${window.location.hostname}:3000` 
  : '';

// Helper to show Toast notification
function showToast(message, isError = false) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.innerHTML = `
    <span>${message}</span>
    <span class="toast-close">&times;</span>
  `;

  container.appendChild(toast);

  // Trigger animation reflow
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  });

  // Auto remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }
  }, 4000);
}

// User Authentication state helpers
function getAuthToken() {
  return localStorage.getItem('novacart_token');
}

// Check logged in profile details
function getLoggedInUser() {
  const userStr = localStorage.getItem('novacart_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  } : {
    'Content-Type': 'application/json'
  };
}

function checkUserAuth() {
  const user = getLoggedInUser();
  const token = getAuthToken();
  if (token && !user) {
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('novacart_user', JSON.stringify(data.user));
        renderUserNav();
      } else {
        logoutUser();
      }
    })
    .catch(() => logoutUser());
  }
}

function logoutUser() {
  localStorage.removeItem('novacart_token');
  localStorage.removeItem('novacart_user');
  showToast('Logged out successfully.');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Cart Management System
function getCart() {
  const cartStr = localStorage.getItem('novacart_cart');
  return cartStr ? JSON.parse(cartStr) : [];
}

function saveCart(cart) {
  localStorage.setItem('novacart_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const index = cart.findIndex(item => item.productId === product.id && (item.selectedVariant === product.selectedVariant));

  if (index > -1) {
    cart[index].quantity += parseInt(quantity);
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      quantity: parseInt(quantity),
      selectedVariant: product.selectedVariant || null
    });
  }

  saveCart(cart);
  showToast(`Added ${product.name} to cart!`);
}

function updateCartBadge() {
  const cart = getCart();
  const badge = document.getElementById('cart-badge');
  if (badge) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    const oldQty = badge.textContent;
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'flex' : 'none';
    if (String(totalQty) !== oldQty && totalQty > 0) {
      badge.classList.remove('badge-pop');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('badge-pop');
      setTimeout(() => badge.classList.remove('badge-pop'), 450);
    }
  }
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge');
  const user = getLoggedInUser();
  if (!user) {
    if (badge) badge.style.display = 'none';
    window.wishlistIds = [];
    return;
  }

  fetch(`${API_BASE}/api/auth/wishlist`, { headers: getAuthHeaders() })
    .then(res => {
      if (res.ok) return res.json();
      throw new Error('Failed to fetch');
    })
    .then(data => {
      window.wishlistIds = data.map(p => p.id);
      
      if (badge) {
        const count = data.length;
        const oldCount = badge.textContent;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
        if (String(count) !== oldCount && count > 0) {
          badge.classList.remove('badge-pop');
          void badge.offsetWidth; // trigger reflow
          badge.classList.add('badge-pop');
          setTimeout(() => badge.classList.remove('badge-pop'), 450);
        }
      }

      // Sync existing card icons state
      document.querySelectorAll('.product-card-wishlist-btn').forEach(btn => {
        const id = btn.getAttribute('data-product-id');
        if (id && window.wishlistIds.includes(id)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    })
    .catch(err => {
      console.error('Error fetching wishlist badge count:', err);
    });
}
window.updateWishlistBadge = updateWishlistBadge;

window.renderWishlistCardButton = function(productId) {
  const isActive = window.wishlistIds && window.wishlistIds.includes(productId);
  return `
    <div class="product-card-wishlist-btn ${isActive ? 'active' : ''}" 
         data-product-id="${productId}" 
         onclick="window.toggleWishlistCard(event, '${productId}', this)" 
         aria-label="Add to Wishlist">
      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z">
        </path>
      </svg>
    </div>
  `;
};

window.toggleWishlistCard = async function(e, productId, btn) {
  e.stopPropagation();
  e.preventDefault();
  
  const user = getLoggedInUser();
  if (!user) {
    showToast('Please Sign In to add items to your wishlist.', true);
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1500);
    return;
  }

  const isActive = btn.classList.contains('active');
  const method = isActive ? 'DELETE' : 'POST';
  const url = isActive 
    ? `${API_BASE}/api/auth/wishlist/${productId}` 
    : `${API_BASE}/api/auth/wishlist`;
  const body = isActive ? null : JSON.stringify({ productId });

  try {
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body
    });
    const data = await res.json();
    if (data.success) {
      btn.classList.toggle('active');
      showToast(isActive ? 'Removed from wishlist.' : 'Added to wishlist!');
      updateWishlistBadge(); // Sync with other buttons and header
      
      // Sync detailed page button if matches
      if (window.location.pathname.includes('product.html')) {
        if (typeof window.updateWishlistButtonUI === 'function' && window.product && window.product.id === productId) {
          window.isInWishlist = !isActive;
          window.updateWishlistButtonUI();
        }
      }
      
      // Sync dashboard wishlist view if loaded
      if (window.location.pathname.includes('dashboard.html')) {
        if (typeof window.fetchWishlist === 'function') {
          window.fetchWishlist();
        }
      }
    } else {
      showToast(data.message || 'Failed to update wishlist.', true);
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err);
    showToast('Network error updating wishlist.', true);
  }
};

// Render dynamic navbar controls based on login status
function renderUserNav() {
  const user = getLoggedInUser();
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  if (user) {
    const isAdmin = user.role === 'admin';
    authNav.innerHTML = `
      <div class="profile-menu">
        <div class="profile-trigger" id="profile-trigger">
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          <span style="font-size:0.9rem; font-weight:600;">${user.name.split(' ')[0]}</span>
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
        <div class="profile-dropdown" id="profile-dropdown">
          <div class="profile-dropdown-header">
            <div class="profile-name">${user.name}</div>
            <div class="profile-role">${user.role}</div>
          </div>
          ${isAdmin ? `<a href="admin.html">🛡️ Admin Panel</a>` : ''}
          <a href="dashboard.html?tab=settings">⚙️ Settings</a>
          <button id="logout-btn" style="border:none; background:none; width:100%; color:#ef4444; text-align:left;">🚪 Sign Out</button>
        </div>
      </div>
    `;

    // Dropdown toggles
    const trigger = document.getElementById('profile-trigger');
    const dropdown = document.getElementById('profile-dropdown');
    
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
      }
    });

    document.getElementById('logout-btn').addEventListener('click', logoutUser);

  } else {
    authNav.innerHTML = `
      <a href="auth.html" class="auth-nav-link">Sign In</a>
    `;
  }
}

// Sticky Header scroll styling
function initHeaderScroll() {
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// Initialize Dynamic Theme Switcher Button
function initThemeSwitcher() {
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'nav-btn';
  toggleBtn.id = 'theme-toggle';
  toggleBtn.style.marginRight = '0.5rem';
  toggleBtn.setAttribute('aria-label', 'Toggle Day/Night Mode');

  const sunIcon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>`;
  const moonIcon = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  toggleBtn.innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;

  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    // Insert theme toggle as the first actions item in top navigation
    navActions.insertBefore(toggleBtn, navActions.firstChild);
  }

  toggleBtn.addEventListener('click', () => {
    // Add spin class briefly
    toggleBtn.classList.remove('theme-spin-active');
    void toggleBtn.offsetWidth; // trigger reflow
    toggleBtn.classList.add('theme-spin-active');
    setTimeout(() => toggleBtn.classList.remove('theme-spin-active'), 700);

    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('novacart_theme', theme);
    toggleBtn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    showToast(`Switched to ${theme === 'dark' ? 'Night' : 'Day'} Mode`);
  });
}

// Initialize Global Scroll Fade-In System
function initScrollAnimations() {
  // ── Selectors: every meaningful content element across all pages ──
  const AUTO_SELECTORS = [
    // Cards & grid items
    '.product-card',
    '.category-card',
    '.info-card',
    '.cancellation-card',
    '.wishlist-item',
    '.dashboard-stat-card',
    '.review-card',
    '.address-card',
    '.payment-card',
    // Headings & titles
    '.section-title',
    '.page-title',
    'main h1',
    'main h2',
    'main h3',
    // Sections & containers
    '.flash-sale-banner',
    '.hero-content',
    '.dashboard-header-block',
    '.filter-group',
    // Product detail page
    '.product-detail-image',
    '.product-detail-info',
    '.product-tabs',
    '.related-products',
    // Cart & Checkout
    '.cart-item',
    '.cart-summary',
    '.order-summary',
    '.checkout-form',
    // Tables
    'main table',
    // Banners & CTAs
    '.cta-section',
    '.promo-banner',
    // Testimonials / Reviews
    '.testimonial-card',
    '.review-item',
    // Sidebar panels
    '.filter-sidebar',
    '.dashboard-sidebar',
    // Auth forms
    '.auth-card',
    '.auth-form',
    // Already-manual class (preserve backward compat)
    '.scroll-animate',
  ].join(',');

  const candidates = document.querySelectorAll(AUTO_SELECTORS);

  // Track which elements we've already handled to avoid duplicates
  const seen = new WeakSet();
  const elements = [];

  candidates.forEach(el => {
    // Skip header, footer, nav, already-visible fixed elements
    const tag = el.tagName.toLowerCase();
    if (seen.has(el)) return;
    if (el.closest('header, footer, nav, .modal-overlay')) return;
    // Skip elements with no visual size
    if (el.offsetHeight === 0 && el.offsetWidth === 0) return;
    seen.add(el);
    elements.push(el);
  });

  // Assign base animation class + staggered delay per sibling group
  const siblingCounters = new Map();

  elements.forEach(el => {
    // Already has animation — just let the existing class handle it
    if (el.classList.contains('animated')) return;

    // Add the base scroll-animate class if not already present
    if (!el.classList.contains('scroll-animate')) {
      el.classList.add('scroll-animate', 'fade-in-up');
    }

    // Stagger siblings that share the same parent (e.g., grid cards)
    const parent = el.parentElement;
    const count = siblingCounters.get(parent) || 0;
    siblingCounters.set(parent, count + 1);

    // 80ms stagger — each card cascades beautifully
    const staggerIndex = count % 6;
    el.style.transitionDelay = `${staggerIndex * 0.08}s`;
  });

  // Observer — fires when element enters viewport
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        // Promote to GPU right before animating to avoid memory overhead
        target.style.willChange = 'transform, opacity';

        // Small RAF delay keeps the transition smooth
        requestAnimationFrame(() => {
          target.classList.add('animated');
          // Clear stagger delay and GPU layers after animation finishes
          setTimeout(() => {
            target.style.transitionDelay = '';
            target.style.willChange = '';
          }, 1500);
        });
        obs.unobserve(target);
      }
    });
  }, {
    root: null,
    // Trigger when element crosses 40px into the viewport
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.02
  });

  elements.forEach(el => {
    // Elements already in the viewport on page load animate immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // Already visible — animate right away with a tiny delay for paint
      setTimeout(() => {
        el.classList.add('animated');
        el.style.transitionDelay = '';
        el.style.willChange = '';
      }, 50);
    } else {
      observer.observe(el);
    }
  });
}
window.initScrollAnimations = initScrollAnimations;

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initThemeSwitcher();
  checkUserAuth();
  renderUserNav();
  updateCartBadge();
  updateWishlistBadge();
  initScrollAnimations();
});

