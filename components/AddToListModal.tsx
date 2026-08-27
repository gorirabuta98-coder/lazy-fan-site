'use client'

import { useState } from 'react'

export interface PlaylistWithItems {
  id: string
  title: string
  playlist_items?: any[]
}

interface Video {
  id: string
  title: string
  publishedAt?: string
  published_at?: string
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
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null)

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoadingPlaylistId(playlistId)

    try {
      // 💡 Promise.all で選択された全動画を一括で非同期登録
      const requests = selectedVideos.map((video) =>
        fetch(`/api/playlists/${playlistId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            thumbnailUrl:
              video.thumbnailUrl ||
              video.thumbnail_url ||
              `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
          }),
        })
      )

      await Promise.all(requests)

      // 最新のマイリスト一覧を取得して更新
      const res = await fetch('/api/playlists')
      if (res.ok) {
        const updated = await res.json()
        onPlaylistsUpdated(updated)
      }

      alert(`${selectedVideos.length}件の動画をマイリストに追加しました！`)
      onClose()
    } catch (error) {
      console.error('マイリスト追加エラー:', error)
      alert('追加中にエラーが発生しました。')
    } finally {
      setLoadingPlaylistId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-800 text-sm">
            マイリストに追加 ({selectedVideos.length} 件選択中)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* 選択中の動画サムネイルプレビュー */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {selectedVideos.map((v) => (
            <img
              key={v.id}
              src={
                v.thumbnailUrl ||
                v.thumbnail_url ||
                `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`
              }
              alt={v.title}
              className="w-20 aspect-video object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
          ))}
        </div>

        {/* マイリスト選択一覧 */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              マイリストがありません。「マイリスト」タブから作成してください。
            </p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                disabled={loadingPlaylistId === pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className="w-full text-left p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 flex items-center justify-between transition group cursor-pointer disabled:opacity-50"
              >
                <span className="text-xs font-bold text-gray-700 group-hover:text-red-600">
                  📁 {pl.title}
                </span>
                <span className="text-[10px] text-gray-400">
                  {loadingPlaylistId === pl.id ? '追加中...' : '+ 追加'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}