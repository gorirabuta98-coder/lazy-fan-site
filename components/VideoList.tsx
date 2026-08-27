'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddToListModal, { PlaylistWithItems } from '@/components/AddToListModal'
import ShareModal from '@/components/ShareModal'
import HeaderAuth from '@/components/HeaderAuth'
import GuideModal from '@/components/GuideModal'
import { createClient } from '@/lib/supabase/client'

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
  const supabase = createClient()

  // 👤 ログインユーザーの状態管理
  const [user, setUser] = useState<any>(null)

  // 3つのタブ状態 ('all' | 'search' | 'mylist')
  const [activeTab, setActiveTab] = useState<'all' | 'search' | 'mylist'>('all')

  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>(initialPlaylists)
  const [selectedVideosForModal, setSelectedVideosForModal] = useState<Video[]>([])
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // 📖 使い方ガイドモーダル用State
  const [showGuide, setShowGuide] = useState(false)

  // 🔗 開く先選択モーダル用State
  const [targetVideo, setTargetVideo] = useState<{ id: string; title: string } | null>(null)

  // 🔍 動画検索タブ用State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Video[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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

  // 🔒 ログイン状態の監視
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 🔍 全動画を対象とした検索処理
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setHasSearched(true)
    setSelectedVideoIds([])

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', `%${searchQuery.trim()}%`)
        .order('published_at', { ascending: false })

      if (error) {
        console.error('検索エラー:', error)
      } else {
        setSearchResults(data || [])
      }
    } catch (err) {
      console.error('検索例外:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const reloadPlaylists = async () => {
    if (!user) return
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
    if (user) {
      reloadPlaylists()
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 'mylist' && user) {
      reloadPlaylists()
    }
  }, [activeTab, user])

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

  const currentTabVideos = activeTab === 'all' ? initialVideos : searchResults

  const handleToggleSelectAll = () => {
    if (selectedVideoIds.length === currentTabVideos.length) {
      setSelectedVideoIds([])
    } else {
      setSelectedVideoIds(currentTabVideos.map((v) => v.id))
    }
  }

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )
  }

  const handleSingleAddToMyList = (video: Video) => {
    if (!user) {
      alert('マイリスト機能を利用するにはログインが必要です。画面右上のボタンからログインしてください。')
      return
    }

    if (selectedVideoIds.length > 0) {
      const targets = currentTabVideos.filter((v) => selectedVideoIds.includes(v.id))
      if (!selectedVideoIds.includes(video.id)) {
        targets.push(video)
      }
      setSelectedVideosForModal(targets)
    } else {
      setSelectedVideosForModal([video])
    }
  }

  const handleBatchAddToMyList = () => {
    if (!user) {
      alert('マイリスト機能を利用するにはログインが必要です。画面右上のボタンからログインしてください。')
      return
    }

    if (selectedVideoIds.length === 0) return
    const targets = currentTabVideos.filter((v) => selectedVideoIds.includes(v.id))
    setSelectedVideosForModal(targets)
  }

  // 📲 YouTubeアプリまたはブラウザで開く処理
  const openInApp = (videoId: string) => {
    window.location.href = `youtube://watch?v=${videoId}`
    setTargetVideo(null)
  }

  const openInBrowser = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer')
    setTargetVideo(null)
  }

  // 🎬 動画カード共通レンダリング関数
  const renderVideoCard = (video: Video) => {
    const isSelected = selectedVideoIds.includes(video.id)
    const thumb =
      video.thumbnailUrl ||
      video.thumbnail_url ||
      `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`
    const dateStr = video.publishedAt || video.published_at || ''

    return (
      <div
        key={video.id}
        className={`relative bg-white border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition ${
          isSelected ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-100'
        }`}
      >
        {/* 🎬 サムネイル */}
        <div
          onClick={() => setTargetVideo({ id: video.id, title: video.title })}
          className="relative aspect-video cursor-pointer group"
        >
          {/* チェックボックス */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleSelectVideo(video.id)
            }}
            className={`absolute top-1.5 left-1.5 z-10 w-7 h-7 rounded-lg border-2 transition flex items-center justify-center ${
              isSelected
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-white/80 bg-black/40 hover:bg-black/60'
            }`}
          >
            {isSelected && <span className="text-xs font-bold">✓</span>}
          </button>

          <img src={thumb} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />

          {/* アイコン表示 */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition flex items-center justify-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
              <span className="text-xs sm:text-sm">▶</span>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-3 space-y-2 flex-1 flex flex-col justify-between">
          <div
            onClick={() => setTargetVideo({ id: video.id, title: video.title })}
            className="cursor-pointer"
          >
            <p className="text-[11px] sm:text-xs font-bold text-gray-800 line-clamp-2 leading-snug hover:text-red-600 transition">
              {video.title}
            </p>
            {dateStr && (
              <p className="text-[9px] sm:text-[10px] text-gray-400 mt-1">{dateStr.split('T')[0]}</p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleSingleAddToMyList(video)
            }}
            className="w-full py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold border border-gray-100 transition active:scale-95 cursor-pointer"
          >
            + リスト追加
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
      {/* 📱 上部ヘッダー ＆ ナビゲーション */}
      <div className="flex flex-col gap-3 py-2 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-1.5">
              {activeTab === 'all' && '📺 動画一覧'}
              {activeTab === 'search' && '🔍 動画検索'}
              {activeTab === 'mylist' && '📁 マイリスト'}
            </h2>
            {activeTab === 'all' && (
              <span className="bg-gray-100 text-gray-500 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium">
                {totalCount}件
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] sm:text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl transition cursor-pointer"
            >
              ❓ 使い方
            </button>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-bold text-[11px] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSyncing ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                  同期中
                </>
              ) : (
                '同期'
              )}
            </button>
            <HeaderAuth />
          </div>
        </div>

        {/* 3分割タブ */}
        <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-2xl text-center">
          <button
            onClick={() => {
              setActiveTab('all')
              setSelectedVideoIds([])
            }}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            動画一覧
          </button>
          <button
            onClick={() => {
              setActiveTab('search')
              setSelectedVideoIds([])
            }}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'search'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔍 検索
          </button>
          <button
            onClick={() => {
              setActiveTab('mylist')
              setSelectedVideoIds([])
            }}
            className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'mylist'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📁 マイリスト
          </button>
        </div>
      </div>

      {/* 1️⃣ タブ：動画一覧 */}
      {activeTab === 'all' && (
        <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1.5 min-w-max">
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium mr-1">Part:</span>
                {Array.from({ length: totalParts }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => router.push(`/?part=${p}`)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      currentPart === p
                        ? 'bg-red-600 text-white font-bold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between sm:justify-end items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
              <span className="text-[11px] text-gray-400 sm:hidden">
                {selectedVideoIds.length > 0 ? `${selectedVideoIds.length}件選択中` : ''}
              </span>
              <button
                onClick={handleToggleSelectAll}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition ml-auto sm:ml-0 cursor-pointer"
              >
                {selectedVideoIds.length === initialVideos.length && initialVideos.length > 0
                  ? '全解除'
                  : '表示中を全選択'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {initialVideos.map(renderVideoCard)}
          </div>
        </div>
      )}

      {/* 2️⃣ タブ：動画検索 */}
      {activeTab === 'search' && (
        <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 space-y-4 sm:space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="キーワード検索（例: ドッキリ）"
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setHasSearched(false)
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer flex-shrink-0"
            >
              {isSearching ? '検索中' : '検索'}
            </button>
          </form>

          {hasSearched && !isSearching && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-600">
                検索結果: <span className="text-red-600">{searchResults.length}</span> 件
              </p>

              {searchResults.length > 0 && (
                <button
                  onClick={handleToggleSelectAll}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                >
                  {selectedVideoIds.length === searchResults.length ? '全解除' : '全選択'}
                </button>
              )}
            </div>
          )}

          {!hasSearched && !isSearching && (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <p className="text-2xl">🔍</p>
              <p className="text-xs font-medium">全動画（{totalCount}件）から検索できます</p>
            </div>
          )}

          {hasSearched && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
              一致する動画は見つかりませんでした。
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {searchResults.map(renderVideoCard)}
            </div>
          )}
        </div>
      )}

      {/* 3️⃣ タブ：マイリスト一覧 */}
      {activeTab === 'mylist' && (
        !user ? (
          <div className="bg-white p-8 sm:p-12 rounded-2xl sm:rounded-3xl text-center border border-gray-100 shadow-sm space-y-3 py-12">
            <div className="text-3xl">🔒</div>
            <h3 className="text-sm sm:text-base font-bold text-gray-800">マイリストの閲覧にはログインが必要です</h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              画面右上のボタンからログインを行ってください。
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">マイリスト一覧</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition shadow-sm flex items-center gap-1 cursor-pointer"
              >
                ➕ 新規作成
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-2">
                <input
                  type="text"
                  placeholder="マイリスト名を入力"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-base sm:text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreatePlaylist}
                  disabled={isCreatingList}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition cursor-pointer"
                >
                  作成
                </button>
              </div>
            )}

            {playlists.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 text-gray-400 text-xs space-y-2">
                <p>マイリストがありません。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playlists.map((pl) => {
                  const items = pl.playlist_items || []
                  const isExpanded = expandedPlaylistId === pl.id
                  const isEditing = editingPlaylistId === pl.id

                  return (
                    <div
                      key={pl.id}
                      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="flex-1 px-2 py-1 text-base sm:text-xs border rounded-lg focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenamePlaylist(pl.id)}
                              className="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-lg font-bold"
                            >
                              保存
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-500 text-lg">📁</span>
                            <h3 className="font-bold text-sm text-gray-800">{pl.title}</h3>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSharingPlaylist({ id: pl.id, title: pl.title })}
                              className="p-1 text-xs text-blue-500 font-bold hover:bg-blue-50 rounded-lg cursor-pointer"
                            >
                              🔗 共有
                            </button>
                            <button
                              onClick={() => {
                                setEditingPlaylistId(pl.id)
                                setEditingTitle(pl.title)
                              }}
                              className="p-1 text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeletePlaylist(pl.id, pl.title)}
                              className="p-1 text-xs text-red-400 hover:text-red-600 cursor-pointer"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-gray-400">動画 {items.length} 件</p>

                      {items.length > 0 && !isExpanded && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {items.slice(0, 4).map((item: any, idx) => (
                            <div
                              key={idx}
                              onClick={() => setTargetVideo({ id: item.video_id, title: item.title || item.video_title })}
                              className="w-24 flex-shrink-0 aspect-video rounded-lg overflow-hidden border border-gray-100 bg-gray-100 cursor-pointer relative group"
                            >
                              <img
                                src={
                                  item.thumbnail_url ||
                                  item.thumbnailUrl ||
                                  `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                                }
                                alt={item.title || item.video_title}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <span className="text-white text-[10px] bg-red-600/80 px-1.5 py-0.5 rounded-full">▶</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedPlaylistId(isExpanded ? null : pl.id)}
                        className="w-full py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold text-center border border-gray-100 transition cursor-pointer"
                      >
                        {isExpanded ? '▲ 閉じる' : '▼ 動画一覧を表示'}
                      </button>

                      {isExpanded && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                          {items.map((item: any, idx) => (
                            <div
                              key={idx}
                              onClick={() => setTargetVideo({ id: item.video_id, title: item.title || item.video_title })}
                              className="relative border border-gray-100 rounded-xl overflow-hidden bg-gray-50 p-1.5 space-y-1 cursor-pointer group"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteItem(pl.id, item.id, item.video_id)
                                }}
                                className="absolute top-2 right-2 z-10 bg-black/60 text-white w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center hover:bg-black"
                              >
                                ✕
                              </button>
                              <div className="aspect-video rounded-lg overflow-hidden relative">
                                <img
                                  src={
                                    item.thumbnail_url ||
                                    item.thumbnailUrl ||
                                    `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`
                                  }
                                  alt={item.title || item.video_title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold bg-red-600/80 px-2 py-0.5 rounded-full">▶</span>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-gray-700 line-clamp-2 leading-tight group-hover:text-red-600">
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
        )
      )}

      {/* 📱 スマホ用 Sticky Bottom Bar */}
      {selectedVideoIds.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur text-white p-3 rounded-2xl shadow-2xl flex justify-between items-center max-w-md mx-auto animate-in slide-in-from-bottom-5">
          <div className="text-xs pl-2">
            <span className="font-bold text-red-400">{selectedVideoIds.length}</span> 件選択中
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedVideoIds([])}
              className="text-xs text-gray-400 hover:text-white px-2 py-1.5 cursor-pointer"
            >
              解除
            </button>
            <button
              onClick={handleBatchAddToMyList}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
            >
              マイリストに追加
            </button>
          </div>
        </div>
      )}

      {/* 📲 どこで開くか選択するポップアップモーダル */}
      {targetVideo && (
        <div
          onClick={() => setTargetVideo(null)}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 border border-gray-100 text-center"
          >
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-snug">
                {targetVideo.title}
              </h3>
              <p className="text-xs text-gray-400">再生方法を選択してください</p>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* YouTubeアプリで開く（Premium広告なし） */}
              <button
                onClick={() => openInApp(targetVideo.id)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer active:scale-98"
              >
                <span>📱</span> YouTubeアプリで開く
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-normal">推奨・広告なし</span>
              </button>

              {/* ブラウザで開く */}
              <button
                onClick={() => openInBrowser(targetVideo.id)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <span>🌐</span> ブラウザで開く
              </button>

              {/* キャンセル */}
              <button
                onClick={() => setTargetVideo(null)}
                className="w-full py-2 text-xs text-gray-400 font-bold hover:text-gray-600 transition cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📖 使い方ガイドモーダル */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      {/* モーダル群 */}
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

      {sharingPlaylist && (
        <ShareModal
          playlist={sharingPlaylist}
          onClose={() => setSharingPlaylist(null)}
        />
      )}
    </div>
  )
}