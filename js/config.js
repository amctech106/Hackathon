// ==============================================================================
// 🛠️ SUPABASE CONFIGURATION
// ==============================================================================

window.SUPABASE_CONFIG = {
  url: "https://gapkxjiupqjinncgjonc.supabase.co", 
  anonKey: "sb_publishable_ZLGVvTKhtdx_VvbjSPGZfw_64HfEpFF" 
};
var SUPABASE_CONFIG = window.SUPABASE_CONFIG;

// Config check helper
function isSupabaseConfigured() {
  return (
    window.SUPABASE_CONFIG &&
    window.SUPABASE_CONFIG.url &&
    window.SUPABASE_CONFIG.anonKey &&
    !window.SUPABASE_CONFIG.url.includes("xyzcompany") &&
    !window.SUPABASE_CONFIG.anonKey.includes("...")
  );
}
