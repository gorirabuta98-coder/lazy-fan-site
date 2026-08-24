'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ShareModal from '@/components/ShareModal'

interface Video {
  id: string
  title: string
  publishedAt?: string
  published_at?: string
  thumbnailUrl?: string
  thumbnail_url?: string
}

interface VideoListProps {
  initialVideos: Video[]
  totalCount: number
  playlists?: any[]
  pageSize: number
  currentPart: number
}

export function VideoList({
  initialVideos,
  totalCount,
  pageSize,
  currentPart,
}: VideoListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [myList, setMyList] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'mylist'>('all')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // ローカルストレージからマイリストを復元
  useEffect(() => {
    const saved = localStorage.getItem('lake_my_list')
    if (saved) {
      try {
        setMyList(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // マイリストの追加・削除
  const toggleMyList = (videoId: string) => {
    let updated: string[]
    if (myList.includes(videoId)) {
      updated = myList.filter((id) => id !== videoId)
    } else {
      updated = [...myList, videoId]
    }
    setMyList(updated)
    localStorage.setItem('lake_my_list', JSON.stringify(updated))
  }

  // 検索フィルタリング
  const filteredVideos = initialVideos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalParts = Math.ceil(totalCount / pageSize)

  return (
    <div className="space-y-6">
      {/* 上部操作バー */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
              activeTab === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            動画一覧
          </button>
          <button
            onClick={() => setActiveTab('mylist')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${
              activeTab === 'mylist'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 マイリスト ({myList.length})
          </button>
        </div>

        {/* 公開・共有ボタン */}
        {myList.length > 0 && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-2 shadow-sm"
          >
            <span>🔗</span> このマイリストを公開・共有する
          </button>
        )}
      </div>

      {/* 動画一覧表示 */}
      {activeTab === 'all' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📺 動画一覧 <span className="text-sm font-normal text-gray-500">全 {totalCount} 件</span>
            </h2>
            <input
              type="text"
              placeholder="動画タイトルを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Part切り替えボタン */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {Array.from({ length: totalParts }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => router.push(`/?part=${p}`)}
                className={`px-3 py-1 rounded text-xs font-medium transition ${
                  p === currentPart
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Part {p}
              </button>
            ))}
          </div>

          {/* 動画カード一覧 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVideos.map((video) => {
              const inMyList = myList.includes(video.id)
              return (
                <div
                  key={video.id}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-video">
                    <img
                      src={video.thumbnailUrl || video.thumbnail_url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {video.publishedAt || video.published_at || ''}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleMyList(video.id)}
                      className={`w-full py-1.5 rounded text-xs font-bold transition ${
                        inMyList
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {inMyList ? '✓ マイリスト追加済み' : '+ マイリストに追加'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* マイリスト表示（動画一覧と同デザインのカード表示） */}
      {activeTab === 'mylist' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📁 マイリスト ({myList.length} 件)
            </h2>
          </div>

          {myList.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">
              マイリストに動画が登録されていません。「動画一覧」から追加してください。
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myList.map((id) => {
                const video = initialVideos.find((v) => v.id === id)
                const title = video ? video.title : `動画 ID: ${id}`
                const thumb = video?.thumbnailUrl || video?.thumbnail_url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
                const date = video?.publishedAt || video?.published_at || ''

                return (
                  <div
                    key={id}
                    className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative aspect-video">
                      <img
                        src={thumb}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-800 line-clamp-2">
                          {title}
                        </p>
                        {date && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            {date}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleMyList(id)}
                        className="w-full py-1.5 rounded text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition"
                      >
                        マイリストから削除
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 共有用モーダル */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        videoIds={myList}
      />
    </div>
  )
}