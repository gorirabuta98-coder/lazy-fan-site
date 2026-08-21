'use client'

import { useState } from 'react'

export default function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()

      if (res.ok && data.success) {
        alert('同期が完了しました！')
        // 同期後に自動で画面を更新
        window.location.reload()
      } else {
        alert(`エラー: ${data.error || '同期に失敗しました'}`)
      }
    } catch (error) {
      console.error(error)
      alert('同期処理中にエラーが発生しました')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={isSyncing}
      className={`px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 flex items-center gap-2 ${
        isSyncing
          ? 'bg-gray-400 text-white cursor-not-allowed opacity-70'
          : 'bg-slate-900 hover:bg-slate-800 active:scale-95 text-white shadow-sm cursor-pointer'
      }`}
    >
      {isSyncing ? (
        <>
          <span className="animate-spin inline-block">🔄</span>
          <span>同期中...</span>
        </>
      ) : (
        <span>YouTube同期</span>
      )}
    </button>
  )
}