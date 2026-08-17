import { getVideos } from '@/app/actions/videos'
import { getUserPlaylists } from '@/app/actions/playlists'
import AddToListModal from '@/components/AddToListModal'

export const revalidate = 0 // 常に最新データを取得

export default async function HomePage() {
  // 横動画とユーザーのマイリストを並列取得
  const [videos, playlists] = await Promise.all([
    getVideos(24),
    getUserPlaylists(),
  ])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📺</span> 最新の動画一覧
          </h1>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {videos.length}件を表示中
          </span>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500">動画が見つかりませんでした。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-video overflow-hidden bg-gray-100 group"
                  >
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                  <div className="p-4">
                    <h2 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">
                      {video.title}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {new Date(video.published_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <AddToListModal
                    videoId={video.id}
                    videoTitle={video.title}
                    thumbnailUrl={video.thumbnail_url}
                    playlists={playlists}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}