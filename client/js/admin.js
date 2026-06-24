// Admin Panel Control Center Script

let adminProducts = [];
let adminOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  // Validate authorization
  const user = getLoggedInUser();
  if (!user || user.role !== 'admin') {
    showToast('Unauthorized access. Admin privileges required.', true);
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1200);
    return;
  }

  // Load KPI overview analytics first
  fetchKpiAnalytics();

  // Add Coupon form submit handler
  document.getElementById('add-coupon-form').addEventListener('submit', handleAddCoupon);

  // Add/Edit Product CRUD form handler
  document.getElementById('product-crud-form').addEventListener('submit', handleProductCrudSubmit);
});

// Switch Tab Menu panes
window.switchAdminTab = function(tab) {
  const menuAnalytics = document.getElementById('menu-analytics');
  const menuProducts = document.getElementById('menu-products');
  const menuOrders = document.getElementById('menu-orders');
  const menuCoupons = document.getElementById('menu-coupons');

  const panelAnalytics = document.getElementById('panel-analytics');
  const panelProducts = document.getElementById('panel-products');
  const panelOrders = document.getElementById('panel-orders');
  const panelCoupons = document.getElementById('panel-coupons');

  menuAnalytics.classList.remove('active');
  menuProducts.classList.remove('active');
  menuOrders.classList.remove('active');
  menuCoupons.classList.remove('active');

  panelAnalytics.classList.remove('active');
  panelProducts.classList.remove('active');
  panelOrders.classList.remove('active');
  panelCoupons.classList.remove('active');

  if (tab === 'analytics') {
    menuAnalytics.classList.add('active');
    panelAnalytics.classList.add('active');
    fetchKpiAnalytics();
  } else if (tab === 'products') {
    menuProducts.classList.add('active');
    panelProducts.classList.add('active');
    fetchAdminProducts();
  } else if (tab === 'orders') {
    menuOrders.classList.add('active');
    panelOrders.classList.add('active');
    fetchAdminOrders();
  } else if (tab === 'coupons') {
    menuCoupons.classList.add('active');
    panelCoupons.classList.add('active');
    fetchAdminCoupons();
  }
};

// ----------------------------------------------------
// 1. KPI Analytics Overview Panel
// ----------------------------------------------------
async function fetchKpiAnalytics() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/kpis`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      const grossTotal = data.kpis.revenue;
      
      // Set metrics values
      document.getElementById('kpi-revenue').textContent = `$${grossTotal.toFixed(2)}`;
      document.getElementById('kpi-sales').textContent = data.kpis.salesCount;
      document.getElementById('kpi-products').textContent = data.kpis.products;
      document.getElementById('kpi-customers').textContent = data.kpis.customers;

      // Render category progress contribution list
      const catSales = data.categorySales;
      const catContainer = document.getElementById('kpi-category-sales');
      if (Object.keys(catSales).length === 0) {
        catContainer.innerHTML = '<tr><td colspan="3" style="color:var(--text-dark); text-align:center;">No purchases tracked.</td></tr>';
      } else {
        catContainer.innerHTML = Object.keys(catSales).map(cat => {
          const amount = catSales[cat];
          const percent = grossTotal > 0 ? (amount / grossTotal) * 100 : 0;
          return `
            <tr>
              <td style="font-weight:600; color:var(--text-white);">${cat}</td>
              <td>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
              </td>
              <td style="text-align:right; font-weight:700; color:var(--accent-emerald);">$${amount.toFixed(2)}</td>
            </tr>
          `;
        }).join('');
      }

      // Render recent activity feed list
      const rec = data.recentOrders;
      const recContainer = document.getElementById('recent-orders-list');
      if (rec.length === 0) {
        recContainer.innerHTML = '<tr><td colspan="4" style="color:var(--text-dark); text-align:center;">No recent transactions.</td></tr>';
      } else {
        recContainer.innerHTML = rec.map(o => `
          <tr>
            <td style="font-weight:600;">${o.id}</td>
            <td>${o.userName}</td>
            <td style="font-weight:600; color:var(--accent-emerald);">$${o.total.toFixed(2)}</td>
            <td><span class="status-badge ${o.status.toLowerCase()}" style="font-size:0.7rem; padding:0.2rem 0.5rem;">${o.status}</span></td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading admin analytics:', error);
    showToast('Failed to pull analytics KPIs.', true);
  }
}

// ----------------------------------------------------
// 2. Product Catalog CRUD Panel
// ----------------------------------------------------
async function fetchAdminProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();
    adminProducts = products;
    renderAdminProductsTable(products);
  } catch (error) {
    console.error('Error fetching admin products:', error);
    showToast('Failed to load catalog inventory.', true);
  }
}

function renderAdminProductsTable(products) {
  const tbody = document.getElementById('admin-products-tbody');
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-dark); padding:3rem;">No products found. Add a product to get started.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}" style="width:45px; height:45px; object-fit:cover; border-radius:4px; background:var(--bg-secondary);"></td>
      <td style="font-weight:600; color:var(--text-white); white-space:normal; max-width:220px;">${p.name}</td>
      <td>${p.category}</td>
      <td style="font-weight:600; color:var(--accent-emerald);">$${p.price.toFixed(2)}</td>
      <td style="font-weight:600; color:${p.stock === 0 ? '#ef4444' : '#fff'};">${p.stock} units</td>
      <td style="text-align:center;">
        <div style="display:flex; gap:0.5rem; justify-content:center;">
          <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:var(--radius-sm);" onclick="openProductModal(true, '${p.id}')">Edit</button>
          <button class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:var(--radius-sm);" onclick="deleteProduct('${p.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Delete item
window.deleteProduct = async function(productId) {
  if (!confirm('Are you sure you want to delete this product from the inventory database?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      showToast('Product deleted successfully.');
      fetchAdminProducts();
    } else {
      showToast(data.message || 'Deletion failed.', true);
    }
  } catch (error) {
    console.error('Delete product error:', error);
    showToast('Failed to connect to catalog database.', true);
  }
};

// Open Add/Edit form overlay
window.openProductModal = function(isEdit = false, id = null) {
  const modal = document.getElementById('product-crud-modal');
  const title = document.getElementById('product-modal-title');
  const submitBtn = document.getElementById('crud-submit-btn');
  const form = document.getElementById('product-crud-form');
  
  form.reset();
  
  if (isEdit && id) {
    const product = adminProducts.find(p => p.id === id);
    if (!product) return;
    
    title.textContent = 'Modify Product Details';
    submitBtn.textContent = 'Apply Modifications';
    
    // Fill values
    document.getElementById('crud-product-id').value = product.id;
    document.getElementById('crud-name').value = product.name;
    document.getElementById('crud-price').value = product.price;
    document.getElementById('crud-stock').value = product.stock;
    document.getElementById('crud-category').value = product.category;
    document.getElementById('crud-image').value = product.image;
    document.getElementById('crud-desc').value = product.description;
    document.getElementById('crud-isfeatured').checked = product.isFeatured || false;
    document.getElementById('crud-variants').value = product.variants ? product.variants.join(', ') : '';
  } else {
    title.textContent = 'Add New Product';
    submitBtn.textContent = 'Create Product Card';
    document.getElementById('crud-product-id').value = '';
  }

  modal.classList.add('show');
};

window.closeProductModal = function() {
  document.getElementById('product-crud-modal').classList.remove('show');
};

// Crud Form Submit handler
async function handleProductCrudSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('crud-product-id').value;
  const isEdit = id !== '';
  
  const payload = {
    name: document.getElementById('crud-name').value.trim(),
    price: parseFloat(document.getElementById('crud-price').value),
    stock: parseInt(document.getElementById('crud-stock').value),
    category: document.getElementById('crud-category').value,
    image: document.getElementById('crud-image').value.trim(),
    description: document.getElementById('crud-desc').value.trim(),
    isFeatured: document.getElementById('crud-isfeatured').checked,
    variants: document.getElementById('crud-variants').value.trim()
  };

  const url = isEdit ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      showToast(isEdit ? 'Product details updated successfully!' : 'New product created successfully!');
      closeProductModal();
      fetchAdminProducts();
    } else {
      showToast(data.message || 'Saving details failed.', true);
    }
  } catch (error) {
    console.error('CRUD product save error:', error);
    showToast('Failed to save product information.', true);
  }
}

// ----------------------------------------------------
// 3. Customer Orders Ledger Panel
// ----------------------------------------------------
async function fetchAdminOrders() {
  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: getAuthHeaders()
    });
    const orders = await res.json();
    adminOrders = orders;
    renderAdminOrdersTable(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    showToast('Failed to pull order logs.', true);
  }
}

function renderAdminOrdersTable(orders) {
  const tbody = document.getElementById('admin-orders-tbody');
  
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-dark); padding:3rem;">No order ledger entries recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <tr>
        <td style="font-weight:600;">${o.id}</td>
        <td>${o.userName}</td>
        <td>${dateStr}</td>
        <td style="font-weight:600; color:var(--accent-emerald);">$${o.total.toFixed(2)}</td>
        <td>
          <span class="status-badge ${o.status.toLowerCase()}" id="status-display-${o.id}">${o.status}</span>
        </td>
        <td style="text-align:center;">
          <select class="form-input" style="background:var(--bg-secondary); padding:0.3rem 0.5rem; font-size:0.85rem; border-radius:var(--radius-sm);" 
                  onchange="updateOrderStatus('${o.id}', this.value)" aria-label="Fulfillment Status Select">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

// Order status change call
window.updateOrderStatus = async function(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Order status updated to ${newStatus}`);
      
      const display = document.getElementById(`status-display-${orderId}`);
      if (display) {
        display.className = `status-badge ${newStatus.toLowerCase()}`;
        display.textContent = newStatus;
      }
    } else {
      showToast(data.message || 'Status update failed.', true);
    }
  } catch (error) {
    console.error('Status edit error:', error);
    showToast('Failed to connect to orders records.', true);
  }
};

// ----------------------------------------------------
// 4. Coupons Management Panel
// ----------------------------------------------------
async function fetchAdminCoupons() {
  try {
    const res = await fetch(`${API_BASE}/api/coupons`, {
      headers: getAuthHeaders()
    });
    const coupons = await res.json();
    renderAdminCouponsTable(coupons);
  } catch (error) {
    console.error('Error fetching admin coupons:', error);
    showToast('Failed to pull coupon codes.', true);
  }
}

function renderAdminCouponsTable(coupons) {
  const tbody = document.getElementById('admin-coupons-tbody');
  
  if (coupons.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-dark); padding:2rem;">No discount coupons configured.</td></tr>';
    return;
  }

  tbody.innerHTML = coupons.map(c => `
    <tr>
      <td style="font-weight:700; color:var(--text-white); font-family:monospace;">${c.code}</td>
      <td>-${c.type === 'percentage' ? c.value + '%' : '$' + c.value}</td>
      <td>$${c.minPurchase.toFixed(2)}</td>
      <td style="text-align:center;">
        <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.8rem; border-radius:var(--radius-sm);" onclick="deleteCoupon('${c.id}')">Remove</button>
      </td>
    </tr>
  `).join('');
}

// Generate promo key
async function handleAddCoupon(e) {
  e.preventDefault();

  const payload = {
    code: document.getElementById('coupon-input-code').value.trim().toUpperCase(),
    type: document.getElementById('coupon-input-type').value,
    value: parseFloat(document.getElementById('coupon-input-value').value),
    minPurchase: parseFloat(document.getElementById('coupon-input-min').value || 0)
  };

  try {
    const res = await fetch(`${API_BASE}/api/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      showToast(`Promo coupon ${payload.code} created successfully!`);
      document.getElementById('add-coupon-form').reset();
      fetchAdminCoupons();
    } else {
      showToast(data.message || 'Coupon generation failed.', true);
    }
  } catch (error) {
    console.error('Add coupon error:', error);
    showToast('Failed to register promo coupon.', true);
  }
}

// Remove Coupon code
window.deleteCoupon = async function(couponId) {
  if (!confirm('Are you sure you want to deactivate this coupon code?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/coupons/${couponId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      showToast('Coupon deleted successfully.');
      fetchAdminCoupons();
    } else {
      showToast(data.message || 'Failed to delete coupon.', true);
    }
  } catch (error) {
    console.error('Delete coupon error:', error);
    showToast('Failed to connect to coupon database.', true);
  }
};
