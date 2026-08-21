import { getVideosByPart } from '@/app/actions/videos'
import { getPlaylistsWithVideos } from '@/app/actions/playlists'
import { VideoList } from '@/components/VideoList'

export default async function HomePage() {
  const PAGE_SIZE = 50 // 1 Part あたり 50件に設定

  const [videosData, playlists] = await Promise.all([
    getVideosByPart(1, PAGE_SIZE),
    getPlaylistsWithVideos(),
  ])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <VideoList
        initialVideos={videosData.videos}
        totalCount={videosData.totalCount}
        playlists={playlists}
        pageSize={PAGE_SIZE}
      />
    </main>
  )
}