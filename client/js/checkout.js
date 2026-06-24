// Checkout Page Controller

let calcData = null;

document.addEventListener('DOMContentLoaded', () => {
  // Ensure user is authorized
  const user = getLoggedInUser();
  if (!user) {
    window.location.href = 'auth.html?redirect=checkout.html';
    return;
  }

  // Pre-fill user name in shipping details
  document.getElementById('shipping-name').value = user.name;

  // Retrieve pricing and cart items
  const cart = getCart();
  const calcsStr = localStorage.getItem('novacart_checkout_calcs');
  
  if (cart.length === 0 || !calcsStr) {
    window.location.href = 'cart.html';
    return;
  }

  try {
    calcData = JSON.parse(calcsStr);
  } catch (e) {
    window.location.href = 'cart.html';
    return;
  }

  renderReviewItems(cart);
  renderTotals();

  // Form submit handler
  document.getElementById('checkout-form').addEventListener('submit', handleOrderSubmit);
});

// Toggle card detail form sections
window.toggleCardFields = function(show) {
  const fields = document.getElementById('card-fields-section');
  const numInput = document.getElementById('card-num');
  const expInput = document.getElementById('card-expiry');
  const cvvInput = document.getElementById('card-cvv');

  if (show) {
    fields.style.display = 'block';
    numInput.required = true;
    expInput.required = true;
    cvvInput.required = true;
  } else {
    fields.style.display = 'none';
    numInput.required = false;
    expInput.required = false;
    cvvInput.required = false;
  }
};

// Render product review list
function renderReviewItems(cart) {
  const container = document.getElementById('checkout-items-preview');
  
  container.innerHTML = cart.map(item => `
    <div style="display: flex; gap: 0.8rem; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
      <div style="display: flex; gap: 0.6rem; align-items: center; overflow: hidden;">
        <img src="${item.image}" alt="${item.name}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px; background: var(--bg-secondary);">
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <div style="font-size: 0.9rem; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 0.5rem;">
            <span>Qty: ${item.quantity}</span>
            ${item.selectedVariant ? `<span style="color:var(--accent-emerald);">(${item.selectedVariant})</span>` : ''}
          </div>
        </div>
      </div>
      <div style="font-weight: 600; font-size: 0.9rem;">$${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

// Render checkout calculations
function renderTotals() {
  if (!calcData) return;

  document.getElementById('checkout-subtotal').textContent = `$${calcData.subtotal.toFixed(2)}`;
  document.getElementById('checkout-shipping').textContent = calcData.shippingCost === 0 ? 'FREE' : `$${calcData.shippingCost.toFixed(2)}`;
  
  if (calcData.discountAmount > 0) {
    document.getElementById('checkout-discount-row').style.display = 'flex';
    document.getElementById('checkout-discount').textContent = `-$${calcData.discountAmount.toFixed(2)}`;
  } else {
    document.getElementById('checkout-discount-row').style.display = 'none';
  }

  document.getElementById('checkout-total').textContent = `$${calcData.total.toFixed(2)}`;
}

// Place order call to Express
async function handleOrderSubmit(e) {
  e.preventDefault();

  const cart = getCart();
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

  // Build address object
  const shippingAddress = {
    name: document.getElementById('shipping-name').value.trim(),
    street: document.getElementById('shipping-address').value.trim(),
    city: document.getElementById('shipping-city').value.trim(),
    state: document.getElementById('shipping-state').value.trim(),
    zip: document.getElementById('shipping-zip').value.trim(),
    country: document.getElementById('shipping-country').value.trim(),
    phone: document.getElementById('shipping-phone').value.trim()
  };

  // Setup request payload
  const payload = {
    items: cart,
    shippingAddress,
    paymentMethod,
    couponCode: calcData.couponCode,
    subtotal: calcData.subtotal,
    shippingCost: calcData.shippingCost,
    discountAmount: calcData.discountAmount,
    total: calcData.total
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      localStorage.removeItem('novacart_cart');
      localStorage.removeItem('novacart_coupon');
      localStorage.removeItem('novacart_checkout_calcs');
      
      updateCartBadge(); // Reset header Display

      document.getElementById('success-order-id').textContent = data.order.id;
      
      const modal = document.getElementById('success-modal');
      modal.classList.add('show');
      
      showToast('Order generated successfully!');
    } else {
      showToast(data.message || 'Failed to place order.', true);
    }
  } catch (error) {
    console.error('Checkout error:', error);
    showToast('Network error. Unable to verify purchase.', true);
  }
}
