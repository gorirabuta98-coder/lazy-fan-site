import { VideoList } from '@/components/VideoList'
// ※ データ取得関数等のインポートが他にある場合はそのまま残してください

export default async function HomePage({
  searchParams,
}: {
  searchParams: { part?: string }
}) {
  const currentPart = Number(searchParams?.part) || 1

  // ※ ここはお使いのデータ取得処理に合わせて調整してください
  // 例: const { videos, totalCount, playlists, pageSize } = await getData(currentPart)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <VideoList
        initialVideos={[]} // 取得したvideosを渡す
        totalCount={2658}  // 取得した件数を渡す
        pageSize={50}
        currentPart={currentPart}
        playlists={[]}     // 取得したplaylistsを渡す
      />
    </main>
  )
}