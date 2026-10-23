// ==============================================================================
// 🔌 SUPABASE CLIENT INITIALIZATION
// ==============================================================================

let supabaseClient = null;

try {
  if (typeof supabase === 'undefined') {
    console.error('Supabase CDN script is missing in HTML!');
  } else {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}
