'use client'

import Link from 'next/link'
import HeaderAuth from './HeaderAuth'

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-100 py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* 左側：タイトル */}
        <div className="flex items-center gap-2">
          <span className="text-xl">📺</span>
          <span className="font-bold text-lg text-gray-900">動画一覧</span>
        </div>

        {/* 右側：ナビゲーションボタン群 */}
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-black text-white text-xs font-bold rounded-full cursor-pointer">
            YouTube同期
          </button>

          <Link
            href="/"
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-full transition"
          >
            動画一覧
          </Link>

          <Link
            href="/playlist"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full flex items-center gap-1 transition"
          >
            📂 マイリスト
          </Link>

          {/* ログイン・ログアウトボタンを表示 */}
          <HeaderAuth />
        </div>
      </div>
    </header>
  )
}