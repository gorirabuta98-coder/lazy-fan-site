'use client'

import Link from 'next/link'
import LoginButton from './LoginButton'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1">
          レイクレ <span className="text-red-600">Fan Site</span>
        </Link>

        {/* ナビゲーション ＆ ログイン状態 */}
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors">
            YouTube同期
          </button>
          <Link href="/" className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors">
            動画一覧
          </Link>
          <Link href="/playlists" className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1">
            📁 マイリスト
          </Link>

          {/* ログインボタン・ログイン状態表示 */}
          <LoginButton />
        </div>
      </div>
    </header>
  )
}

export default Header