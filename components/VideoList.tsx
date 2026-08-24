'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddToListModal, { PlaylistWithItems } from '@/components/AddToListModal'

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
  playlists?: PlaylistWithItems[]
  pageSize: number
  currentPart: number
}

export function VideoList({
  initialVideos,
  totalCount,
  playlists: initialPlaylists = [],
  pageSize,
  currentPart,
}: VideoListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>(initialPlaylists)
  const [activeTab, setActiveTab] = useState<'all' | 'mylist'>('all')
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<Video | null>(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)

  // 検索フィルタリング
  const filteredVideos = initialVideos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalParts = Math.ceil(totalCount / pageSize)

  // 選択中のマイリスト、または最初のマイリストを取得
  const currentPlaylist = playlists.find((pl) => pl.id === selectedPlaylistId) || playlists[0]

  return (
    <div className="space-y-6">
      {/* タブ切り替えバー */}
      <div className="flex gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
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
          📁 マイリスト ({playlists.length})
        </button>
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
              const thumb = video.thumbnailUrl || video.thumbnail_url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
              return (
                <div
                  key={video.id}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-video">
                    <img
                      src={thumb}
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
                      onClick={() => setSelectedVideoForModal(video)}
                      className="w-full py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold transition"
                    >
                      + マイリストに追加
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* マイリスト表示 */}
      {activeTab === 'mylist' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📁 マイリスト一覧
            </h2>
            {/* 複数マイリストのタブ選択 */}
            {playlists.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      (currentPlaylist?.id === pl.id)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pl.title} ({pl.playlist_items?.length || 0})
                  </button>
                ))}
              </div>
            )}
          </div>

          {playlists.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">
              マイリストがありません。「動画一覧」から動画を追加して新しいマイリストを作成してください。
            </p>
          ) : !currentPlaylist || !currentPlaylist.playlist_items || currentPlaylist.playlist_items.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">
              「{currentPlaylist?.title}」にはまだ動画が登録されていません。
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentPlaylist.playlist_items.map((item: any) => (
                <div
                  key={item.id || item.video_id}
                  className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="relative aspect-video">
                    <img
                      src={item.thumbnail_url || item.thumbnailUrl || `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`}
                      alt={item.title || item.video_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-bold text-gray-800 line-clamp-2">
                      {item.title || item.video_title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* マイリスト追加モーダル */}
      {selectedVideoForModal && (
        <AddToListModal
          videoId={selectedVideoForModal.id}
          videoTitle={selectedVideoForModal.title}
          thumbnailUrl={
            selectedVideoForModal.thumbnailUrl ||
            selectedVideoForModal.thumbnail_url ||
            `https://i.ytimg.com/vi/${selectedVideoForModal.id}/hqdefault.jpg`
          }
          onClose={() => setSelectedVideoForModal(null)}
          playlists={playlists}
          onPlaylistsUpdated={(updated) => setPlaylists(updated)}
        />
      )}
    </div>
  )
}