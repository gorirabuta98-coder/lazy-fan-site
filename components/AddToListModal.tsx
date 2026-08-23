'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPlaylist, addToPlaylist } from '@/app/actions/playlists'
import { getDeviceId } from '@/lib/deviceId'

export interface PlaylistWithItems {
  id: string
  title: string
  created_at?: string
  playlist_items?: any[]
}

interface AddToListModalProps {
  videoId: string
  videoTitle: string
  thumbnailUrl: string
  onClose: () => void
  playlists?: PlaylistWithItems[]
}

export default function AddToListModal({
  videoId,
  videoTitle,
  thumbnailUrl,
  onClose,
  playlists = [],
}: AddToListModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing')
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const router = useRouter()

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isProcessing])

  // モーダルを閉じて状態を初期化
  const handleClose = () => {
    if (isProcessing) return
    setIsOpen(false)
    setNewPlaylistTitle('')
    setSearchQuery('')
    setMessage(null)
    setProcessingId(null)
    setActiveTab('existing')
    onClose()
  }

  // 新規マイリスト作成 ＆ 動画追加
  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaylistTitle.trim() || isProcessing) return

    setIsProcessing(true)
    setMessage(null)

    try {
      const deviceId = getDeviceId()
      const res = await createPlaylist(newPlaylistTitle.trim(), deviceId)

      if (res.success && res.playlist?.id) {
        await addToPlaylist(res.playlist.id, {
          id: videoId,
          title: videoTitle,
          thumbnail_url: thumbnailUrl,
        }, deviceId)

        setMessage({ type: 'success', text: `「${newPlaylistTitle}」を作成して追加しました！` })
        setNewPlaylistTitle('')

        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
          router.refresh()
        }, 1200)
      } else {
        setMessage({ type: 'error', text: res.error || 'マイリストの作成に失敗しました。' })
      }
    } catch (error) {
      console.error('新規追加エラー:', error)
      setMessage({ type: 'error', text: '予期せぬエラーが発生しました。' })
    } finally {
      setIsProcessing(false)
    }
  }

  // 既存マイリストへの動画追加
  const handleAddToExisting = async (playlistId: string, playlistTitle: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    setProcessingId(playlistId)
    setMessage(null)

    try {
      const deviceId = getDeviceId()
      const res = await addToPlaylist(playlistId, {
        id: videoId,
        title: videoTitle,
        thumbnail_url: thumbnailUrl,
      }, deviceId)

      if (res.success) {
        setMessage({ type: 'success', text: `「${playlistTitle}」に追加しました！` })

        setTimeout(() => {
          setIsOpen(false)
          setMessage(null)
          setProcessingId(null)
          router.refresh()
        }, 1000)
      } else {
        setMessage({ type: 'error', text: res.error || '追加に失敗しました。' })
      }
    } catch (error) {
      console.error('既存追加エラー:', error)
      setMessage({ type: 'error', text: '予期せぬエラーが発生しました。' })
    } finally {
      setIsProcessing(false)
      setProcessingId(null)
    }
  }

  // 既存マイリストの検索フィルタリング
  const filteredPlaylists = playlists.filter((pl) =>
    (pl.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>マイリストに追加</span>
      </button>

      {/* モーダルオーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h3 className="font-extrabold text-gray-900 text-base">マイリストに追加</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {/* 対象動画の簡易表示 */}
            <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
              <img
                src={thumbnailUrl}
                alt={videoTitle}
                className="w-16 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
              />
              <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                {videoTitle}
              </p>
            </div>

            {/* メッセージ通知エリア */}
            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-bold transition-all ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* タブ切り替えボタン */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('existing')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'existing'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                既存のリスト ({playlists.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'new'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                新規作成
              </button>
            </div>

            {/* タブ 1: 既存マイリスト選択 */}
            {activeTab === 'existing' && (
              <div className="space-y-3">
                {playlists.length > 5 && (
                  <input
                    type="text"
                    placeholder="リスト名を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}

                {filteredPlaylists.length > 0 ? (
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {filteredPlaylists.map((pl) => {
                      const isCurrentProcessing = processingId === pl.id
                      const isAlreadyAdded = pl.playlist_items?.some(
                        (item: any) => item.video_id === videoId
                      )

                      return (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => handleAddToExisting(pl.id, pl.title)}
                          disabled={isProcessing}
                          className={`w-full text-left flex items-center justify-between p-3 rounded-xl border transition-all text-xs font-bold ${
                            isAlreadyAdded
                              ? 'bg-gray-50 border-gray-200 text-gray-400'
                              : 'bg-white border-gray-200 hover:border-red-500 hover:bg-red-50/40 text-gray-800'
                          } disabled:opacity-60`}
                        >
                          <span className="truncate">{pl.title}</span>
                          <span className="text-xs font-bold whitespace-nowrap ml-2 text-red-600">
                            {isCurrentProcessing
                              ? '追加中...'
                              : isAlreadyAdded
                              ? '追加済み'
                              : '＋ 追加'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400">
                      {searchQuery ? '検索結果がありません' : 'マイリストがまだありません'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* タブ 2: 新規マイリスト作成 */}
            {activeTab === 'new' && (
              <form onSubmit={handleCreateAndAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    新しいマイリスト名
                  </label>
                  <input
                    type="text"
                    placeholder="例：お気に入り、作業用BGM..."
                    value={newPlaylistTitle}
                    onChange={(e) => setNewPlaylistTitle(e.target.value)}
                    disabled={isProcessing}
                    className="w-full text-xs border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim() || isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-colors disabled:opacity-40 shadow-sm"
                >
                  {isProcessing ? '作成して追加中...' : '作成して追加する'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}