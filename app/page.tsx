import { createClient } from '@/lib/supabase/server'
import { getOrFetchVideos } from '@/app/actions/videos'
import { getPlaylistsWithVideos } from '@/app/actions/playlists'
import LoginButton from '@/components/LoginButton'
import Header from '@/components/Header'
import VideoList from '@/components/VideoList'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { videos, totalCount } = await getOrFetchVideos()
  const playlists = user ? await getPlaylistsWithVideos() : []

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!user ? (
          <div className="text-center bg-white p-10 rounded-2xl shadow-xs border border-gray-200">
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              マイメン専用 Fan Site
            </h2>
            <p className="text-sm text-gray-600 mb-8">
              ログインして動画の整理やマイリスト作成を始めよう！
            </p>
            <LoginButton />
          </div>
        ) : (
          <VideoList
            initialVideos={videos || []}
            totalCount={totalCount || 0}
            playlists={playlists || []}
          />
        )}
      </main>
    </div>
  )
}