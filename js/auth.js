/**
 * HCM Lite - Authentication & Access Guard
 * Role-based access control (Admin / Employee)
 */

const Auth = {
  /**
   * Guards a page based on role requirement:
   * @param {'admin'|'employee'|'any'} requiredRole
   */
  guard(requiredRole = 'any') {
    // 1. Check if first-run setup is done
    if (!Storage.isSetupComplete()) {
      // If setup is not done and we're not already on index.html, redirect
      if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
        window.location.href = 'index.html';
        return null;
      }
      return null;
    }

    // 2. Check active session
    const session = Storage.getSession();
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    if (!session) {
      if (!isIndexPage) {
        window.location.href = 'index.html';
      }
      return null;
    }

    // If logged in and on index.html, redirect to appropriate dashboard
    if (isIndexPage) {
      if (session.role === 'admin') {
        window.location.href = 'admin.html';
      } else {
        window.location.href = 'employee.html';
      }
      return session;
    }

    // 3. Role enforcement
    // "If an Employee opens an Admin page, send them back to their own dashboard."
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

    // Hook logout buttons
    document.querySelectorAll('.js-logout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to log out?')) {
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
