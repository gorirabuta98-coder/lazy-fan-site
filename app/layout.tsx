import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'レイクレ Fan Site',
  description: 'レイクレの動画マイリスト管理サイト',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}