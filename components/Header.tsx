'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="text-xl font-black text-gray-900 tracking-tight">
          レイクレ <span className="text-red-600">Fan Site</span>
        </Link>

        {/* ナビゲーション */}
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors"
          >
            トップ動画
          </Link>
          <Link
            href="/playlists"
            className="text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            <span>📁</span>
            <span>マイリスト一覧</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            ログアウト
          </button>
        </nav>
      </div>
    </header>
  )
}