// Account Access Tab Control & Form Submission

// Check if user is already logged in, redirect them
document.addEventListener('DOMContentLoaded', () => {
  const user = getLoggedInUser();
  if (user) {
    if (user.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }
});

// Switch Tabs handler
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

// Handle Sign In submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('novacart_token', data.token);
      localStorage.setItem('novacart_user', JSON.stringify(data.user));
      showToast('Welcome back to NovaCart!');
      
      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          // If we had a redirect path from checkout, go back to checkout
          const params = new URLSearchParams(window.location.search);
          const redirect = params.get('redirect');
          if (redirect) {
            window.location.href = redirect;
          } else {
            window.location.href = 'dashboard.html';
          }
        }
      }, 1000);
    } else {
      showToast(data.message || 'Login failed. Please verify credentials.', true);
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast('Network error. Unable to connect to server.', true);
  }
});

// Handle Registration submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('novacart_token', data.token);
      localStorage.setItem('novacart_user', JSON.stringify(data.user));
      showToast('Registration successful! Welcome.');
      
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'Registration failed.', true);
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Network error. Unable to register account.', true);
  }
});
