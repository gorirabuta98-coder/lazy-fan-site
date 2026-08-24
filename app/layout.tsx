import type { Metadata } from 'next'
import AnonymousAuth from '@/components/AnonymousAuth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: '【非公式】レイクレ動画検索＆マイリスト | Lazy Lie Crazy ファンツール',
  description: 'レイクレ（Lazy Lie Crazy）のYouTube動画を爆速で検索・マイリスト管理できるファン専用ツール。お気に入りの動画をまとめていつでも楽しめます。',
  keywords: ['レイクレ', 'Lazy Lie Crazy', 'どば師匠', 'たかし', 'てっちゃん', 'ぴかるん', 'ぺろ愛男爵', 'マイリスト', '動画検索'],
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
          <Header />
          <main>{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  )
}