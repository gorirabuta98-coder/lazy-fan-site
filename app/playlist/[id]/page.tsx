import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import Link from 'next/link'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface PageProps {
  params: Promise<{ id: string }>
}

// X（旧Twitter）やGoogle用のメタデータ（SEO対策）
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { data: playlist } = await supabase
    .from('playlists')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!playlist) {
    return {
      title: 'マイリストが見つかりません | レイクレファンツール',
    }
  }

  return {
    title: `${playlist.title} | レイクレ動画マイリスト`,
    description: playlist.description || 'レイクレ（Lazy Lie Crazy）のおすすめ動画マイリストです。',
    openGraph: {
      title: `${playlist.title} | レイクレ動画マイリスト`,
      description: playlist.description || 'レイクレのおすすめ動画まとめ',
    },
  }
}

export default async function PlaylistDetailPage({ params }: PageProps) {
  const { id } = await params

  // DBからマイリスト情報を取得
  const { data: playlist, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !playlist) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          マイリストが見つかりませんでした
        </h1>
        <p className="text-gray-600 mb-8">
          削除されたか、URLが間違っている可能性があります。
        </p>
        <Link
          href="/"
          className="inline-block bg-red-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-red-700 transition"
        >
          トップページへ戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* マイリストのヘッダー情報 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-3">
        <div className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
          公開マイリスト
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {playlist.title}
        </h1>
        {playlist.description && (
          <p className="text-gray-600 text-sm sm:text-base whitespace-pre-wrap">
            {playlist.description}
          </p>
        )}
        <div className="text-xs text-gray-400 pt-2 border-t">
          登録動画数: {playlist.video_ids.length}件
        </div>
      </div>

      {/* 動画一覧・プレイヤー表示エリア */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">収録動画</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {playlist.video_ids.map((videoId: string) => (
            <div
              key={videoId}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
            >
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center pt-8">
        <Link
          href="/"
          className="inline-block bg-gray-800 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-900 transition"
        >
          自分もマイリストを作ってみる
        </Link>
      </div>
    </div>
  )
}