'use client'

import { useState } from 'react'
import { syncVideosFromYouTube } from '@/app/actions/videos'

export default function SyncButton() {
  const [loading, setLoading] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    const res = await syncVideosFromYouTube()
    if (res.success) {
      alert(`同期完了: ${res.count} 件の動画を更新しました`)
    } else {
      alert(`エラー: ${res.error}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="px-3 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
    >
      {loading ? '同期中...' : 'YouTube同期'}
    </button>
  )
}