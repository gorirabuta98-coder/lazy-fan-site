'use client'

import { useState, useMemo, useEffect } from 'react'
import { getPlaylistsWithVideos } from '@/app/actions/playlists'
import { getDeviceId } from '@/lib/deviceId'
import AddToListModal, { PlaylistWithItems } from './AddToListModal'

interface Video {
  id: string
  title: string
  thumbnail_url?: string
  thumbnail?: string
  published_at?: string
}

interface VideoListProps {
  initialVideos: Video[]
  totalCount: number
  playlists: any[]
  pageSize: number
}

export function VideoList({
  initialVideos,
  totalCount,
  playlists,
  pageSize,
}: VideoListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPart, setSelectedPart] = useState(1)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [devicePlaylists, setDevicePlaylists] = useState<PlaylistWithItems[]>(playlists)

  const Modal = AddToListModal as any

  const totalParts = Math.ceil(totalCount / pageSize) || 54
  const parts = Array.from({ length: totalParts }, (_, i) => i + 1)

  useEffect(() => {
    getPlaylistsWithVideos(getDeviceId()).then(setDevicePlaylists)
  }, [])

  const filteredVideos = useMemo(() => {
    if (!initialVideos) return []
    return initialVideos.filter((video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [initialVideos, searchTerm])

  const handleSelectAll = () => {
    if (selectedVideoIds.length === filteredVideos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(filteredVideos.map((v) => v.id))
    }
  }

  const handleToggleSelect = (videoId: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    )
  }

  const handleOpenModal = (video: Video) => {
    setSelectedVideo(video)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <h1 className="text-xl font-bold text-gray-900">動画一覧</h1>
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
              全 {totalCount} 件
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              ページ内全選択
            </button>
            <div className="relative flex-1 md:w-64">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="動画タイトルを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            ページ選択 (Part 1 ～ Part {totalParts})
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-2">
            {parts.map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setSelectedPart(part)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedPart === part
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                }`}
              >
                Part {part}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredVideos.map((video) => {
          const isSelected = selectedVideoIds.includes(video.id)
          return (
            <div
              key={video.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow group relative"
            >
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={video.thumbnail_url || video.thumbnail || ''}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => handleToggleSelect(video.id)}
                  className={`absolute top-3 left-3 w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                    isSelected
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'bg-black/30 border-white/80 hover:bg-black/50'
                  }`}
                >
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  {video.published_at && (
                    <p className="text-[11px] text-gray-400">
                      {video.published_at.split('T')[0]}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModal(video)}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors border border-gray-100 flex items-center justify-center gap-1"
                >
                  <span>+</span> マイリストに追加
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {isModalOpen && selectedVideo && (
        <Modal
          videoId={selectedVideo.id}
          videoTitle={selectedVideo.title}
          thumbnailUrl={selectedVideo.thumbnail_url || selectedVideo.thumbnail || ''}
          playlists={devicePlaylists}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  )
}

export default VideoList