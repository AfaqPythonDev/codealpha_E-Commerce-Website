// User Dashboard Controller

let userOrders = [];
let userAddresses = [];
let userPayments = [];
let userWishlist = [];
let currentReviewProduct = null;

document.addEventListener('DOMContentLoaded', () => {
  // Ensure user is authorized
  const user = getLoggedInUser();
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }

  // Load complete profile information
  loadProfileUI(user);

  // Bind forms submit handlers
  document.getElementById('profile-edit-form').addEventListener('submit', handleProfileUpdate);
  document.getElementById('profile-password-form').addEventListener('submit', handlePasswordUpdate);
  document.getElementById('address-form').addEventListener('submit', handleAddressSubmit);
  document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);
  document.getElementById('dashboard-review-form').addEventListener('submit', handleReviewSubmit);

  // Check URL parameters for tab redirection
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab) {
    switchDashboardTab(tab);
  } else {
    switchDashboardTab('profile'); // Default to profile tab
  }
});

// Setup Profile UI fields
function loadProfileUI(user) {
  // Name headers
  document.getElementById('welcome-name').textContent = `Hello, ${user.name}`;
  document.getElementById('sidebar-user-name').textContent = user.name;
  document.getElementById('welcome-tier').textContent = user.role === 'admin' ? 'Administrator' : 'Standard Customer';

  // Set avatar letter initials
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('avatar-letters').textContent = initials || 'U';

  // Set member date
  const dateStr = new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  document.getElementById('welcome-member-since').textContent = `Member since: ${dateStr}`;

  // Edit fields
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-phone').value = user.phone || '';
  document.getElementById('profile-birthday').value = user.birthday || '';
  document.getElementById('profile-gender').value = user.gender || '';
  document.getElementById('profile-marketing').checked = !!user.receiveMarketing;
}

// Switch dashboard tabs view
window.switchDashboardTab = function(tab) {
  // Hide all panes & deactivate menu links
  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  // Highlight selection
  const activeMenu = document.getElementById(`menu-${tab}`);
  const activePane = document.getElementById(`panel-${tab}`);

  if (activeMenu) activeMenu.classList.add('active');
  if (activePane) activePane.classList.add('active');

  // Trigger fetches depending on selected tab
  if (tab === 'orders') {
    fetchOrdersHistory();
  } else if (tab === 'addresses') {
    fetchAddresses();
  } else if (tab === 'payments') {
    fetchPayments();
  } else if (tab === 'cancellations') {
    fetchCancellations();
  } else if (tab === 'reviews') {
    fetchReviewsDashboard();
  } else if (tab === 'wishlist') {
    fetchWishlist();
  }
};

// PROFILE UPDATES
async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name').value.trim();
  const phone = document.getElementById('profile-phone').value.trim();
  const birthday = document.getElementById('profile-birthday').value;
  const gender = document.getElementById('profile-gender').value;
  const receiveMarketing = document.getElementById('profile-marketing').checked;

  if (!name) {
    showToast('Name cannot be left empty.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, phone, birthday, gender, receiveMarketing })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem('novacart_user', JSON.stringify(data.user));
      loadProfileUI(data.user);
      renderUserNav(); // Update global navbar details
      showToast('Profile credentials updated successfully!');
    } else {
      showToast(data.message || 'Failed to update profile.', true);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Network error updating profile credentials.', true);
  }
}

async function handlePasswordUpdate(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('password-old').value;
  const newPassword = document.getElementById('password-new').value;
  const confirmPassword = document.getElementById('password-confirm').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match.', true);
    return;
  }

  if (newPassword.length < 6) {
    showToast('Password must be at least 6 characters long.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Password updated successfully!');
      document.getElementById('profile-password-form').reset();
    } else {
      showToast(data.message || 'Failed to update password.', true);
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showToast('Network error updating password.', true);
  }
}

// ADDRESS BOOK CRUD
window.toggleAddressForm = function() {
  const container = document.getElementById('address-form-container');
  const btn = document.getElementById('btn-add-address');
  const form = document.getElementById('address-form');

  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.textContent = 'Cancel';
    form.reset();
    document.getElementById('address-id').value = '';
    document.getElementById('address-form-title').textContent = 'Create New Address';
  } else {
    container.style.display = 'none';
    btn.textContent = '+ Add New Address';
  }
};

async function fetchAddresses() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/addresses`, { headers: getAuthHeaders() });
    const data = await res.json();
    userAddresses = data;
    renderAddressesList(data);
  } catch (err) {
    console.error(err);
    showToast('Failed to load address book.', true);
  }
}

function renderAddressesList(addresses) {
  const container = document.getElementById('addresses-list-container');
  if (!addresses || addresses.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dark); padding: 4rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📍</div>
        <h4>No shipping addresses configured.</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Add a destination to streamline the checkout process.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = addresses.map(addr => {
    return `
      <div class="info-card">
        <div class="info-card-actions">
          <button onclick="editAddress('${addr.id}')" style="cursor: pointer; font-size: 0.8rem; color: var(--accent-emerald); font-weight: 600;">EDIT</button>
          <button onclick="deleteAddress('${addr.id}')" style="cursor: pointer; font-size: 0.8rem; color: #ef4444; font-weight: 600;">DELETE</button>
        </div>
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.5rem; color: var(--text-white);">${addr.name}</div>
        <div style="font-size: 0.9rem; color: var(--text-muted); display:flex; flex-direction:column; gap:0.25rem;">
          <div>${addr.street}</div>
          <div>${addr.city}, ${addr.state} ${addr.zip}</div>
          <div>${addr.country}</div>
          <div style="margin-top:0.4rem; color: var(--text-dark);">📞 ${addr.phone}</div>
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge badge-type">${addr.type}</span>
          ${addr.isDefaultShipping ? `<span class="badge badge-shipping">Default Shipping</span>` : ''}
          ${addr.isDefaultBilling ? `<span class="badge badge-billing">Default Billing</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

async function handleAddressSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('address-id').value;
  const name = document.getElementById('address-name').value.trim();
  const phone = document.getElementById('address-phone').value.trim();
  const street = document.getElementById('address-street').value.trim();
  const city = document.getElementById('address-city').value.trim();
  const state = document.getElementById('address-state').value.trim();
  const zip = document.getElementById('address-zip').value.trim();
  const country = document.getElementById('address-country').value.trim();
  const type = document.getElementById('address-type').value;
  const isDefaultShipping = document.getElementById('address-default-shipping').checked;
  const isDefaultBilling = document.getElementById('address-default-billing').checked;

  const payload = { name, phone, street, city, state, zip, country, type, isDefaultShipping, isDefaultBilling };

  try {
    const url = id ? `${API_BASE}/api/auth/addresses/${id}` : `${API_BASE}/api/auth/addresses`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(id ? 'Address edited successfully!' : 'Address added successfully!');
      toggleAddressForm();
      fetchAddresses();
    } else {
      showToast(data.message || 'Failed to save address.', true);
    }
  } catch (error) {
    console.error(error);
    showToast('Network error saving address.', true);
  }
}

window.editAddress = function(id) {
  const addr = userAddresses.find(a => a.id === id);
  if (!addr) return;

  toggleAddressForm(); // Ensure form is open
  document.getElementById('address-form-title').textContent = 'Edit Saved Address';
  
  document.getElementById('address-id').value = addr.id;
  document.getElementById('address-name').value = addr.name;
  document.getElementById('address-phone').value = addr.phone;
  document.getElementById('address-street').value = addr.street;
  document.getElementById('address-city').value = addr.city;
  document.getElementById('address-state').value = addr.state;
  document.getElementById('address-zip').value = addr.zip;
  document.getElementById('address-country').value = addr.country;
  document.getElementById('address-type').value = addr.type;
  document.getElementById('address-default-shipping').checked = !!addr.isDefaultShipping;
  document.getElementById('address-default-billing').checked = !!addr.isDefaultBilling;

  document.getElementById('address-form-container').scrollIntoView({ behavior: 'smooth' });
};

window.deleteAddress = async function(id) {
  if (!confirm('Delete this shipping address?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/auth/addresses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast('Address deleted.');
      fetchAddresses();
    } else {
      showToast(data.message || 'Failed to delete address.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Error removing address.', true);
  }
};

// PAYMENT METHOD OPTIONS CRUD
window.togglePaymentForm = function() {
  const container = document.getElementById('payment-form-container');
  const btn = document.getElementById('btn-add-payment');
  const form = document.getElementById('payment-form');

  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.textContent = 'Cancel';
    form.reset();
  } else {
    container.style.display = 'none';
    btn.textContent = '+ Add New Card';
  }
};

async function fetchPayments() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/payments`, { headers: getAuthHeaders() });
    const data = await res.json();
    userPayments = data;
    renderPaymentsList(data);
  } catch (err) {
    console.error(err);
    showToast('Failed to load card methods.', true);
  }
}

function renderPaymentsList(payments) {
  const container = document.getElementById('payments-list-container');
  if (!payments || payments.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dark); padding: 2rem 0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💳</div>
        <h4>No payment methods configured.</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Save a card to complete checkout in one click.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = payments.map(card => {
    const cardIcon = card.brand === 'Visa' ? '💳 Visa' : card.brand === 'Mastercard' ? '💳 Mastercard' : '💳 Card';
    return `
      <div class="info-card" style="border-left: 4px solid var(--accent-emerald);">
        <div class="info-card-actions">
          <button onclick="deletePayment('${card.id}')" style="cursor: pointer; font-size: 0.8rem; color: #ef4444; font-weight: 600;">REMOVE</button>
        </div>
        <div style="font-weight: 700; font-size: 1rem; color: var(--text-white); margin-bottom: 0.4rem;">${cardIcon}</div>
        <div style="font-family: monospace; font-size: 1.1rem; letter-spacing: 0.1em; color: var(--text-white); margin-bottom: 0.6rem;">
          ${card.maskedNumber}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
          <span>Holder: ${card.cardholderName}</span>
          <span>Expires: ${card.expiryDate}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const cardholderName = document.getElementById('card-holder').value.trim();
  const cardNumber = document.getElementById('card-number').value.replace(/\s+/g, '');
  const expiryDate = document.getElementById('card-expiry').value.trim();
  const cvv = document.getElementById('card-cvv').value.trim();

  if (cardNumber.length < 13) {
    showToast('Invalid card number.', true);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ cardholderName, cardNumber, expiryDate, cvv })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Payment method saved!');
      togglePaymentForm();
      fetchPayments();
    } else {
      showToast(data.message || 'Failed to save card.', true);
    }
  } catch (error) {
    console.error(error);
    showToast('Network error saving card details.', true);
  }
}

window.deletePayment = async function(id) {
  if (!confirm('Remove this saved card?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/auth/payments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      showToast('Card removed.');
      fetchPayments();
    } else {
      showToast(data.message || 'Failed to remove card.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Error removing card.', true);
  }
};

// ORDER HISTORY & DETAILS
async function fetchOrdersHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/orders/user`, { headers: getAuthHeaders() });
    const orders = await res.json();
    userOrders = orders;
    renderOrdersTable(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    showToast('Failed to load order history.', true);
  }
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('orders-table-body');
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-dark); padding: 4rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
          <h4>No purchases placed yet.</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;"><a href="shop.html" class="emerald-link" style="text-decoration:underline;">Start browsing catalog</a></p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const statusClass = o.status.toLowerCase();

    return `
      <tr>
        <td style="font-weight: 600; color: var(--text-white);">${o.id}</td>
        <td>${dateStr}</td>
        <td style="text-transform: uppercase;">${o.paymentMethod.replace('-', ' ')}</td>
        <td style="font-weight: 600; color: var(--accent-emerald);">$${o.total.toFixed(2)}</td>
        <td>
          <span class="status-badge ${statusClass}">${o.status}</span>
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-radius: var(--radius-sm);" onclick="openOrderDetails('${o.id}')">View Details</button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

// VIEW ORDER DETAILS MODAL
window.openOrderDetails = function(orderId) {
  const o = userOrders.find(order => order.id === orderId);
  if (!o) {
    showToast('Order details not found.', true);
    return;
  }

  document.getElementById('modal-order-id').textContent = o.id;

  const itemsList = document.getElementById('modal-items-list');
  itemsList.innerHTML = o.items.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div style="display:flex; gap:1rem; align-items:center;">
        <img src="${item.image}" alt="${item.name}" style="width:45px; height:45px; object-fit:cover; border-radius:4px; background:var(--bg-secondary);">
        <div>
          <div style="font-weight:600; color:var(--text-white); font-size:0.9rem;">${item.name}</div>
          <span style="font-size:0.8rem; color:var(--text-muted);">Qty: ${item.quantity} @ $${item.price.toFixed(2)}</span>
        </div>
      </div>
      <span style="font-weight:600; color:var(--accent-emerald); font-size:0.95rem;">$${(item.price * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  // Shipping destination
  const addressBlock = document.getElementById('modal-address-block');
  const sh = o.shippingAddress;
  if (sh) {
    addressBlock.innerHTML = `
      <div style="font-weight:600; color:var(--text-white);">${sh.name}</div>
      <div>${sh.street}</div>
      <div>${sh.city}, ${sh.state} ${sh.zip}</div>
      <div>${sh.country}</div>
      <div style="margin-top:0.2rem; color:var(--text-dark);">📞 ${sh.phone}</div>
    `;
  } else {
    addressBlock.textContent = 'No shipping address provided.';
  }

  // Financial summary
  const subtotal = o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  document.getElementById('modal-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('modal-shipping').textContent = `$${(o.shippingCost || 0).toFixed(2)}`;

  const discountRow = document.getElementById('modal-discount-row');
  if (o.discount && o.discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('modal-discount').textContent = `-$${o.discount.toFixed(2)}`;
  } else {
    discountRow.style.display = 'none';
  }
  document.getElementById('modal-total').textContent = `$${o.total.toFixed(2)}`;

  // Actions panel
  const actionsPanel = document.getElementById('modal-actions-panel');
  if (o.status === 'Pending') {
    actionsPanel.innerHTML = `
      <button class="btn btn-danger" onclick="cancelUserOrder('${o.id}')">Cancel Order</button>
    `;
  } else {
    actionsPanel.innerHTML = `
      <span style="font-size:0.85rem; color:var(--text-dark); font-weight:600; display:flex; align-items:center; gap:0.5rem;">
        Status: <span class="status-badge ${o.status.toLowerCase()}">${o.status}</span>
      </span>
    `;
  }

  document.getElementById('order-details-modal').classList.add('show');
};

window.closeOrderModal = function() {
  document.getElementById('order-details-modal').classList.remove('show');
};

// CANCELLATIONS TAB
async function fetchCancellations() {
  try {
    const res = await fetch(`${API_BASE}/api/orders/user`, { headers: getAuthHeaders() });
    const orders = await res.json();
    userOrders = orders;
    const cancelled = orders.filter(o => o.status === 'Cancelled');
    renderCancellations(cancelled);
  } catch (err) {
    console.error(err);
    showToast('Failed to load cancelled orders.', true);
  }
}

function renderCancellations(cancelledOrders) {
  const container = document.getElementById('cancellations-container');
  if (cancelledOrders.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dark); padding: 4rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🚫</div>
        <h4>No cancellations found.</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">Orders cancelled by you or admin will show up here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = cancelledOrders.map(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="cancellation-card">
        <div class="cancellation-header">
          <div>
            <span style="font-size:0.85rem; color: var(--text-dark);">Cancelled Date: <strong>${dateStr}</strong></span>
            <div style="font-weight:700; color: var(--text-white); font-size: 1.05rem; margin-top:0.2rem;">Order #${o.id}</div>
          </div>
          <span class="status-badge cancelled" style="align-self: center;">Cancelled</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          ${o.items.map(item => `
            <div class="cancellation-item">
              <div style="display:flex; gap:1rem; align-items:center;">
                <img src="${item.image}" alt="${item.name}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:var(--bg-secondary);">
                <div>
                  <div style="font-size:0.9rem; font-weight:600; color: var(--text-white);">${item.name}</div>
                  <span style="font-size:0.8rem; color: var(--text-muted);">Qty: ${item.quantity}</span>
                </div>
              </div>
              <span style="font-weight:600; font-size:0.9rem; color: var(--accent-emerald);">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div style="display:flex; justify-content:flex-end; border-top:1px solid var(--border-color); padding-top:0.8rem; margin-top:0.8rem;">
          <button class="btn btn-secondary" onclick="openOrderDetails('${o.id}')" style="padding:0.4rem 1rem; font-size:0.8rem;">More Details</button>
        </div>
      </div>
    `;
  }).join('');
}

// User triggering a cancellation for their own pending order
window.cancelUserOrder = async function(orderId) {
  if (!confirm('Are you absolutely sure you want to cancel this order? This action is irreversible.')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Order ${orderId} has been cancelled.`);
      closeOrderModal();
      fetchOrdersHistory(); // Reload orders history table
    } else {
      showToast(data.message || 'Failed to cancel order.', true);
    }
  } catch (error) {
    console.error('Cancellation error:', error);
    showToast('Network error. Unable to cancel order.', true);
  }
};

// REVIEWS & FEEDBACK DASHBOARD
window.switchReviewSubtab = function(pane) {
  const tabToBe = document.getElementById('subtab-to-be-reviewed');
  const tabHist = document.getElementById('subtab-review-history');
  const paneToBe = document.getElementById('pane-to-be-reviewed');
  const paneHist = document.getElementById('pane-review-history');

  tabToBe.classList.remove('active');
  tabHist.classList.remove('active');
  paneToBe.style.display = 'none';
  paneHist.style.display = 'none';

  if (pane === 'to-be-reviewed') {
    tabToBe.classList.add('active');
    paneToBe.style.display = 'block';
  } else {
    tabHist.classList.add('active');
    paneHist.style.display = 'block';
  }
};

async function fetchReviewsDashboard() {
  try {
    const user = getLoggedInUser();
    
    // Fetch products catalog and user orders
    const productsRes = await fetch(`${API_BASE}/api/products`);
    const catalog = await productsRes.json();

    const ordersRes = await fetch(`${API_BASE}/api/orders/user`, { headers: getAuthHeaders() });
    const orders = await ordersRes.json();
    userOrders = orders;

    // Collect all purchased unique products
    const purchasedProducts = [];
    const seenProductIds = new Set();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (!seenProductIds.has(item.productId)) {
          seenProductIds.add(item.productId);
          // Find full catalog product details
          const dbProduct = catalog.find(p => p.id === item.productId);
          if (dbProduct) {
            purchasedProducts.push({
              id: dbProduct.id,
              name: dbProduct.name,
              image: dbProduct.image,
              category: dbProduct.category,
              purchaseDate: new Date(order.createdAt).toLocaleDateString(),
              reviews: dbProduct.reviews || []
            });
          }
        }
      });
    });

    // Segment into "To Be Reviewed" vs "History"
    const toBeReviewed = [];
    const reviewHistory = [];

    purchasedProducts.forEach(product => {
      // Find reviews left by this user
      const userReview = product.reviews.find(r => r.userId === user.id || r.reviewer === user.name);
      if (userReview) {
        reviewHistory.push({
          productId: product.id,
          productName: product.name,
          productImage: product.image,
          rating: userReview.rating,
          comment: userReview.comment,
          date: userReview.date
        });
      } else {
        toBeReviewed.push(product);
      }
    });

    renderToBeReviewedList(toBeReviewed);
    renderReviewHistoryList(reviewHistory);

  } catch (err) {
    console.error(err);
    showToast('Failed to load reviews dashboard.', true);
  }
}

function renderToBeReviewedList(toBeReviewed) {
  const container = document.getElementById('to-be-reviewed-list');
  const countBadge = document.getElementById('subtab-to-be-reviewed');
  countBadge.textContent = `To Be Reviewed (${toBeReviewed.length})`;

  if (toBeReviewed.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dark); padding: 4rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👍</div>
        <h4>All items reviewed!</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">You have shared reviews for all items in your orders.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = toBeReviewed.map(p => {
    return `
      <div class="cancellation-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; gap:1.2rem; align-items:center;">
          <img src="${p.image}" alt="${p.name}" style="width:55px; height:55px; object-fit:cover; border-radius:6px; background:var(--bg-secondary);">
          <div>
            <div style="font-weight:700; color: var(--text-white); font-size:1rem;">${p.name}</div>
            <div style="font-size:0.8rem; color: var(--text-muted); margin-top:0.15rem;">Purchased on ${p.purchaseDate}</div>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openReviewModal('${p.id}', '${p.name.replace(/'/g, "\\'")}', '${p.image}')" style="padding:0.5rem 1.2rem; font-size:0.85rem;">Write Review</button>
      </div>
    `;
  }).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

function renderReviewHistoryList(history) {
  const container = document.getElementById('review-history-list');
  const countBadge = document.getElementById('subtab-review-history');
  countBadge.textContent = `History (${history.length})`;

  if (history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dark); padding: 4rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✍️</div>
        <h4>No reviews submitted yet.</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">When you write feedback on your purchased items, they will show up here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.map(r => {
    const stars = '⭐'.repeat(Math.round(r.rating));
    const dateStr = new Date(r.date).toLocaleDateString();
    return `
      <div class="cancellation-card">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:0.8rem; margin-bottom:0.8rem;">
          <div style="display:flex; gap:1rem; align-items:center; cursor:pointer;" onclick="window.location.href='product.html?id=${r.productId}'">
            <img src="${r.productImage}" alt="${r.productName}" style="width:40px; height:40px; object-fit:cover; border-radius:4px; background:var(--bg-secondary);">
            <div style="font-weight:600; color: var(--text-white); font-size:0.95rem;">${r.productName}</div>
          </div>
          <span style="font-size:0.8rem; color: var(--text-dark);">${dateStr}</span>
        </div>
        <div style="font-size: 1.1rem; margin-bottom:0.4rem; color: #fbbf24;">${stars}</div>
        <p style="color: var(--text-muted); font-size:0.9rem; font-style:italic;">"${r.comment}"</p>
      </div>
    `;
  }).join('');
}

window.openReviewModal = function(id, name, img) {
  document.getElementById('review-product-id').value = id;
  document.getElementById('review-product-name').textContent = name;
  document.getElementById('review-product-img').src = img;
  document.getElementById('dashboard-review-form').reset();
  document.getElementById('review-submission-modal').classList.add('show');
};

window.closeReviewModal = function() {
  document.getElementById('review-submission-modal').classList.remove('show');
};

async function handleReviewSubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('review-product-id').value;
  const rating = document.getElementById('dashboard-review-rating').value;
  const comment = document.getElementById('dashboard-review-comment').value.trim();

  if (!comment) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating, comment })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Thank you! Review saved successfully.');
      closeReviewModal();
      fetchReviewsDashboard();
    } else {
      showToast(data.message || 'Failed to submit review.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Network error saving review.', true);
  }
}

// WISHLIST TAB
async function fetchWishlist() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/wishlist`, { headers: getAuthHeaders() });
    const data = await res.json();
    userWishlist = data;
    renderWishlist(data);
  } catch (err) {
    console.error(err);
    showToast('Failed to load wishlist.', true);
  }
}

function renderWishlist(products) {
  const container = document.getElementById('wishlist-grid-container');
  if (!products || products.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dark); padding: 4rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">❤️</div>
        <h4>Your wishlist is empty.</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;"><a href="shop.html" class="emerald-link" style="text-decoration:underline;">Browse catalog</a> to save items here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(p => {
    const isOutOfStock = p.stock === 0;
    return `
      <div class="wishlist-card">
        <div class="wishlist-img-wrapper" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer;">
          <img src="${p.image}" alt="${p.name}" class="wishlist-img">
        </div>
        <div class="wishlist-details">
          <div style="font-size:0.75rem; color: var(--text-dark); text-transform:uppercase; font-weight:700;">${p.category}</div>
          <h4 style="font-size:0.9rem; font-weight:600; color: var(--text-white); margin:0.3rem 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer;" onclick="window.location.href='product.html?id=${p.id}'">
            ${p.name}
          </h4>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.5rem;">
            <span style="font-weight:700; color: var(--accent-emerald); font-size:1rem;">$${p.price.toFixed(2)}</span>
            <span style="font-size:0.75rem; font-weight:600; color: ${isOutOfStock ? '#ef4444' : '#10b981'};">
              ${isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </span>
          </div>
          <div style="margin-top:1rem; display:flex; gap:0.5rem;">
            <button class="btn btn-primary" onclick="wishlistToCart('${p.id}')" style="flex-grow:1; padding:0.4rem; font-size:0.8rem;" ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
              🛒 Add to Cart
            </button>
            <button onclick="removeFromWishlist('${p.id}')" style="border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.4rem 0.6rem; color:#ef4444; cursor:pointer; font-weight:bold;" title="Remove">
              &times;
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.initScrollAnimations) window.initScrollAnimations();
}

window.wishlistToCart = function(productId) {
  const p = userWishlist.find(item => item.id === productId);
  if (!p) return;

  // Add to cart utility (defined globally in app.js)
  addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    category: p.category
  }, 1);

  // Remove from wishlist
  removeFromWishlist(productId, false); // silent removal
};

window.removeFromWishlist = async function(productId, showMessage = true) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/wishlist/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      if (showMessage) showToast('Removed from wishlist.');
      fetchWishlist();
      if (window.updateWishlistBadge) window.updateWishlistBadge();
    } else {
      showToast(data.message || 'Failed to remove from wishlist.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Error removing item from wishlist.', true);
  }
};
