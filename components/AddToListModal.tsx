'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlaylistAndAddVideo, addVideoToPlaylist } from '@/app/actions/playlists'

interface AddToListModalProps {
  videoId: string
  videoTitle?: string
  thumbnailUrl?: string
  playlists: { id: string; name: string }[]
}

export default function AddToListModal({ videoId, videoTitle, thumbnailUrl, playlists }: AddToListModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const videoData = {
    id: videoId,
    title: videoTitle || 'YouTube Video',
    thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim() || loading) return
    setLoading(true)
    const res = await createPlaylistAndAddVideo(newTitle.trim(), videoData)
    setLoading(false)
    if (res.success) {
      setNewTitle('')
      setIsOpen(false)
      router.refresh()
    } else {
      alert(`追加に失敗しました: ${res.error}`)
    }
  }

  const handleAddToExisting = async (playlistId: string) => {
    if (loading) return
    setLoading(true)
    const res = await addVideoToPlaylist(playlistId, videoData)
    setLoading(false)
    if (res.success) {
      setIsOpen(false)
      router.refresh()
    } else {
      alert(`追加に失敗しました: ${res.error}`)
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
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-5 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg p-1"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📂</span> マイリストに追加
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">新しいマイリストを作成して追加</label>
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
                  disabled={!newTitle.trim() || loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 shrink-0"
                >
                  {loading ? '処理中...' : '作成して追加'}
                </button>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600 block">既存のマイリスト</label>
              {playlists.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">マイリストがまだありません</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToExisting(pl.id)}
                      disabled={loading}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-100 text-xs font-medium text-gray-700 transition-colors flex items-center justify-between border border-transparent hover:border-gray-200"
                    >
                      <span className="truncate">{pl.name}</span>
                      <span className="text-red-600 font-bold text-[11px] shrink-0">追加 ＋</span>
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