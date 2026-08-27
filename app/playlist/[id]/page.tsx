import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

// X（Twitter）カードなどのOGP（サムネイル・タイトル表示）設定
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: playlist } = await supabase
    .from('playlists')
    .select('title')
    .eq('id', id)
    .single()

  if (!playlist) return { title: 'マイリストが見つかりません' }

  return {
    title: `${playlist.title} | マイリスト`,
    description: `ファンが作成した「${playlist.title}」の動画マイリストです。`,
    openGraph: {
      title: playlist.title,
      description: `ファンが作成した「${playlist.title}」の動画マイリストです。`,
    },
    twitter: {
      card: 'summary_large_image',
      title: playlist.title,
      description: `ファンが作成した「${playlist.title}」の動画マイリストです。`,
    },
  }
}

export default async function PlaylistDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // マイリストと関連する動画一覧を取得
  const { data: playlist, error } = await supabase
    .from('playlists')
    .select('*, playlist_items(*)')
    .eq('id', id)
    .single()

  if (error || !playlist) {
    notFound()
  }

  const items = playlist.playlist_items || []

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダー・戻るボタン */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl transition shadow-sm"
          >
            ← トップへ戻る
          </Link>
        </div>

        {/* マイリストタイトル表示 */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📁</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {playlist.title}
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-medium">全 {items.length} 件の動画</p>
        </div>

        {/* 動画一覧 */}
        {items.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 text-gray-400 text-sm">
            このマイリストにはまだ動画が追加されていません。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const videoId = item.video_id
              const title = item.title || item.video_title || '動画'
              const thumb =
                item.thumbnail_url ||
                item.thumbnailUrl ||
                `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
              const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`

              return (
                <a
                  key={item.id || videoId}
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="aspect-video relative overflow-hidden bg-gray-100">
                    <img
                      src={thumb}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition">
                      {title}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}