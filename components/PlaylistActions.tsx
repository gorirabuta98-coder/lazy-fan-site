'use client'

import { useState, useEffect } from 'react'
import {
  getUserPlaylists,
  createPlaylist,
  deletePlaylist,
} from '@/app/actions/playlists'

export default function PlaylistActions() {
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPlaylistName, setNewPlaylistName] = useState('')

  useEffect(() => {
    loadPlaylists()
  }, [])

  const loadPlaylists = async () => {
    setLoading(true)
    const data = await getUserPlaylists()
    setPlaylists(data || [])
    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) return

    const res = await createPlaylist(newPlaylistName.trim())
    if (res.success) {
      setNewPlaylistName('')
      loadPlaylists()
    } else {
      alert(res.error || '作成に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return
    const res = await deletePlaylist(id)
    if (res.success) {
      loadPlaylists()
    } else {
      alert(res.error || '削除に失敗しました')
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="新しいマイリスト名"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold"
        >
          作成
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-gray-400">読み込み中...</p>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className="flex justify-between items-center p-2 border rounded-lg text-sm font-bold"
            >
              <span>{pl.name}</span>
              <button
                onClick={() => handleDelete(pl.id)}
                className="text-xs text-red-500 hover:text-red-700 font-bold"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}