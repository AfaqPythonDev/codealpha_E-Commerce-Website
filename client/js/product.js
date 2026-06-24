// Product Details Page Controller

let currentProduct = null;
let currentQty = 1;
let selectedVariant = null;
let isInWishlist = false;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = 'shop.html';
    return;
  }

  fetchProductDetails(productId);
  setupReviewForm(productId);

  const user = getLoggedInUser();
  if (user) {
    checkWishlistStatus(productId);
  }
});

// Fetch product details from Express server
async function fetchProductDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (res.status === 404) {
      document.getElementById('product-details-container').innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #ef4444;">
          <h3>Product not found.</h3>
          <p style="margin-top: 0.5rem;"><a href="shop.html" class="emerald-link" style="text-decoration: underline;">Return to Catalog</a></p>
        </div>
      `;
      return;
    }
    const product = await res.json();
    currentProduct = product;

    // Set default variant if available
    if (product.variants && product.variants.length > 0) {
      selectedVariant = product.variants[0];
    } else {
      selectedVariant = null;
    }

    renderProductDetails(product);
    renderSpecs(product.specs);
    renderReviews(product.reviews || []);
    fetchRelatedProducts(product.category, product.id);

  } catch (error) {
    console.error('Error fetching product details:', error);
    showToast('Failed to load product details.', true);
  }
}

// Select variant option
window.selectVariantOption = function(element, value) {
  const container = document.getElementById('variants-container');
  if (container) {
    container.querySelectorAll('.variant-option-btn').forEach(btn => btn.classList.remove('active'));
  }
  element.classList.add('active');
  selectedVariant = value;
};

// Render primary product details
function renderProductDetails(product) {
  const container = document.getElementById('product-details-container');
  const isOutOfStock = product.stock === 0;

  // Set page document title dynamically
  document.title = `${product.name} | NovaCart`;

  const hasSale = product.flashSale && product.flashSalePrice;
  const displayPrice = hasSale ? product.flashSalePrice : product.price;

  container.innerHTML = `
    <!-- Gallery -->
    <div class="product-gallery animate-scale-in">
      <div class="main-image-container">
        <img src="${product.image}" alt="${product.name}" class="main-image" id="primary-view">
      </div>
      <div class="thumbnail-row" id="thumbnails-container">
        <!-- Thumbnails populated below -->
      </div>
    </div>

    <!-- Info details -->
    <div class="details-content animate-slide-up">
      <div class="details-category">${product.category}</div>
      <h1 class="details-title">${product.name}</h1>
      
      <div class="product-rating" style="font-size: 1rem; margin-bottom: 0;">
        ⭐ ${product.rating.toFixed(1)} <span id="rating-count-label">(${product.reviews ? product.reviews.length : 0} reviews)</span>
      </div>

      <div class="details-price-row">
        <div class="details-price">
          $${displayPrice.toFixed(2)}
          ${hasSale ? `<span class="original-price" style="font-size:1.3rem;">$${product.price.toFixed(2)}</span>` : ''}
        </div>
        <div class="stock-badge ${isOutOfStock ? 'out-stock' : 'in-stock'}">
          ${isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} items left)`}
        </div>
      </div>

      <p class="details-description">${product.description}</p>

      <!-- Variants selectors if available -->
      ${product.variants && product.variants.length > 0 ? `
        <div class="variant-selector-title">${product.category === 'Fashion' ? 'Select Size / Option' : 'Choose Variant'}:</div>
        <div class="variant-options-container" id="variants-container" style="margin-bottom:2rem;">
          ${product.variants.map((v, i) => `
            <div class="variant-option-btn ${i === 0 ? 'active' : ''}" onclick="selectVariantOption(this, '${v}')">${v}</div>
          `).join('')}
        </div>
      ` : ''}

      <div class="purchase-row">
        <div class="qty-select">
          <button class="qty-btn" id="qty-minus" style="${isOutOfStock ? 'pointer-events:none; opacity:0.5;' : ''}">&minus;</button>
          <div class="qty-num" id="qty-value">${currentQty}</div>
          <button class="qty-btn" id="qty-plus" style="${isOutOfStock ? 'pointer-events:none; opacity:0.5;' : ''}">&plus;</button>
        </div>
        
        <button id="add-to-cart-btn" class="btn btn-primary" style="flex-grow: 1;" ${isOutOfStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          Add to Cart
        </button>
        <button id="wishlist-btn" class="btn btn-secondary" style="padding: 0.8rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);" aria-label="Add to Wishlist">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" id="wishlist-heart-icon" style="transition: fill 0.3s ease, stroke 0.3s ease;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
        </button>
      </div>

      <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; font-size: 0.85rem; color: var(--text-dark); display: flex; flex-direction: column; gap: 0.5rem;">
        <div>🚚 <strong>Complementary Shipping:</strong> Delivered in 3-5 business days globally.</div>
        <div>🛡️ <strong>Official Warranty:</strong> Includes 12-month replacement protection certificate.</div>
      </div>
    </div>
  `;

  // Populate thumbnails
  const thumbsContainer = document.getElementById('thumbnails-container');
  const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
  
  thumbsContainer.innerHTML = allImages.map((img, i) => `
    <img src="${img}" alt="${product.name} view ${i+1}" class="thumbnail ${i === 0 ? 'active' : ''}">
  `).join('');

  // Thumbnail hover/click swaps
  thumbsContainer.querySelectorAll('.thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbsContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      document.getElementById('primary-view').src = thumb.src;
    });
  });

  // Zoom interactive effect
  const primaryView = document.getElementById('primary-view');
  primaryView.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = primaryView.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    primaryView.style.transformOrigin = `${x}% ${y}%`;
    primaryView.style.transform = 'scale(1.5)';
  });

  primaryView.addEventListener('mouseleave', () => {
    primaryView.style.transform = 'scale(1)';
    primaryView.style.transformOrigin = 'center center';
  });

  // Quantity bindings
  const qtyVal = document.getElementById('qty-value');
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (currentQty > 1) {
      currentQty--;
      qtyVal.textContent = currentQty;
    }
  });

  document.getElementById('qty-plus').addEventListener('click', () => {
    if (currentQty < product.stock) {
      currentQty++;
      qtyVal.textContent = currentQty;
    } else {
      showToast(`Cannot select more than stock limit (${product.stock}).`, true);
    }
  });

  // Cart button binding
  document.getElementById('add-to-cart-btn').addEventListener('click', () => {
    if (currentProduct) {
      const price = currentProduct.flashSale && currentProduct.flashSalePrice ? currentProduct.flashSalePrice : currentProduct.price;
      const finalItem = {
        ...currentProduct,
        price,
        selectedVariant: selectedVariant
      };

      // Customized add to cart to hold variant detail
      const cart = getCart();
      const index = cart.findIndex(item => item.productId === finalItem.id && item.selectedVariant === selectedVariant);

      if (index > -1) {
        cart[index].quantity += parseInt(currentQty);
      } else {
        cart.push({
          productId: finalItem.id,
          name: finalItem.name,
          price: finalItem.price,
          image: finalItem.image,
          category: finalItem.category,
          quantity: parseInt(currentQty),
          selectedVariant: selectedVariant
        });
      }

      saveCart(cart);
      showToast(`Added ${finalItem.name} ${selectedVariant ? '('+selectedVariant+')' : ''} to cart!`);

      currentQty = 1;
      qtyVal.textContent = currentQty;
    }
  });

  // Update wishlist UI button indicator if already loaded
  updateWishlistButtonUI();

  // Wishlist button click handler
  const wishlistBtn = document.getElementById('wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', async () => {
      const user = getLoggedInUser();
      if (!user) {
        showToast('Please Sign In to add items to your wishlist.', true);
        return;
      }

      try {
        const method = isInWishlist ? 'DELETE' : 'POST';
        const url = isInWishlist 
          ? `${API_BASE}/api/auth/wishlist/${product.id}` 
          : `${API_BASE}/api/auth/wishlist`;
        const body = isInWishlist ? null : JSON.stringify({ productId: product.id });

        const res = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body
        });
        const data = await res.json();

        if (data.success) {
          isInWishlist = !isInWishlist;
          updateWishlistButtonUI();
          if (window.updateWishlistBadge) window.updateWishlistBadge();
          showToast(isInWishlist ? 'Added to wishlist!' : 'Removed from wishlist.');
        } else {
          showToast(data.message || 'Failed to update wishlist.', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Network error updating wishlist.', true);
      }
    });
  }
}

// Display specifications
function renderSpecs(specs) {
  const table = document.getElementById('specs-table');
  if (!specs || Object.keys(specs).length === 0) {
    table.innerHTML = `<tr><td style="color: var(--text-dark); text-align: center; padding: 2rem;">No specifications detailed for this product.</td></tr>`;
    return;
  }

  table.innerHTML = Object.keys(specs).map(key => `
    <tr>
      <td class="spec-name">${key}</td>
      <td>${specs[key]}</td>
    </tr>
  `).join('');
}

// Display reviews
function renderReviews(reviews) {
  const header = document.getElementById('reviews-tab-header');
  header.textContent = `Customer Reviews (${reviews.length})`;

  const list = document.getElementById('reviews-list');
  if (reviews.length === 0) {
    list.innerHTML = `<div style="color: var(--text-dark); padding: 2rem 0; text-align: center;">No customer reviews written yet. Be the first to share your thoughts!</div>`;
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-meta">
        <div>
          <span class="reviewer-name">${r.reviewer}</span>
          <span style="color: #fbbf24; margin-left: 0.8rem;">${'⭐'.repeat(Math.round(r.rating))}</span>
        </div>
        <span class="review-date">${new Date(r.date).toLocaleDateString()}</span>
      </div>
      <p class="review-comment">"${r.comment}"</p>
    </div>
  `).join('');
}

// Check logged in user to show/hide review submission box
function setupReviewForm(productId) {
  const user = getLoggedInUser();
  const form = document.getElementById('product-review-form');
  const prompt = document.getElementById('review-auth-prompt');

  if (user) {
    form.style.display = 'block';
    prompt.style.display = 'none';

    // Prevent double form bindings
    form.onsubmit = async (e) => {
      e.preventDefault();
      const rating = document.getElementById('review-rating').value;
      const comment = document.getElementById('review-comment').value;

      try {
        const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ rating, comment })
        });

        const data = await res.json();

        if (data.success) {
          showToast('Review submitted successfully! Thank you.');
          form.reset();
          fetchProductDetails(productId);
        } else {
          showToast(data.message || 'Failed to submit review.', true);
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Network error. Unable to save review.', true);
      }
    };
  } else {
    form.style.display = 'none';
    prompt.style.display = 'block';
  }
}

// Switch tabs: specs or reviews
function switchDetailsTab(tab) {
  const headers = document.querySelectorAll('.tab-header');
  const paneSpecs = document.getElementById('pane-specs');
  const paneReviews = document.getElementById('pane-reviews');

  headers.forEach(h => h.classList.remove('active'));

  if (tab === 'specs') {
    paneSpecs.classList.add('active');
    paneReviews.classList.remove('active');
    event.currentTarget.classList.add('active');
  } else {
    paneSpecs.classList.remove('active');
    paneReviews.classList.add('active');
    event.currentTarget.classList.add('active');
  }
}

// Fetch related items from matching category
async function fetchRelatedProducts(category, currentId) {
  try {
    const res = await fetch(`${API_BASE}/api/products?category=${category}`);
    const products = await res.json();

    const related = products.filter(p => p.id !== currentId).slice(0, 4);
    const grid = document.getElementById('related-products-grid');

    if (related.length === 0) {
      grid.innerHTML = '<div style="color: var(--text-dark); grid-column: 1 / -1;">No related accessories found in this category.</div>';
      return;
    }

    grid.innerHTML = related.map((p, i) => `
      <div class="product-card scroll-animate fade-in-up" style="transition-delay: ${0.05 * (i % 4)}s !important;">
        <div class="product-image-container" onclick="window.location.href='product.html?id=${p.id}'" style="cursor: pointer;">
          <img src="${p.image}" alt="${p.name}" class="product-card-img" loading="lazy">
          <div class="product-badge-group">
            ${p.isFeatured ? '<span class="product-badge">Trending</span>' : ''}
            ${p.flashSale && p.flashSalePrice ? '<span class="product-badge sale">Sale</span>' : ''}
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
            <div class="product-price">$${p.price.toFixed(2)}</div>
            <div class="product-add-btn" data-id="${p.id}" style="${p.stock === 0 ? 'opacity: 0.5; pointer-events: none;' : ''}" aria-label="Add ${p.name} to Cart">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Bind related cards add click
    grid.querySelectorAll('.product-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const product = related.find(prod => prod.id === id);
        if (product) {
          addToCart(product, 1);
        }
      });
    });

    if (window.initScrollAnimations) window.initScrollAnimations();
    if (window.updateWishlistBadge) window.updateWishlistBadge();

  } catch (error) {
    console.error('Error fetching related products:', error);
  }
}

// Wishlist status checkers
async function checkWishlistStatus(productId) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/wishlist`, { headers: getAuthHeaders() });
    const wishlist = await res.json();
    isInWishlist = wishlist.some(p => p.id === productId);
    updateWishlistButtonUI();
  } catch (err) {
    console.error('Error fetching wishlist status:', err);
  }
}

function updateWishlistButtonUI() {
  const icon = document.getElementById('wishlist-heart-icon');
  const btn = document.getElementById('wishlist-btn');
  if (icon && btn) {
    if (isInWishlist) {
      icon.style.fill = '#ef4444';
      icon.style.stroke = '#ef4444';
      btn.style.borderColor = '#ef4444';
    } else {
      icon.style.fill = 'none';
      icon.style.stroke = 'currentColor';
      btn.style.borderColor = 'var(--border-color)';
    }
  }
}
