// ==============================================================================
// 🔐 AUTHENTICATION LOGIC (SUPABASE)
// ==============================================================================

// Helper to reliably get the active Supabase client instance
function getClient() {
  if (window.supabaseClient) {
    return window.supabaseClient;
  }
  if (typeof supabaseClient !== 'undefined' && supabaseClient) {
    return supabaseClient;
  }
  // Try fallback initialization if CDN is present
  if (typeof supabase !== 'undefined' && typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url) {
    try {
      window.supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      return window.supabaseClient;
    } catch (e) {
      console.error('Fallback init error:', e);
    }
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const client = getClient();

  // 1. Check if user is already logged in
  if (client && isSupabaseConfigured()) {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        // Already logged in, redirect to dashboard/home
        window.location.href = 'index.html';
        return;
      }
    } catch (e) {
      console.warn('Session check skipped:', e);
    }
  }

  // 2. Tab switching logic (for combined auth.html if used)
  const tabButtons = document.querySelectorAll('.auth-tab-btn');
  const forms = {
    signin: document.getElementById('signin-form-wrapper'),
    signup: document.getElementById('signup-form-wrapper')
  };

  if (tabButtons.length > 0 && forms.signin && forms.signup) {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (target === 'signin') {
          forms.signin.classList.remove('hidden');
          forms.signup.classList.add('hidden');
        } else {
          forms.signin.classList.add('hidden');
          forms.signup.classList.remove('hidden');
        }
      });
    });

    // Handle URL query parameter, e.g., auth.html?tab=signup
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'signup' || urlParams.get('mode') === 'signup') {
      const signupTab = document.querySelector('.auth-tab-btn[data-tab="signup"]');
      if (signupTab) signupTab.click();
    }
  }

  // Switch links inside cards (e.g., "Don't have an account? Sign up")
  document.querySelectorAll('[data-switch-to]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.switchTo;
      const targetTab = document.querySelector(`.auth-tab-btn[data-tab="${target}"]`);
      if (targetTab) {
        targetTab.click();
      } else {
        // Fallback for separate pages
        window.location.href = target === 'signup' ? 'signup.html' : 'login.html';
      }
    });
  });

  // 3. Password Show/Hide Toggle
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const icon = btn.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  });

  // 4. Handle Sign In
  const signinForm = document.getElementById('signin-form');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!isSupabaseConfigured()) {
        Toast.warning('Bhai, pehle js/config.js me apna Supabase URL aur Anon Key daalein!');
        return;
      }

      const activeClient = getClient();
      if (!activeClient) {
        Toast.error('Supabase client initialize nahi ho saka. Page refresh karein.');
        return;
      }

      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;
      const submitBtn = signinForm.querySelector('button[type="submit"]');

      setLoading(submitBtn, true, 'Signing In...');

      try {
        const { data, error } = await activeClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          Toast.error(error.message || 'Login failed. Please check your credentials.');
          setLoading(submitBtn, false, 'Sign In');
          return;
        }

        Toast.success('Login kamyab raha! Redirecting...');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        console.error('Sign in error:', err);
        Toast.error('An unexpected error occurred. Please try again.');
        setLoading(submitBtn, false, 'Sign In');
      }
    });
  }

  // 5. Handle Sign Up
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!isSupabaseConfigured()) {
        Toast.warning('Bhai, pehle js/config.js me apna Supabase URL aur Anon Key daalein!');
        return;
      }

      const activeClient = getClient();
      if (!activeClient) {
        Toast.error('Supabase client initialize nahi ho saka. Page refresh karein.');
        return;
      }

      const fullName = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;
      const submitBtn = signupForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        Toast.error('Passwords match nahi kar rahe!');
        return;
      }

      if (password.length < 6) {
        Toast.error('Password kam az kam 6 characters ka hona chahiye.');
        return;
      }

      setLoading(submitBtn, true, 'Creating Account...');

      try {
        const { data, error } = await activeClient.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || email)}`
            }
          }
        });

        if (error) {
          Toast.error(error.message || 'Registration failed.');
          setLoading(submitBtn, false, 'Create Account');
          return;
        }

        // Agar Supabase par "Confirm Email" on hai tou session null hoga
        if (data.user && !data.session) {
          Toast.success('Account ban gaya! Agar email confirmation on hai tou email check karein, warna login karein.');
          signupForm.reset();
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
        } else {
          Toast.success('Account kamyabi se ban gaya! Redirecting...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        }
      } catch (err) {
        console.error('Sign up error:', err);
        Toast.error('An unexpected error occurred during signup.');
      } finally {
        setLoading(submitBtn, false, 'Create Account');
      }
    });
  }

  // 6. Handle Forgot Password
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt('Enter your registered email for password reset:');
      if (!email) return;

      if (!isSupabaseConfigured()) {
        Toast.warning('Supabase credentials config.js me add karein.');
        return;
      }

      const activeClient = getClient();
      if (!activeClient) {
        Toast.error('Supabase client error.');
        return;
      }

      try {
        const { error } = await activeClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login.html'
        });
        if (error) {
          Toast.error(error.message);
        } else {
          Toast.success('Password reset email bhej di gayi hai!');
        }
      } catch (err) {
        Toast.error('Reset request failed.');
      }
    });
  }
});

// Button loading state helper
function setLoading(button, isLoading, text) {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `<span class="btn-spinner"></span> ${text}`;
  } else {
    button.disabled = false;
    button.innerHTML = text;
  }
}
