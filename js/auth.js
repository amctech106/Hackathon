// ==============================================================================
// 🔐 AUTHENTICATION LOGIC (SUPABASE)
// ==============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Check if user is already logged in
  if (supabaseClient && isSupabaseConfigured()) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      // Already logged in, redirect to dashboard/home
      window.location.href = 'index.html';
      return;
    }
  }

  // 2. Tab switching logic (Sign In <-> Sign Up)
  const tabButtons = document.querySelectorAll('.auth-tab-btn');
  const forms = {
    signin: document.getElementById('signin-form-wrapper'),
    signup: document.getElementById('signup-form-wrapper')
  };

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

  // Switch links inside cards (e.g., "Don't have an account? Sign up")
  document.querySelectorAll('[data-switch-to]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.switchTo;
      const targetTab = document.querySelector(`.auth-tab-btn[data-tab="${target}"]`);
      if (targetTab) targetTab.click();
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

      const email = document.getElementById('signin-email').value.trim();
      const password = document.getElementById('signin-password').value;
      const submitBtn = signinForm.querySelector('button[type="submit"]');

      setLoading(submitBtn, true, 'Signing In...');

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
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
        const { data, error } = await supabaseClient.auth.signUp({
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
          Toast.success('Account ban gaya! Apni email check karein verification link ke liye.');
          signupForm.reset();
          // Switch to signin tab
          document.querySelector('.auth-tab-btn[data-tab="signin"]').click();
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

      try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/auth.html'
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
  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `<span class="btn-spinner"></span> ${text}`;
  } else {
    button.disabled = false;
    button.innerHTML = text;
  }
}
