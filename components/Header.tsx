import Link from 'next/link'
import SyncButton from '@/components/SyncButton'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-gray-900">
          レイクレ <span className="text-red-600">Fan Site</span>
        </Link>

        <div className="flex items-center gap-4">
          <SyncButton />
          <Link
            href="/"
            className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            トップ動画
          </Link>
          <Link
            href="/playlists"
            className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            📁 マイリスト一覧
          </Link>
        </div>
      </div>
    </header>
  )
}