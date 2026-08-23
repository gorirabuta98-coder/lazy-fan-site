import AnonymousAuth from '@/components/AnonymousAuth'
import './globals.css' // もともとインポートされていたスタイルがあれば残す

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AnonymousAuth />
        {children}
      </body>
    </html>
  )
}