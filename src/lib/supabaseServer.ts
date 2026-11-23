// src/lib/supabaseServer.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// 第一次用到時才建立用戶端：模組載入時就 createClient 的話，
// 環境變數不存在（例如 build 階段）會直接丟錯讓整個 build 失敗。
let client: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 未設定");
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
