// Supabase client wrapper (Faza 2B / DEC-042)
// Fallback-safe: nëse env vars mungojnë, eksportohet null dhe backend vazhdon me in-memory.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

let supabase = null;
if (!supabaseUrl || !supabaseSecretKey) {
    console.warn('[Supabase] Env vars missing (SUPABASE_URL / SUPABASE_SECRET_KEY). Tracking do të përdorë vetëm in-memory fallback.');
} else {
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(supabaseUrl, supabaseSecretKey, {
            auth: { persistSession: false }
        });
        console.log('[Supabase] Client inicializuar OK.');
    } catch (e) {
        console.error('[Supabase] Init error:', e.message);
        supabase = null;
    }
}

module.exports = supabase;
