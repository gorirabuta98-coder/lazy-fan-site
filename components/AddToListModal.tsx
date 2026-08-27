'use client'

import { useState } from 'react'

export interface PlaylistItem {
  id: string
  video_id: string
  video_title?: string
  title?: string
  thumbnail_url?: string
  thumbnailUrl?: string
}

export interface PlaylistWithItems {
  id: string
  title: string
  playlist_items?: PlaylistItem[]
}

interface Video {
  id: string
  title: string
  thumbnailUrl?: string
  thumbnail_url?: string
}

interface AddToListModalProps {
  selectedVideos: Video[]
  playlists: PlaylistWithItems[]
  onClose: () => void
  onPlaylistsUpdated: (updated: PlaylistWithItems[]) => void
}

export default function AddToListModal({
  selectedVideos,
  playlists,
  onClose,
  onPlaylistsUpdated,
}: AddToListModalProps) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async () => {
    if (!selectedPlaylistId) {
      alert('追加先のマイリストを選択してください。')
      return
    }

    setIsSubmitting(true)
    try {
      // 選択されたすべての動画を追加
      const promises = selectedVideos.map((video) =>
        fetch(`/api/playlists/${selectedPlaylistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            videoTitle: video.title,
            thumbnailUrl:
              video.thumbnailUrl ||
              video.thumbnail_url ||
              `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
          }),
        })
      )

      await Promise.all(promises)

      // 最新のリスト一覧を再取得
      const res = await fetch('/api/playlists')
      if (res.ok) {
        const updated = await res.json()
        onPlaylistsUpdated(updated)
      }

      alert(`${selectedVideos.length} 件の動画をマイリストに追加しました！`)
      onClose()
    } catch (error) {
      console.error('追加失敗:', error)
      alert('マイリストへの追加に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-gray-900">📁 マイリストに追加</h3>

        <p className="text-xs text-gray-500">
          選択中: <span className="font-bold text-red-600">{selectedVideos.length} 件</span> の動画
        </p>

        {playlists.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs space-y-2">
            <p className="font-bold">⚠️ マイリストがありません</p>
            <p>先に「📁 マイリスト」タブから新しいマイリストを作成してください。</p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-700">追加先のリストを選択</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {playlists.map((pl) => (
                <label
                  key={pl.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedPlaylistId === pl.id
                      ? 'border-red-500 bg-red-50/50 text-red-900 font-bold ring-1 ring-red-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="playlist"
                      value={pl.id}
                      checked={selectedPlaylistId === pl.id}
                      onChange={() => setSelectedPlaylistId(pl.id)}
                      className="accent-red-600"
                    />
                    <span className="text-xs">{pl.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    ({pl.playlist_items?.length || 0}件)
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={handleAdd}
              disabled={isSubmitting || !selectedPlaylistId}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition mt-4"
            >
              {isSubmitting ? '追加中...' : 'このリストに追加する'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}