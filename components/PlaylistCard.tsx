'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  renamePlaylist,
  deletePlaylist,
  removeVideoFromPlaylist,
} from '@/app/actions/playlists'

interface Video {
  id: string
  title: string
  thumbnail_url?: string
}

interface PlaylistItem {
  id: string
  video_id: string
  videos: Video
}

interface Playlist {
  id: string
  name: string
  playlist_items: PlaylistItem[]
}

export default function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(playlist.name)
  const [loading, setLoading] = useState(false)

  // 1. マイリスト名の変更処理
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || newName === playlist.name) {
      setIsEditing(false)
      return
    }

    setLoading(true)
    const res = await renamePlaylist(playlist.id, newName.trim())
    setLoading(false)

    if (res.success) {
      setIsEditing(false)
      router.refresh()
    } else {
      alert(res.error || '名前の変更に失敗しました')
    }
  }

  // 2. マイリスト自体の削除処理（ポップアップなしで即削除）
  const handleDeletePlaylist = async () => {
    setLoading(true)
    const res = await deletePlaylist(playlist.id)
    setLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || '削除に失敗しました')
    }
  }

  // 3. マイリストから動画を削除する処理（ポップアップなしで即削除）
  const handleRemoveVideo = async (itemId: string) => {
    setLoading(true)
    const res = await removeVideoFromPlaylist(itemId)
    setLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || '動画の削除に失敗しました')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs relative">
      {/* マイリストヘッダー（名前・名前変更・リスト削除） */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
        {isEditing ? (
          <form onSubmit={handleRename} className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-gray-500 flex-1 max-w-xs"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setNewName(playlist.name)
              }}
              className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>📁</span>
            <span>{playlist.name}</span>
            <span className="text-xs font-normal text-gray-400">
              ({playlist.playlist_items?.length || 0}件)
            </span>
          </h2>
        )}

        {/* 操作ボタン */}
        {!isEditing && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ✏️ 名前変更
            </button>
            <button
              onClick={handleDeletePlaylist}
              disabled={loading}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              🗑️ リスト削除
            </button>
          </div>
        )}
      </div>

      {/* 動画一覧 */}
      {playlist.playlist_items?.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center font-bold">
          このマイリストに動画はまだありません
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlist.playlist_items.map((item) => {
            const video = item.videos
            if (!video) return null

            return (
              <div
                key={item.id}
                className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-gray-50 flex flex-col justify-between relative group"
              >
                <div>
                  {/* サムネイル ＆ 個別動画削除ボタン */}
                  <div className="relative aspect-video bg-gray-200 overflow-hidden">
                    <img
                      src={
                        video.thumbnail_url ||
                        `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
                      }
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {/* 右上の動画削除「✕」ボタン */}
                    <button
                      onClick={() => handleRemoveVideo(item.id)}
                      disabled={loading}
                      title="この動画をマイリストから削除"
                      className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center transition-colors shadow-md cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-bold text-gray-900 line-clamp-2 mb-2 leading-snug">
                      {video.title}
                    </p>
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-red-600 hover:underline block"
                  >
                    YouTubeで見る ↗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}