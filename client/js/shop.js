// Shop Catalog Controller

let currentProducts = [];
let selectedRating = null;

document.addEventListener('DOMContentLoaded', () => {
  // Read initial filter values from URL query string
  parseUrlFilters();
  
  // Initial products fetch
  fetchCatalog();

  // Bind input event listeners
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', handleSearchInput);
  
  document.querySelectorAll('.category-checkbox').forEach(cb => {
    cb.addEventListener('change', fetchCatalog);
  });

  document.getElementById('filter-out-of-stock').addEventListener('change', fetchCatalog);
  document.getElementById('apply-price-btn').addEventListener('click', fetchCatalog);
  document.getElementById('sort-select').addEventListener('change', fetchCatalog);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);

  // Close search suggestions on click outside
  document.addEventListener('click', (e) => {
    const suggestions = document.getElementById('search-suggestions');
    if (!e.target.closest('#search-input') && !e.target.closest('#search-suggestions')) {
      suggestions.classList.remove('show');
    }
  });
});

// Helper to debounce search input typing
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Read query params from URL (e.g. shop.html?category=Electronics)
function parseUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  
  if (category) {
    document.querySelectorAll('.category-checkbox').forEach(cb => {
      if (cb.value.toLowerCase() === category.toLowerCase()) {
        cb.checked = true;
      }
    });
  }
}

// Select rating stars filter
function selectRatingFilter(stars) {
  const items = document.querySelectorAll('.rating-filter-item');
  
  if (selectedRating === stars) {
    selectedRating = null;
    items.forEach(i => i.classList.remove('active'));
  } else {
    selectedRating = stars;
    items.forEach((item, index) => {
      // Index 0 matches 4 stars, 1 matches 3 stars, 2 matches 2 stars
      const checkStars = 4 - index;
      if (checkStars === stars) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  fetchCatalog();
}

// Search input wrapper handling both suggestions and catalog refresh
const fetchCatalogDebounced = debounce(fetchCatalog, 300);

function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  const suggestions = document.getElementById('search-suggestions');

  if (query.length < 2) {
    suggestions.classList.remove('show');
    fetchCatalogDebounced();
    return;
  }

  // Filter current products lists for suggestion hints
  // Fallback to fetch catalog if products list not loaded yet
  const matches = currentProducts.filter(p => 
    p.name.toLowerCase().includes(query) || 
    p.category.toLowerCase().includes(query)
  ).slice(0, 5);

  if (matches.length > 0) {
    suggestions.innerHTML = matches.map(p => `
      <div class="suggestion-item" onclick="selectSuggestion('${p.id}', '${p.name}')">
        <span>🔍 ${p.name}</span>
        <span class="suggestion-item-category">${p.category}</span>
      </div>
    `).join('');
    suggestions.classList.add('show');
  } else {
    suggestions.innerHTML = `<div style="padding:0.8rem 1.2rem; color:var(--text-dark); font-size:0.85rem;">No recommendations found</div>`;
    suggestions.classList.add('show');
  }

  fetchCatalogDebounced();
}

// Suggestion click
function selectSuggestion(id, name) {
  document.getElementById('search-input').value = name;
  document.getElementById('search-suggestions').classList.remove('show');
  window.location.href = `product.html?id=${id}`;
}

// Fetch products based on current active filters
async function fetchCatalog() {
  const search = document.getElementById('search-input').value;
  const minPrice = document.getElementById('price-min').value;
  const maxPrice = document.getElementById('price-max').value;
  const sort = document.getElementById('sort-select').value;
  const hideStock = document.getElementById('filter-out-of-stock').checked;
  
  // Gather selected categories
  const selectedCategories = [];
  document.querySelectorAll('.category-checkbox:checked').forEach(cb => {
    selectedCategories.push(cb.value);
  });

  // Construct URL parameters
  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);
  if (sort) queryParams.set('sort', sort);
  if (selectedRating) queryParams.set('minRating', selectedRating);
  if (hideStock) queryParams.set('hideOutOfStock', 'true');
  
  if (selectedCategories.length === 1) {
    queryParams.set('category', selectedCategories[0]);
  }

  try {
    const res = await fetch(`${API_BASE}/api/products?${queryParams.toString()}`);
    let products = await res.json();

    // If user checked multiple categories, filter them client side
    if (selectedCategories.length > 1) {
      products = products.filter(p => 
        selectedCategories.some(cat => p.category.toLowerCase() === cat.toLowerCase())
      );
    }

    currentProducts = products;
    renderCatalog(products);
  } catch (error) {
    console.error('Error fetching catalog products:', error);
    showToast('Failed to load products from server.', true);
  }
}

// Render product card array to DOM
function renderCatalog(products) {
  const grid = document.getElementById('shop-products-grid');
  const countText = document.getElementById('results-count');

  countText.textContent = `Showing ${products.length} product${products.length === 1 ? '' : 's'}`;

  if (products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-dark);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>No gear matches your search criteria.</h3>
        <p style="margin-top: 0.5rem; color: var(--text-muted);">Try adjusting your search queries or resetting filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const hasSale = p.flashSale && p.flashSalePrice;
    const displayPrice = hasSale ? p.flashSalePrice : p.price;

    return `
      <div class="product-card scroll-animate fade-in-up" style="transition-delay: ${0.05 * (i % 4)}s !important;">
        <div class="product-image-container" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
          <div class="product-badge-group">
            ${p.isFeatured ? '<span class="product-badge">Trending</span>' : ''}
            ${hasSale ? '<span class="product-badge sale">Sale</span>' : ''}
            ${p.stock === 0 ? '<span class="product-badge" style="background:#ef4444; color:#fff;">Out of Stock</span>' : ''}
          </div>
          ${renderWishlistCardButton(p.id)}
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${p.category}</div>
          <h3 class="product-card-title"><a href="product.html?id=${p.id}">${p.name}</a></h3>
          <div class="product-rating">
            ⭐ ${p.rating.toFixed(1)} <span>(${p.reviews ? p.reviews.length : 0})</span>
          </div>
          <div class="product-card-footer">
            <div class="product-price">
              $${displayPrice.toFixed(2)}
              ${hasSale ? `<span class="original-price">$${p.price.toFixed(2)}</span>` : ''}
            </div>
            <div class="product-add-btn" data-id="${p.id}" style="${p.stock === 0 ? 'opacity: 0.5; pointer-events: none;' : ''}" aria-label="Add ${p.name} to Cart">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click handlers
  grid.querySelectorAll('.product-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const product = products.find(prod => prod.id === id);
      if (product) {
        const price = product.flashSale && product.flashSalePrice ? product.flashSalePrice : product.price;
        const item = { ...product, price };
        addToCart(item, 1);
      }
    });
  });

  if (window.initScrollAnimations) window.initScrollAnimations();
  if (window.updateWishlistBadge) window.updateWishlistBadge();
}

// Reset sidebar filters
function resetFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('price-min').value = '0';
  document.getElementById('price-max').value = '500';
  document.getElementById('sort-select').value = 'popular';
  document.getElementById('filter-out-of-stock').checked = false;
  
  selectedRating = null;
  document.querySelectorAll('.rating-filter-item').forEach(i => i.classList.remove('active'));
  
  document.querySelectorAll('.category-checkbox').forEach(cb => {
    cb.checked = false;
  });

  // Clear query parameters in URL
  if (window.history.pushState) {
    const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.pushState({path:newurl},'',newurl);
  }

  fetchCatalog();
  showToast('Filters cleared successfully.');
}
