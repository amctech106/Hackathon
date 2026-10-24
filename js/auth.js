/**
 * AMC Tech - Authentication & Role Access Guard
 * Role-based access control (Admin / Employee)
 */

const Auth = {
  // Page authentication and role permission guard
  guard(requiredRole = 'any') {
    // 1. Verify company profile setup
    if (!Storage.isSetupComplete()) {
      if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
        return null;
      }
      return null;
    }

    // 2. Verify active user session
    const session = Storage.getSession();
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    if (!session) {
      if (!isIndexPage) {
        window.location.href = 'index.html';
      }
      return null;
    }

    // If already logged in and visiting index.html, redirect to appropriate workspace
    if (isIndexPage) {
      if (session.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'employee.html';
      }
      return session;
    }

    // 3. Role route enforcement: redirect unauthorized roles to their respective dashboard
    if (requiredRole === 'admin' && session.role !== 'admin') {
      window.location.href = 'employee.html';
      return null;
    }

    return session;
  },

  login(email, password) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const user = Storage.getUserByEmail(email);
    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (user.password !== password) {
      throw new Error('Invalid password. Please check and try again.');
    }

    // Set active session
    Storage.setSession(user);
    return user;
  },

  logout() {
    Storage.clearSession();
    window.location.href = 'index.html';
  },

  getCurrentUser() {
    return Storage.getSession();
  },

  changePassword(oldPassword, newPassword) {
    const session = this.getCurrentUser();
    if (!session) throw new Error('You must be logged in.');

    const user = Storage.getUserById(session.id);
    if (!user || user.password !== oldPassword) {
      throw new Error('Current password does not match.');
    }

    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }

    Storage.updateUser(session.id, { password: newPassword });
    return true;
  },

  /**
   * Injects header/sidebar user profile info and hooks logout
   */
  initUI() {
    const user = this.getCurrentUser();
    if (!user) return;

    // Set user names
    document.querySelectorAll('.js-user-name').forEach(el => {
      el.textContent = user.name;
    });

    // Set user emails
    document.querySelectorAll('.js-user-email').forEach(el => {
      el.textContent = user.email;
    });

    // Set user role badge
    document.querySelectorAll('.js-user-role').forEach(el => {
      el.textContent = user.role === 'admin' ? 'Administrator' : (user.designation || 'Employee');
    });

    // Set user initials avatar
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    document.querySelectorAll('.js-user-avatar').forEach(el => {
      el.textContent = initials;
    });

    // Company name
    const company = Storage.getCompany();
    if (company) {
      document.querySelectorAll('.js-company-name').forEach(el => {
        el.textContent = company.name;
      });
    }

    // Hook logout buttons with custom CSS modal
    document.querySelectorAll('.js-logout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof showConfirm === 'function') {
          showConfirm('Are you sure you want to sign out of your AMC Tech workspace?', {
            title: 'Sign Out Confirmation',
            type: 'warning',
            confirmText: 'Sign Out',
            cancelText: 'Stay Logged In',
            onConfirm: () => {
              if (window.Toast) Toast.info('Signing out...');
              setTimeout(() => {
                Auth.logout();
              }, 600);
            }
          });
        } else if (confirm('Are you sure you want to log out?')) {
          Auth.logout();
        }
      });
    });

    // Theme toggle initialization
    this.initTheme();
  },

  initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    const themeToggleBtn = document.getElementById('btn-theme-toggle');
    if (themeToggleBtn) {
      this.updateThemeIcon(savedTheme);
      themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        this.updateThemeIcon(theme);
      });
    }
  },

  updateThemeIcon(theme) {
    const icon = document.querySelector('#btn-theme-toggle i');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }
};

window.Auth = Auth;
