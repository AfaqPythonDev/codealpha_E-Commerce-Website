// Shopping Cart Controller

let activeCoupon = null;

document.addEventListener('DOMContentLoaded', () => {
  // Load active coupon from localStorage if saved
  const savedCoupon = localStorage.getItem('novacart_coupon');
  if (savedCoupon) {
    try {
      activeCoupon = JSON.parse(savedCoupon);
    } catch (e) {
      activeCoupon = null;
    }
  }

  renderCart();

  // Bind coupon and checkout buttons
  document.getElementById('apply-coupon-btn').addEventListener('click', applyCouponCode);
  document.getElementById('checkout-btn').addEventListener('click', handleCheckoutRedirect);
});

// Render the cart layout
function renderCart() {
  const cart = getCart();
  const itemsList = document.getElementById('cart-items-list');

  if (cart.length === 0) {
    itemsList.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
        <h2 style="font-family: var(--font-heading); margin-bottom: 0.5rem;">Your shopping cart is empty</h2>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Discover our premium selection across clothing, home, beauty, and tech.</p>
        <a href="shop.html" class="btn btn-primary">Start Shopping</a>
      </div>
    `;
    
    document.querySelector('.cart-summary').style.opacity = '0.5';
    document.querySelector('.cart-summary').style.pointerEvents = 'none';
    
    removeCoupon();
    updateSummaryPrices(0);
    return;
  }

  document.querySelector('.cart-summary').style.opacity = '1';
  document.querySelector('.cart-summary').style.pointerEvents = 'auto';

  // Render items with variant tags
  itemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-category">${item.category}</div>
        <h3 class="cart-item-title"><a href="product.html?id=${item.productId}">${item.name}</a></h3>
        ${item.selectedVariant ? `<div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Option: <strong style="color:var(--accent-emerald);">${item.selectedVariant}</strong></div>` : ''}
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
      </div>
      
      <!-- Quantity Adjuster -->
      <div class="qty-select" style="margin-right: 1.5rem;">
        <button class="qty-btn" onclick="adjustCartQty('${item.productId}', '${item.selectedVariant || ''}', -1)">&minus;</button>
        <div class="qty-num">${item.quantity}</div>
        <button class="qty-btn" onclick="adjustCartQty('${item.productId}', '${item.selectedVariant || ''}', 1)">&plus;</button>
      </div>

      <!-- Delete Button -->
      <div class="cart-item-remove" onclick="removeCartItem('${item.productId}', '${item.selectedVariant || ''}')" aria-label="Remove item">
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </div>
    </div>
  `).join('');

  // Calculate pricing subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  updateSummaryPrices(subtotal);

  // Trigger fade-in animations on newly rendered cart items
  if (window.initScrollAnimations) window.initScrollAnimations();
}

// Adjust quantity matched by product ID and variant option selection
window.adjustCartQty = function(productId, variant, amount) {
  const cart = getCart();
  const index = cart.findIndex(item => item.productId === productId && (item.selectedVariant || '') === variant);
  if (index === -1) return;

  const newQty = cart[index].quantity + amount;
  if (newQty <= 0) {
    removeCartItem(productId, variant);
  } else {
    cart[index].quantity = newQty;
    saveCart(cart);
    renderCart();
  }
};

// Remove item matched by product ID and variant option selection
window.removeCartItem = function(productId, variant) {
  let cart = getCart();
  cart = cart.filter(item => !(item.productId === productId && (item.selectedVariant || '') === variant));
  saveCart(cart);
  renderCart();
  showToast('Item removed from cart.');
};

// Recalculate and update summary prices
function updateSummaryPrices(subtotal) {
  const shippingCost = subtotal > 150 || subtotal === 0 ? 0.00 : 10.00;
  let discount = 0.00;

  const badge = document.getElementById('active-coupon-badge');
  if (activeCoupon && subtotal > 0) {
    if (activeCoupon.type === 'percentage') {
      discount = subtotal * (activeCoupon.value / 100);
    } else {
      discount = activeCoupon.value;
    }

    badge.className = 'coupon-badge';
    badge.style.display = 'inline-flex';
    badge.innerHTML = `
      🏷️ <strong>${activeCoupon.code}</strong> (-${activeCoupon.type === 'percentage' ? activeCoupon.value + '%' : '$' + activeCoupon.value})
      <span onclick="removeCoupon()" style="margin-left: 0.5rem;">&times;</span>
    `;

    document.getElementById('summary-discount-row').style.display = 'flex';
    document.getElementById('summary-discount').textContent = `-$${discount.toFixed(2)}`;
  } else {
    badge.style.display = 'none';
    document.getElementById('summary-discount-row').style.display = 'none';
  }

  const total = Math.max(0, subtotal + shippingCost - discount);

  document.getElementById('summary-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('summary-shipping').textContent = shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`;
  document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;

  const calcData = { subtotal, shippingCost, discountAmount: discount, total, couponCode: activeCoupon ? activeCoupon.code : null };
  localStorage.setItem('novacart_checkout_calcs', JSON.stringify(calcData));
}

// Fetch backend validate coupon API
async function applyCouponCode() {
  const code = document.getElementById('coupon-code').value.trim();
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (!code) {
    showToast('Please enter a promo code.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/coupons/validate?code=${code}&subtotal=${subtotal}`);
    const data = await res.json();

    if (data.success) {
      activeCoupon = data.coupon;
      localStorage.setItem('novacart_coupon', JSON.stringify(data.coupon));
      document.getElementById('coupon-code').value = '';
      
      renderCart();
      showToast('Promo code applied successfully!');
    } else {
      showToast(data.message || 'Invalid promo code.', true);
    }
  } catch (error) {
    console.error('Error applying coupon:', error);
    showToast('Failed to validate promo code.', true);
  }
}

// De-activate current coupon
window.removeCoupon = function() {
  activeCoupon = null;
  localStorage.removeItem('novacart_coupon');
  renderCart();
};

// Checkout redirect verify login status
function handleCheckoutRedirect() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your shopping cart is empty.', true);
    return;
  }

  const user = getLoggedInUser();
  if (user) {
    window.location.href = 'checkout.html';
  } else {
    showToast('Authentication required. Redirecting to Sign In...', true);
    setTimeout(() => {
      window.location.href = 'auth.html?redirect=checkout.html';
    }, 1000);
  }
}
