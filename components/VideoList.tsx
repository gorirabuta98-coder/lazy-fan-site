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
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>(initialPlaylists)
  const [activeTab, setActiveTab] = useState<'all' | 'mylist'>('all')
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<Video | null>(null)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null)

  const totalParts = Math.ceil(totalCount / pageSize)

  const handleToggleSelectAll = () => {
    if (selectedVideoIds.length === initialVideos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(initialVideos.map((v) => v.id))
    }
  }

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleBatchAddToMyList = () => {
    if (selectedVideoIds.length === 0) return
    const firstSelected = initialVideos.find((v) => v.id === selectedVideoIds[0])
    if (firstSelected) {
      setSelectedVideoForModal(firstSelected)
    }
  }

  return (
    <div className="space-y-6">
      {/* 上部エリア（件数表示 ＆ 右上：YouTube同期 + タブ） */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-gray-100 gap-4">
        <div className="flex items-center gap-3">
          {activeTab === 'all' && (
            <>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                📺 動画一覧
              </h2>
              <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full font-medium">
                全 {totalCount} 件
              </span>
            </>
          )}
        </div>

        {/* 右上操作エリア（YouTube同期 ＋ タブ切替） */}
        <div className="flex items-center gap-3">
          <button className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm">
            YouTube同期
          </button>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              動画一覧
            </button>
            <button
              onClick={() => setActiveTab('mylist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mylist'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              📁 マイリスト
            </button>
          </div>
        </div>
      </div>

      {/* 動画一覧表示 */}
      {activeTab === 'all' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          {/* 一括操作エリア */}
          <div className="flex justify-end items-center gap-2">
            {selectedVideoIds.length > 0 && (
              <button
                onClick={handleBatchAddToMyList}
                className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-700 transition"
              >
                選択中 ({selectedVideoIds.length}) を追加
              </button>
            )}
            <button
              onClick={handleToggleSelectAll}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition"
            >
              {selectedVideoIds.length === initialVideos.length && initialVideos.length > 0
                ? '全解除'
                : 'ページ内全選択'}
            </button>
          </div>

          {/* Part選択エリア */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              ページ選択 (Part 1 ～ Part {totalParts})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalParts }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/?part=${p}`)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    currentPart === p
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Part {p}
                </button>
              ))}
            </div>
          </div>

          {/* 動画カードグリッド */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialVideos.map((video) => {
              const isSelected = selectedVideoIds.includes(video.id)
              const thumb =
                video.thumbnailUrl ||
                video.thumbnail_url ||
                `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
              const dateStr = video.publishedAt || video.published_at || ''

              return (
                <div
                  key={video.id}
                  className={`relative bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                    isSelected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100'
                  }`}
                >
                  <div className="relative aspect-video">
                    <button
                      onClick={() => toggleSelectVideo(video.id)}
                      className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border-2 transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-white/80 bg-black/30 hover:bg-black/50'
                      }`}
                    >
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </button>
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                        {video.title}
                      </p>
                      {dateStr && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {dateStr.split('T')[0]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedVideoForModal(video)}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-100 transition"
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

      {/* マイリスト一覧表示 */}
      {activeTab === 'mylist' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">マイリスト一覧</h2>

          {playlists.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 text-gray-400 text-sm">
              マイリストがありません。「動画一覧」から動画を追加してください。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {playlists.map((pl) => {
                const items = pl.playlist_items || []
                const isExpanded = expandedPlaylistId === pl.id

                return (
                  <div
                    key={pl.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-xl">📁</span>
                        <h3 className="font-bold text-base text-gray-800">{pl.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                        <button className="hover:text-amber-600 transition">✏️</button>
                        <button className="hover:text-red-600 transition">🗑️</button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">動画 {items.length} 件</p>

                    {items.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {items.slice(0, 4).map((item: any, idx) => (
                          <div
                            key={idx}
                            className="w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
                          >
                            <img
                              src={
                                item.thumbnail_url ||
                                item.thumbnailUrl ||
                                `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                              }
                              alt={item.title || item.video_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedPlaylistId(isExpanded ? null : pl.id)}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold text-center border border-gray-100 transition"
                    >
                      {isExpanded ? '▲ 動画一覧を閉じる' : '▼ 動画一覧を表示'}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        {items.map((item: any, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50 p-2 space-y-1"
                          >
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <img
                                src={
                                  item.thumbnail_url ||
                                  item.thumbnailUrl ||
                                  `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                                }
                                alt={item.title || item.video_title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] font-bold text-gray-700 line-clamp-2">
                              {item.title || item.video_title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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