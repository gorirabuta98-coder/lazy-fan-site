import { getVideosByPart } from '@/app/actions/videos'
import { getPlaylistsWithVideos } from '@/app/actions/playlists' // ← 関数名を変更
import VideoList from '@/components/VideoList'

export default async function HomePage() {
  const [videosData, playlists] = await Promise.all([
    getVideosByPart(1, 20),
    getPlaylistsWithVideos(), // ← 関数名を変更
  ])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <VideoList
        initialVideos={videosData.videos}
        totalCount={videosData.totalCount}
        playlists={playlists}
      />
    </main>
  )
}