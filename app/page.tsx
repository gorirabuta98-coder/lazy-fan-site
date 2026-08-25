import { getVideosByPart } from '@/app/actions/videos'
import { VideoList } from '@/components/VideoList'

interface HomePageProps {
  searchParams: Promise<{ part?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const PAGE_SIZE = 50 // 1 Part あたり 50件に設定
  const { part: partParam } = await searchParams
  const parsedPart = Number.parseInt(partParam || '1', 10)
  const part = Number.isInteger(parsedPart) && parsedPart > 0 ? parsedPart : 1

  const videosData = await getVideosByPart(part, PAGE_SIZE)

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <VideoList
        initialVideos={videosData.videos}
        totalCount={videosData.totalCount}
        playlists={[]}
        pageSize={PAGE_SIZE}
        currentPart={part}
      />
    </main>
  )
}