'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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
    router.refresh()
  }

  if (loading) return null

  // ③ ゲスト状態（未ログイン）の場合：ログイン画面への誘導ボタンを表示
  if (!user) {
    return (
      <Link
        href="/login"
        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
      >
        <span>🔑 ログイン画面に戻る</span>
      </Link>
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
        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-xl transition"
      >
        ログアウト
      </button>
    </div>
  )
}