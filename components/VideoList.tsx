'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddToListModal, { PlaylistWithItems } from '@/components/AddToListModal'
import ShareModal from '@/components/ShareModal'
import HeaderAuth from '@/components/HeaderAuth'

interface Video {
  id: string
  title: string
  publishedAt?: string
  published_at?: string
  thumbnailUrl?: string
  thumbnail_url?: string
}

interface VideoListProps {
  initialVideos: Video[]
  totalCount: number
  playlists?: PlaylistWithItems[]
  pageSize: number
  currentPart: number
}

export function VideoList({
  initialVideos,
  totalCount,
  playlists: initialPlaylists = [],
  pageSize,
  currentPart,
}: VideoListProps) {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>(initialPlaylists)
  const [activeTab, setActiveTab] = useState<'all' | 'mylist'>('all')
  const [selectedVideosForModal, setSelectedVideosForModal] = useState<Video[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // 共有モーダル用
  const [sharingPlaylist, setSharingPlaylist] = useState<{ id: string; title: string } | null>(null)

  // 新規マイリスト作成用
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // マイリスト編集用
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const totalParts = Math.ceil(totalCount / pageSize)

  const reloadPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists')
      if (res.ok) {
        const updated = await res.json()
        setPlaylists(updated)
      }
    } catch (error) {
      console.error('マイリスト取得エラー:', error)
    }
  }

  useEffect(() => {
    reloadPlaylists()
  }, [])

  useEffect(() => {
    if (activeTab === 'mylist') {
      reloadPlaylists()
    }
  }, [activeTab])

  // マイリスト新規作成
  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) {
      alert('マイリストのタイトルを入力してください。')
      return
    }

    setIsCreatingList(true)
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPlaylistTitle.trim() }),
      })

      if (res.ok) {
        await reloadPlaylists()
        setNewPlaylistTitle('')
        setShowCreateForm(false)
        alert('新しいマイリストを作成しました！')
      } else {
        alert('マイリストの作成に失敗しました。')
      }
    } catch (error) {
      console.error('作成失敗:', error)
      alert('エラーが発生しました。')
    } finally {
      setIsCreatingList(false)
    }
  }

  // マイリスト名前変更
  const handleRenamePlaylist = async (playlistId: string) => {
    if (!editingTitle.trim()) return

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() }),
      })

      if (res.ok) {
        await reloadPlaylists()
        setEditingPlaylistId(null)
        setEditingTitle('')
      } else {
        alert('名前の変更に失敗しました。')
      }
    } catch (error) {
      console.error('名前変更失敗:', error)
      alert('エラーが発生しました。')
    }
  }

  // マイリスト削除
  const handleDeletePlaylist = async (playlistId: string, title: string) => {
    if (!confirm(`マイリスト「${title}」を削除してもよろしいですか？`)) return

    try {
      const res = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await reloadPlaylists()
      } else {
        alert('マイリストの削除に失敗しました。')
      }
    } catch (error) {
      console.error('削除失敗:', error)
      alert('エラーが発生しました。')
    }
  }

  // マイリストから特定動画を削除
  const handleDeleteItem = async (playlistId: string, itemId?: string, videoId?: string) => {
    if (!confirm('この動画をマイリストから削除しますか？')) return

    try {
      const res = await fetch(`/api/playlists/${playlistId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, videoId }),
      })

      if (res.ok) {
        await reloadPlaylists()
      } else {
        alert('動画の削除に失敗しました。')
      }
    } catch (error) {
      console.error('動画削除失敗:', error)
      alert('エラーが発生しました。')
    }
  }

  // YouTube同期処理
  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      if (!res.ok) await fetch('/api/sync')
      router.refresh()
      alert('YouTubeとの同期が完了しました！')
    } catch (error) {
      console.error('同期エラー:', error)
      alert('同期処理を実行しました。')
      router.refresh()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedVideoIds.length === initialVideos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(initialVideos.map((v) => v.id))
    }
  }

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleSingleAddToMyList = (video: Video) => {
    setSelectedVideosForModal([video])
  }

  const handleBatchAddToMyList = () => {
    if (selectedVideoIds.length === 0) return
    const targets = initialVideos.filter((v) => selectedVideoIds.includes(v.id))
    setSelectedVideosForModal(targets)
  }

  return (
    <div className="space-y-6">
      {/* 上部ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b border-gray-100 gap-4">
        <div className="flex items-center gap-3">
          {activeTab === 'all' && (
            <>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                📺 動画一覧
              </h2>
              <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full font-medium">
                全 {totalCount} 件
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                同期中...
              </>
            ) : (
              'YouTube同期'
            )}
          </button>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'all'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              動画一覧
            </button>
            <button
              onClick={() => setActiveTab('mylist')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'mylist'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              📁 マイリスト
            </button>
          </div>

          {/* 🔑 ログイン/ログアウト切り替えボタン */}
          <HeaderAuth />
        </div>
      </div>

      {/* 動画一覧表示 */}
      {activeTab === 'all' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-end items-center gap-2">
            {selectedVideoIds.length > 0 && (
              <button
                onClick={handleBatchAddToMyList}
                className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-700 transition"
              >
                選択中 ({selectedVideoIds.length}) をマイリストに追加
              </button>
            )}
            <button
              onClick={handleToggleSelectAll}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition"
            >
              {selectedVideoIds.length === initialVideos.length && initialVideos.length > 0
                ? '全解除'
                : 'ページ内全選択'}
            </button>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              ページ選択 (Part 1 ～ Part {totalParts})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: totalParts }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/?part=${p}`)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    currentPart === p
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Part {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {initialVideos.map((video) => {
              const isSelected = selectedVideoIds.includes(video.id)
              const thumb =
                video.thumbnailUrl ||
                video.thumbnail_url ||
                `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
              const dateStr = video.publishedAt || video.published_at || ''

              return (
                <div
                  key={video.id}
                  className={`relative bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                    isSelected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100'
                  }`}
                >
                  <div className="relative aspect-video">
                    <button
                      onClick={() => toggleSelectVideo(video.id)}
                      className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border-2 transition flex items-center justify-center ${
                        isSelected
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'border-white/80 bg-black/30 hover:bg-black/50'
                      }`}
                    >
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </button>
                    <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug">
                        {video.title}
                      </p>
                      {dateStr && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {dateStr.split('T')[0]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleSingleAddToMyList(video)}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-100 transition"
                    >
                      + マイリストに追加
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* マイリスト一覧表示 */}
      {activeTab === 'mylist' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">マイリスト一覧</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              ➕ 新規マイリスト作成
            </button>
          </div>

          {/* 新規マイリスト作成フォーム */}
          {showCreateForm && (
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-3">
              <input
                type="text"
                placeholder="好きなマイリスト名を入力（例: 神回まとめ）"
                value={newPlaylistTitle}
                onChange={(e) => setNewPlaylistTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePlaylist()
                }}
                className="flex-1 px-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreatePlaylist}
                disabled={isCreatingList}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 text-white text-xs font-bold px-5 py-2 rounded-xl transition cursor-pointer"
              >
                {isCreatingList ? '作成中...' : '作成'}
              </button>
            </div>
          )}

          {playlists.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-gray-100 text-gray-400 text-sm space-y-3">
              <p>マイリストがありません。</p>
              <p className="text-xs text-gray-500">「➕ 新規マイリスト作成」ボタンから箱を作成してください。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {playlists.map((pl) => {
                const items = pl.playlist_items || []
                const isExpanded = expandedPlaylistId === pl.id
                const isEditing = editingPlaylistId === pl.id

                return (
                  <div
                    key={pl.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenamePlaylist(pl.id)}
                            className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-lg font-bold"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingPlaylistId(null)}
                            className="bg-gray-100 text-gray-600 text-xs px-2 py-1.5 rounded-lg"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-xl">📁</span>
                          <h3 className="font-bold text-base text-gray-800">{pl.title}</h3>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSharingPlaylist({ id: pl.id, title: pl.title })}
                            className="p-1.5 text-xs text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition flex items-center gap-1 font-bold"
                            title="共有・URLコピー"
                          >
                            🔗 共有
                          </button>
                          <button
                            onClick={() => {
                              setEditingPlaylistId(pl.id)
                              setEditingTitle(pl.title)
                            }}
                            className="p-1.5 text-xs text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
                            title="名前変更"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                            className="p-1.5 text-xs text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="リスト削除"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-400">動画 {items.length} 件</p>

                    {items.length > 0 && !isExpanded && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {items.slice(0, 4).map((item: any, idx) => (
                          <div
                            key={idx}
                            className="w-28 flex-shrink-0 aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-100"
                          >
                            <img
                              src={
                                item.thumbnail_url ||
                                item.thumbnailUrl ||
                                `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                              }
                              alt={item.title || item.video_title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedPlaylistId(isExpanded ? null : pl.id)}
                      className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold text-center border border-gray-100 transition"
                    >
                      {isExpanded ? '▲ 動画一覧を閉じる' : '▼ 動画一覧を表示'}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                        {items.map((item: any, idx) => (
                          <div
                            key={idx}
                            className="relative border border-gray-100 rounded-xl overflow-hidden bg-gray-50 p-2 space-y-1 group"
                          >
                            <button
                              onClick={() => handleDeleteItem(pl.id, item.id, item.video_id)}
                              className="absolute top-3 right-3 z-10 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition"
                              title="この動画をマイリストから削除"
                            >
                              ✕
                            </button>
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <img
                                src={
                                  item.thumbnail_url ||
                                  item.thumbnailUrl ||
                                  `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                                }
                                alt={item.title || item.video_title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-[10px] font-bold text-gray-700 line-clamp-2">
                              {item.title || item.video_title}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* マイリスト追加モーダル */}
      {selectedVideosForModal.length > 0 && (
        <AddToListModal
          selectedVideos={selectedVideosForModal}
          playlists={playlists}
          onClose={() => {
            setSelectedVideosForModal([])
            setSelectedVideoIds([])
          }}
          onPlaylistsUpdated={(updated) => setPlaylists(updated)}
        />
      )}

      {/* 共有モーダル */}
      {sharingPlaylist && (
        <ShareModal
          playlist={sharingPlaylist}
          onClose={() => setSharingPlaylist(null)}
        />
      )}
    </div>
  )
}