// ============================================
// Supabase 配置 - 小创客冒险之旅
// ============================================
// 注意：请将下方的 URL 和 KEY 替换为你的 Supabase 项目配置
// 获取方式：Supabase Dashboard → Settings → API

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// 初始化 Supabase 客户端
let supabaseClient = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase CDN not loaded, running in offline mode');
        return null;
    }
    try {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase initialized');
        return supabaseClient;
    } catch (e) {
        console.warn('Supabase init failed:', e);
        return null;
    }
}

// 获取 Supabase 客户端
function getSupabase() {
    if (!supabaseClient) {
        supabaseClient = initSupabase();
    }
    return supabaseClient;
}
