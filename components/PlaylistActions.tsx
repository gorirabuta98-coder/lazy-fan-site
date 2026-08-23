'use client'

import { useState } from 'react'
import { createPlaylist, deletePlaylist } from '@/app/actions/playlists'
import { getDeviceId } from '@/lib/deviceId'

export default function PlaylistActions() {
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistName.trim() || loading) return

    setLoading(true)
    const res = await createPlaylist(newPlaylistName.trim(), getDeviceId())
    setLoading(false)

    if (res.success) {
      setNewPlaylistName('')
    } else {
      alert((res as any).error || '作成に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return

    setLoading(true)
    const res = await deletePlaylist(id, getDeviceId())
    setLoading(false)

    if (res.success) {
      // 成功時の処理
    } else {
      alert((res as any).error || '削除に失敗しました')
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
          disabled={loading || !newPlaylistName.trim()}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg disabled:opacity-50"
        >
          {loading ? '処理中...' : '作成'}
        </button>
      </form>
    </div>
  )
}