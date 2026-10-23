// ==============================================================================
// 🛠️ SUPABASE CONFIGURATION
// ==============================================================================
// 1. Supabase (https://supabase.com) par login karein aur naya project banayein.
// 2. Project Settings -> API me jayein.
// 3. "Project URL" aur "anon public key" copy kar ke neeche paste karein:

const SUPABASE_CONFIG = {
  url: "https://xyzcompany.supabase.co", // Replace with your Project URL
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Replace with your anon key
};

// Config check helper
function isSupabaseConfigured() {
  return (
    SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.anonKey &&
    !SUPABASE_CONFIG.url.includes("xyzcompany") &&
    !SUPABASE_CONFIG.anonKey.includes("...")
  );
}
