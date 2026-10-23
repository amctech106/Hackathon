// ==============================================================================
// 🔌 SUPABASE CLIENT INITIALIZATION
// ==============================================================================

// Make sure window.supabaseClient is globally accessible
window.supabaseClient = null;

try {
  if (typeof supabase === 'undefined') {
    console.error('Supabase CDN script is missing in HTML!');
  } else if (typeof SUPABASE_CONFIG !== 'undefined' && SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey) {
    window.supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Supabase client initialized successfully!');
  } else {
    console.warn('⚠️ SUPABASE_CONFIG missing or not set in js/config.js');
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}

// Global shorthand for convenience
var supabaseClient = window.supabaseClient;
