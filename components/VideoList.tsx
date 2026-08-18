'use client'

import { useState } from 'react'
import { getVideosByPart, Video } from '@/app/actions/videos'
import { addMultipleToPlaylist } from '@/app/actions/playlists'
import AddToListModal from '@/components/AddToListModal'

interface VideoListProps {
  initialVideos: Video[]
  totalCount?: number
  playlists: any[]
}

export default function VideoList({
  initialVideos,
  totalCount = 0,
  playlists = [],
}: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [currentPart, setCurrentPart] = useState<number>(1)
  const [total, setTotal] = useState<number>(totalCount)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 検索キーワード State
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 複数選択・一括追加用 State
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([])
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('')
  const [isAdding, setIsAdding] = useState<boolean>(false)

  const totalParts = 10
  const pageSize = Math.max(1, Math.ceil(total / totalParts))

  // 検索フィルター処理
  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // チェックボックス選択 / 解除
  const toggleSelect = (video: Video) => {
    setSelectedVideos((prev) =>
      prev.some((v) => v.id === video.id)
        ? prev.filter((v) => v.id !== video.id)
        : [...prev, video]
    )
  }

  // ページ内全選択 / 全解除
  const toggleSelectAll = () => {
    if (selectedVideos.length === filteredVideos.length) {
      setSelectedVideos([])
    } else {
      setSelectedVideos([...filteredVideos])
    }
  }

  // 一括追加の実行
  const handleBatchAdd = async () => {
    if (!targetPlaylistId || selectedVideos.length === 0) return
    setIsAdding(true)
    try {
      await addMultipleToPlaylist(targetPlaylistId, selectedVideos)
      alert(`${selectedVideos.length} 件の動画をマイリストに追加しました！`)
      setSelectedVideos([])
      setTargetPlaylistId('')
    } catch (e) {
      alert('追加に失敗しました。時間をおいて再度お試しください。')
    } finally {
      setIsAdding(false)
    }
  }

  // Part切り替え処理
  const handleSelectPart = async (partNum: number) => {
    if (partNum === currentPart || isLoading) return
    setIsLoading(true)

    try {
      const res = await getVideosByPart(partNum, pageSize)
      if (res?.videos) setVideos(res.videos)
      if (typeof res?.totalCount === 'number') setTotal(res.totalCount)
      setCurrentPart(partNum)
      setSelectedVideos([]) // Part変更時は選択クリア
    } catch (error) {
      console.error('Part取得エラー:', error)
    } finally {
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 日付フォーマット処理
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
  }

  return (
    <section className="space-y-6">
      {/* 1. ヘッダー・検索・Partナビゲーション */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <h2 className="text-xl font-extrabold text-gray-900">動画一覧</h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              全 {total} 件
            </span>
          </div>

          {/* 検索窓 & 全選択ボタン */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {filteredVideos.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors whitespace-nowrap"
              >
                {selectedVideos.length === filteredVideos.length
                  ? '全選択解除'
                  : 'ページ内全選択'}
              </button>
            )}

            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="動画タイトルを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-9 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
              <span className="absolute left-3 top-2.5 text-xs text-gray-400">
                🔍
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Partボタン一覧 */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalParts }, (_, i) => i + 1).map((partNum) => (
            <button
              key={partNum}
              onClick={() => handleSelectPart(partNum)}
              disabled={isLoading}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                currentPart === partNum
                  ? 'bg-red-600 text-white border-red-600 shadow-md scale-105'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              Part {partNum}
            </button>
          ))}
        </div>
      </div>

      {/* 2. 一括追加アクションバー (下部固定) */}
      {selectedVideos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-4 border border-gray-700/50 max-w-lg w-[90vw]">
          <span className="text-xs font-extrabold whitespace-nowrap">
            {selectedVideos.length} 件選択中
          </span>

          <select
            value={targetPlaylistId}
            onChange={(e) => setTargetPlaylistId(e.target.value)}
            className="bg-gray-800 text-xs px-3 py-2 rounded-xl border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 flex-1 truncate"
          >
            <option value="">追加先のマイリストを選択</option>
            {playlists && playlists.length > 0 ? (
              playlists.map((pl: any) => (
                <option key={pl.id} value={pl.id}>
                  {pl.title || pl.name || '名称未設定'}
                </option>
              ))
            ) : (
              <option value="" disabled>
                マイリストがありません
              </option>
            )}
          </select>

          <button
            onClick={handleBatchAdd}
            disabled={!targetPlaylistId || isAdding}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm"
          >
            {isAdding ? '追加中...' : '一括追加'}
          </button>

          <button
            onClick={() => setSelectedVideos([])}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 3. 動画カードグリッド表示 */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-sm font-semibold text-gray-500">
            {searchQuery
              ? `「${searchQuery}」に一致する動画が見つかりませんでした。`
              : '該当する動画はありません。'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredVideos.map((video) => {
            const isSelected = selectedVideos.some((v) => v.id === video.id)
            return (
              <div
                key={video.id}
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 relative flex flex-col justify-between group ${
                  isSelected
                    ? 'ring-2 ring-red-500 border-red-500 shadow-lg'
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* チェックボックス (左上) */}
                  <div className="absolute top-3 left-3 z-20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(video)}
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer shadow-md"
                    />
                  </div>

                  {/* サムネイル */}
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative aspect-video overflow-hidden bg-gray-100"
                  >
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </a>

                  {/* タイトル & 投稿日 */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h3>
                    {video.published_at && (
                      <p className="text-[11px] font-medium text-gray-400">
                        {formatDate(video.published_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* 単体追加用モーダルボタン */}
                <div className="px-4 pb-4 pt-1">
                  <AddToListModal
                    videoId={video.id}
                    videoTitle={video.title}
                    thumbnailUrl={video.thumbnail_url}
                    playlists={playlists}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}