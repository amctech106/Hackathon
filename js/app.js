// ==============================================================================
// 🚀 APP LOGIC & SUPABASE CRUD UTILITIES
// ==============================================================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if Supabase credentials are set
  const warningBanner = document.getElementById('supabase-warning-banner');
  if (warningBanner) {
    if (!isSupabaseConfigured()) {
      warningBanner.classList.remove('hidden');
    } else {
      warningBanner.classList.add('hidden');
    }
  }

  // Check auth session
  await checkAuthStatus();

  // Setup auth state change listener
  if (supabaseClient && isSupabaseConfigured()) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      currentUser = session?.user || null;
      updateAuthUI(currentUser);
    });
  }

  // Logout button handler
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Initialize demo CRUD if present
  initDemoCrud();
});

// 1. Check Auth Status
async function checkAuthStatus() {
  if (!supabaseClient || !isSupabaseConfigured()) {
    updateAuthUI(null);
    return;
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      updateAuthUI(null);
      return;
    }
    currentUser = session?.user || null;
    updateAuthUI(currentUser);
  } catch (err) {
    console.error('Check auth error:', err);
    updateAuthUI(null);
  }
}

// 2. Update UI based on user login state
function updateAuthUI(user) {
  const loggedInNav = document.getElementById('nav-logged-in');
  const loggedOutNav = document.getElementById('nav-logged-out');
  const userGreeting = document.getElementById('user-greeting');
  const userAvatar = document.getElementById('user-avatar');
  const authProtectedSection = document.getElementById('auth-protected-section');
  const guestWelcomeSection = document.getElementById('guest-welcome-section');

  if (user) {
    if (loggedInNav) loggedInNav.classList.remove('hidden');
    if (loggedOutNav) loggedOutNav.classList.add('hidden');
    if (authProtectedSection) authProtectedSection.classList.remove('hidden');
    if (guestWelcomeSection) guestWelcomeSection.classList.add('hidden');

    const name = user.user_metadata?.full_name || user.email.split('@')[0];
    if (userGreeting) userGreeting.textContent = `Khushamdeed, ${name}!`;
    if (userAvatar) {
      userAvatar.src = user.user_metadata?.avatar_url || 
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
    }
  } else {
    if (loggedInNav) loggedInNav.classList.add('hidden');
    if (loggedOutNav) loggedOutNav.classList.remove('hidden');
    if (authProtectedSection) authProtectedSection.classList.add('hidden');
    if (guestWelcomeSection) guestWelcomeSection.classList.remove('hidden');
  }
}

// 3. Logout handler
async function handleLogout() {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    Toast.success('Logged out successfully!');
    updateAuthUI(null);
  } catch (err) {
    console.error('Logout error:', err);
    Toast.error('Logout failed: ' + err.message);
  }
}

// ==============================================================================
// 📦 READY-TO-USE SUPABASE CRUD TEMPLATE (Hackathon Quick-Start)
// ==============================================================================
// Kal hackathon me jo bhi table banayein (e.g. 'products', 'tasks', 'posts'),
// aap neeche diye gaye functions directly use kar sakte hain:

const Database = {
  // READ: Data get karna
  async getAll(tableName, orderBy = 'created_at', ascending = false) {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending });
    if (error) throw error;
    return data;
  },

  // CREATE: Naya record add karna
  async create(tableName, recordData) {
    const { data, error } = await supabaseClient
      .from(tableName)
      .insert([recordData])
      .select();
    if (error) throw error;
    return data[0];
  },

  // UPDATE: Record update karna
  async update(tableName, id, updateData) {
    const { data, error } = await supabaseClient
      .from(tableName)
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // DELETE: Record delete karna
  async delete(tableName, id) {
    const { error } = await supabaseClient
      .from(tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

// 4. Sample Demo interaction (Quick Notes / Tasks Demo)
function initDemoCrud() {
  const demoForm = document.getElementById('demo-crud-form');
  const demoInput = document.getElementById('demo-item-input');
  const demoList = document.getElementById('demo-items-list');

  if (!demoForm || !demoList) return;

  // Local state fallback agar database table abhi na bani ho
  let localItems = JSON.parse(localStorage.getItem('hackathon_demo_items') || '[]');

  function renderItems() {
    if (localItems.length === 0) {
      demoList.innerHTML = `<li class="empty-state">Abhi tak koi item add nahi hui. Upar form se add karein!</li>`;
      return;
    }
    demoList.innerHTML = localItems.map((item, index) => `
      <li class="demo-list-item">
        <span><i class="fa-solid fa-check-circle text-primary"></i> ${escapeHtml(item.text)}</span>
        <button type="button" class="btn-icon-danger" onclick="deleteDemoItem(${index})" title="Delete">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </li>
    `).join('');
  }

  window.deleteDemoItem = (index) => {
    localItems.splice(index, 1);
    localStorage.setItem('hackathon_demo_items', JSON.stringify(localItems));
    renderItems();
    Toast.info('Item delete ho gayi!');
  };

  demoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = demoInput.value.trim();
    if (!val) return;

    localItems.unshift({ text: val, created_at: new Date().toISOString() });
    localStorage.setItem('hackathon_demo_items', JSON.stringify(localItems));
    demoInput.value = '';
    renderItems();
    Toast.success('Nayi item add ho gayi!');
  });

  renderItems();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
