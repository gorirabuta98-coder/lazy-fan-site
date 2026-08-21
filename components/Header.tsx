'use client'

import Link from 'next/link'
import SyncButton from './SyncButton'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-black">
            レイクレ <span className="text-red-600">Fan Site</span>
          </span>
        </Link>

        {/* ナビゲーション＆アクション */}
        <div className="flex items-center gap-4">
          {/* 既存の SyncButton コンポーネントを使用 */}
          <SyncButton />

          {/* 画面遷移リンク */}
          <Link
            href="/"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2"
          >
            動画一覧
          </Link>
          <Link
            href="/playlists"
            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2 flex items-center gap-1"
          >
            📁 マイリスト
          </Link>

          {/* ログインボタン */}
          <button
            type="button"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-full transition-all shadow-sm flex items-center gap-1"
          >
            <span>👤</span> ログイン
          </button>
        </div>
      </div>
    </header>
  )
}