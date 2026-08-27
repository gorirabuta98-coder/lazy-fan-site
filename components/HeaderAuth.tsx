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

  // ゲスト状態からログイン画面に戻る
  const handleBackToLogin = () => {
    document.cookie = 'guest_mode=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'guest_mode=; path=/; max-age=0'
    router.push('/login')
    router.refresh()
  }

  if (loading) return null

  // 未ログイン（ゲスト時）
  if (!user) {
    return (
      <button
        onClick={handleBackToLogin}
        className="px-4 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-full transition flex items-center gap-1 cursor-pointer"
      >
        🔑 ログイン
      </button>
    )
  }

  // ログイン済み時
  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-full transition cursor-pointer"
    >
      ログアウト
    </button>
  )
}