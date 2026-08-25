import type { Metadata } from 'next'
import AnonymousAuth from '@/components/AnonymousAuth'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: '【非公式】レイクレ動画検索&マイリスト | Lazy Lie Crazy ファンツール',
  description: 'レイクレ (Lazy Lie Crazy) のYouTube動画を爆速で検索・マイリスト管理できるファン専用ツール',
  keywords: ['レイクレ', 'Lazy Lie Crazy', 'どば師匠', 'たかし', 'てっちゃん', 'ぴかるん', 'ペロリ'],
  verification: {
    google: '_J5Yew-K9xYmppAas_pXAYuGJf4hxVqT1CRPEPIzKT0',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col justify-between">
        <AnonymousAuth />
        <div>
          {/* <Header /> を削除して重複を解消 */}
          <main>{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  )
}