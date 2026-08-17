'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renamePlaylist, deletePlaylist, removeVideoFromPlaylist } from '@/app/actions/playlists'

interface Video {
  id: string
  title: string
  thumbnail_url: string
  published_at?: string
}

interface PlaylistItem {
  id?: string
  video_id: string
  videos: Video | Video[] | null
}

interface Playlist {
  id: string
  name: string
  playlist_items?: PlaylistItem[]
}

interface PlaylistCardProps {
  playlist: Playlist
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(playlist.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleRename = async () => {
    if (!name.trim() || isSubmitting) return
    setIsSubmitting(true)
    const res = await renamePlaylist(playlist.id, name.trim())
    setIsSubmitting(false)
    if (res?.success) {
      setIsEditing(false)
      router.refresh()
    }
  }

  const handleDeletePlaylist = async () => {
    if (!confirm('このマイリストを削除してもよろしいですか？')) return
    setIsSubmitting(true)
    const res = await deletePlaylist(playlist.id)
    setIsSubmitting(false)
    if (res?.success) {
      router.refresh()
    }
  }

  const handleRemoveVideo = async (videoId: string) => {
    setIsSubmitting(true)
    const res = await removeVideoFromPlaylist(playlist.id, videoId)
    setIsSubmitting(false)
    if (res?.success) {
      router.refresh()
    }
  }

  const items = playlist.playlist_items || []

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between gap-2 border-b pb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleRename}
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              保存
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setName(playlist.name)
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-bold text-gray-900 truncate">{playlist.name}</h2>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded bg-gray-50 hover:bg-gray-100"
              >
                編集
              </button>
              <button
                onClick={handleDeletePlaylist}
                disabled={isSubmitting}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded bg-red-50 hover:bg-red-100"
              >
                削除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 動画リスト */}
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">動画が追加されていません</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const video = Array.isArray(item.videos) ? item.videos[0] : item.videos
            if (!video) return null

            // item.id が取れない場合も一意な key になるよう安全に割り当て
            const itemKey = item.id || `${item.video_id}-${index}`

            return (
              <div
                key={itemKey}
                className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-gray-50/50 p-3 flex gap-3 items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-24 h-14 object-cover rounded-lg shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-tight">
                      {video.title}
                    </p>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-red-600 hover:underline inline-block mt-1 font-semibold"
                    >
                      YouTubeで見る ↗
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveVideo(video.id)}
                  disabled={isSubmitting}
                  className="text-xs text-gray-400 hover:text-red-600 p-2 shrink-0 transition-colors"
                  title="動画を削除"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}