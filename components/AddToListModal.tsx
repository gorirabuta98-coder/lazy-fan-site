'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlaylistAndAddVideo, addVideoToPlaylist } from '@/app/actions/playlists'

interface Playlist {
  id: string
  name: string
}

interface AddToListModalProps {
  videoId: string
  videoTitle?: string
  thumbnailUrl?: string
  playlists: Playlist[]
}

export default function AddToListModal({
  videoId,
  videoTitle,
  thumbnailUrl,
  playlists,
}: AddToListModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const videoInput = {
    id: videoId,
    title: videoTitle,
    thumbnail_url: thumbnailUrl,
  }

  // 新規マイリスト作成 ＆ 動画追加
  const handleCreateAndAdd = async () => {
    if (!newTitle.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      await createPlaylistAndAddVideo(newTitle.trim(), videoInput)
      setNewTitle('')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to create playlist:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 既存マイリストへ動画追加
  const handleAddToExisting = async (playlistId: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      await addVideoToPlaylist(playlistId, videoInput)
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to add to playlist:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-2 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <span>📁</span> マイリストに追加
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            {/* 閉じるボタン */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg p-1"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📂</span> マイリストに追加
            </h3>

            {/* 新しいマイリストを作成 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                新しいマイリストを作成して追加
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="リスト名を入力"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
                <button
                  onClick={handleCreateAndAdd}
                  disabled={!newTitle.trim() || isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isSubmitting ? '保存中...' : '作成して追加'}
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* 既存マイリスト */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">
                既存のマイリスト
              </label>
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">
                  マイリストがまだありません
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToExisting(pl.id)}
                      disabled={isSubmitting}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors flex items-center justify-between border border-transparent hover:border-gray-200"
                    >
                      <span className="truncate">{pl.name}</span>
                      <span className="text-red-600 font-bold text-[11px] shrink-0">
                        追加 ＋
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}