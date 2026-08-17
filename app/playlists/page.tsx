import { getPlaylistsWithVideos } from '@/app/actions/playlists'
import PlaylistCard from '@/components/PlaylistCard'
import PlaylistActions from '@/components/PlaylistActions'

export default async function PlaylistsPage() {
  const playlists = await getPlaylistsWithVideos()

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">マイリスト一覧</h1>
          <PlaylistActions />
        </div>

        {playlists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm">マイリストがまだ作成されていません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}