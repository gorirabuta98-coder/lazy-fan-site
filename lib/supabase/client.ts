import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 他のファイル（login/page.tsx など）から呼び出せるように export
export const createClient = () => createSupabaseClient(supabaseUrl, supabaseAnonKey)

export const supabase = createClient()

// 匿名ログイン用関数
export async function ensureAnonymousSession() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) console.error('匿名ログイン失敗:', error)
    return data?.session
  }

  return session
}