import { getPlaylistsWithVideos } from '@/app/actions/playlists'
import { PlaylistCard } from '@/components/PlaylistCard'

export default async function PlaylistsPage() {
  const playlists = await getPlaylistsWithVideos()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">マイリスト一覧</h1>

        {playlists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm font-bold">
              マイリストがまだ作成されていません。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playlists.map((playlist: any) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}