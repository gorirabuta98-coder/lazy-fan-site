'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function HeaderAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'guest_mode=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  const handleBackToLogin = () => {
    // ゲストフラグを解除してログイン画面へ
    document.cookie = 'guest_mode=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  if (loading) return null

  // 未ログイン（ゲスト状態）の場合：ログイン画面へ戻るボタンを表示
  if (!user) {
    return (
      <button
        onClick={handleBackToLogin}
        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm cursor-pointer"
      >
        <span>🔑 ログイン画面に戻る</span>
      </button>
    )
  }

  // ログイン済みの場合
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 font-medium hidden sm:inline">
        {user.email}
      </span>
      <button
        onClick={handleLogout}
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer"
      >
        ログアウト
      </button>
    </div>
  )
}