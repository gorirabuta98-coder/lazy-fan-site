'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // 1. 初期ログイン状態のチェック
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()

    // 2. ログイン/ログアウトの状態変化をリアルタイム監視
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  // Googleログイン処理（または任意の認証）
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return <div className="h-8 w-20 bg-gray-100 rounded-xl animate-pulse" />
  }

  // ------------------------------------------
  // 【ログイン済みの表示】
  // ------------------------------------------
  if (user) {
    const displayName =
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'ユーザー'

    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 pl-3 pr-1.5 py-1 rounded-xl">
        {/* ログイン中を示す緑のオンラインランプ */}
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        
        {/* ユーザー名 */}
        <span className="text-xs font-bold text-emerald-900 line-clamp-1 max-w-[100px]">
          {displayName}
        </span>

        {/* ログアウトボタン */}
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-white px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-gray-200"
          title="ログアウト"
        >
          ログアウト
        </button>
      </div>
    )
  }

  // ------------------------------------------
  // 【未ログインの表示】
  // ------------------------------------------
  return (
    <button
      type="button"
      onClick={handleLogin}
      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
    >
      <span>👤</span>
      <span>ログイン</span>
    </button>
  )
}