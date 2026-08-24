import type { Metadata } from 'next'
import AnonymousAuth from '@/components/AnonymousAuth'
import Header from '@/components/Header' // ※ヘッダーのファイル名が Navbar.tsx などの場合は変更してください
import './globals.css'

export const metadata: Metadata = {
  title: '動画マイリスト',
  description: 'マイリスト作成・管理アプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AnonymousAuth />
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}