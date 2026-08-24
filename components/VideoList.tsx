'use client'

import { useState, useEffect } from 'react'
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
  allVideos?: Video[] // 全動画データ（存在する場合）
}

export function VideoList({
  initialVideos,
  totalCount,
  playlists: initialPlaylists = [],
  pageSize,
  currentPart,
  allVideos = [],
}: VideoListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>(initialPlaylists)
  const [activeTab, setActiveTab] = useState<'all' | 'mylist'>('all')
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<Video | null>(null)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)

  // 複数選択用のステート
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])

  // 全動画からの検索処理（検索キー入力時はPartを無視して全体検索）
  const searchSource = searchQuery.trim() !== '' && allVideos.length > 0 ? allVideos : initialVideos
  const filteredVideos = searchSource.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalParts = Math.ceil(totalCount / pageSize)
  const currentPlaylist = playlists.find((pl) => pl.id === selectedPlaylistId) || playlists[0]

  // チェックボックス切り替え
  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // 表示中の全選択 / 解除
  const toggleSelectAll = () => {
    if (selectedVideoIds.length === filteredVideos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(filteredVideos.map((v) => v.id))
    }
  }

  // 複数選択した動画をモーダルへ送る（先頭動画を代表に設定）
  const handleBatchAddToMyList = () => {
    if (selectedVideoIds.length === 0) return
    const firstSelected = filteredVideos.find((v) => v.id === selectedVideoIds[0])
    if (firstSelected) {
      setSelectedVideoForModal(firstSelected)
    }
  }

  return (
    <div className="space-y-6">
      {/* タブ切り替え ＆ 一括操作バー */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition ${
              activeTab === 'all'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            動画一覧
          </button>
          <button
            onClick={() => setActiveTab('mylist')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'mylist'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📁 マイリスト ({playlists.length})
          </button>
        </div>

        {/* 複数選択時の共通アクションバー */}
        {activeTab === 'all' && selectedVideoIds.length > 0 && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end bg-red-50 p-2.5 rounded-xl border border-red-100">
            <span className="text-xs font-bold text-red-700">
              {selectedVideoIds.length} 件選択中
            </span>
            <button
              onClick={handleBatchAddToMyList}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              ＋ 選択した動画をマイリストに追加
            </button>
          </div>
        )}
      </div>

      {/* 動画一覧表示 */}
      {activeTab === 'all' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                📺 動画一覧 <span className="text-sm font-normal text-gray-500">全 {totalCount} 件</span>
              </h2>
              {filteredVideos.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-gray-500 hover:text-gray-800 underline ml-2"
                >
                  {selectedVideoIds.length === filteredVideos.length ? '選択解除' : '全選択'}
                </button>
              )}
            </div>

            {/* 全動画対象の検索バー */}
            <input
              type="text"
              placeholder="全2660件から動画タイトルを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 検索実行時はPartボタンを非表示にし、通常時のみPart切替を表示 */}
          {!searchQuery.trim() && (
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
          )}

          {/* 動画カード一覧 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredVideos.map((video) => {
              const isSelected = selectedVideoIds.includes(video.id)
              const thumb = video.thumbnailUrl || video.thumbnail_url || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`

              return (
                <div
                  key={video.id}
                  className={`relative bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col justify-between transition ${
                    isSelected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100'
                  }`}
                >
                  {/* チェックボックス */}
                  <label className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg cursor-pointer flex items-center justify-center backdrop-blur-sm">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectVideo(video.id)}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </label>

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
            {playlists.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    onClick={() => setSelectedPlaylistId(pl.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      currentPlaylist?.id === pl.id
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
          onClose={() => {
            setSelectedVideoForModal(null)
            setSelectedVideoIds([])
          }}
          playlists={playlists}
          onPlaylistsUpdated={(updated) => setPlaylists(updated)}
        />
      )}
    </div>
  )
}