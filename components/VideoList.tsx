'use client'

import { useState } from 'react'
import { getVideosByPart, Video } from '@/app/actions/videos'
import { addMultipleToPlaylist } from '@/app/actions/playlists'
import AddToListModal from '@/components/AddToListModal'

interface VideoListProps {
  initialVideos: Video[]
  totalCount?: number
  playlists?: any[]
  pageSize?: number
}

export default function VideoList({
  initialVideos,
  totalCount = 0,
  playlists = [],
  pageSize = 50,
}: VideoListProps) {
  // 表示中の動画リスト State
  const [videos, setVideos] = useState<Video[]>(initialVideos)

  // 現在選択中の Part 番号 State
  const [currentPart, setCurrentPart] = useState<number>(1)

  // 動画の総件数 State
  const [total, setTotal] = useState<number>(totalCount)

  // Part 切り替え時のローディング State
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 検索キーワード State
  const [searchQuery, setSearchQuery] = useState<string>('')

  // チェックボックスで選択された動画のリスト State
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([])

  // 一括追加先のマイリスト ID State
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>('')

  // 一括追加処理中のローディング State
  const [isAdding, setIsAdding] = useState<boolean>(false)

  // 総 Part 数の動的計算 (1 Part ＝ 50件)
  const totalParts = Math.max(1, Math.ceil(total / pageSize))

  // 検索キーワードに基づくフィルタリング処理
  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 動画の個別選択 / 解除トグル
  const toggleSelect = (video: Video) => {
    setSelectedVideos((prev) =>
      prev.some((v) => v.id === video.id)
        ? prev.filter((v) => v.id !== video.id)
        : [...prev, video]
    )
  }

  // 現在表示されているページ内動画の全選択 / 全解除
  const toggleSelectAll = () => {
    if (selectedVideos.length === filteredVideos.length && filteredVideos.length > 0) {
      setSelectedVideos([])
    } else {
      setSelectedVideos([...filteredVideos])
    }
  }

  // 選択した動画をマイリストへ一括追加
  const handleBatchAdd = async () => {
    if (!targetPlaylistId) {
      alert('追加先のマイリストを選択してください。')
      return
    }

    if (selectedVideos.length === 0) {
      alert('追加する動画が選択されていません。')
      return
    }

    setIsAdding(true)

    try {
      const res = await addMultipleToPlaylist(targetPlaylistId, selectedVideos)
      if (res?.success) {
        alert(`${selectedVideos.length} 件の動画をマイリストに追加しました！`)
        setSelectedVideos([])
        setTargetPlaylistId('')
      } else {
        alert('一括追加に失敗しました。')
      }
    } catch (error) {
      console.error('一括追加エラー:', error)
      alert('追加処理中にエラーが発生しました。時間をおいて再度お試しください。')
    } finally {
      setIsAdding(false)
    }
  }

  // 指定した Part への移動処理
  const handleSelectPart = async (partNum: number) => {
    if (partNum === currentPart || isLoading) return
    setIsLoading(true)

    try {
      const res = await getVideosByPart(partNum, pageSize)
      if (res?.videos) {
        setVideos(res.videos)
      }
      if (typeof res?.totalCount === 'number') {
        setTotal(res.totalCount)
      }
      setCurrentPart(partNum)
      setSelectedVideos([]) // Part変更時は選択をリセット
    } catch (error) {
      console.error('Part取得エラー:', error)
      alert('動画の取得に失敗しました。')
    } finally {
      setIsLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 日付表示用のフォーマット関数
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      })
    } catch (e) {
      return dateString
    }
  }

  return (
    <section className="space-y-6">
      {/* 1. ヘッダー / 検索バー / Part ナビゲーションエリア */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <h2 className="text-xl font-extrabold text-gray-900">動画一覧</h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200">
              全 {total} 件
            </span>
          </div>

          {/* 検索窓 & 全選択ボタン */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {filteredVideos.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors whitespace-nowrap border border-gray-200"
              >
                {selectedVideos.length === filteredVideos.length && filteredVideos.length > 0
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
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Part 切替ボタン一覧 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
            <span>ページ選択 (Part 1 〜 Part {totalParts})</span>
            {isLoading && <span className="text-red-600 font-bold">読み込み中...</span>}
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
            {Array.from({ length: totalParts }, (_, i) => i + 1).map((partNum) => (
              <button
                key={partNum}
                type="button"
                onClick={() => handleSelectPart(partNum)}
                disabled={isLoading}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                  currentPart === partNum
                    ? 'bg-red-600 text-white border-red-600 shadow-md scale-105 z-10'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                } disabled:opacity-50`}
              >
                Part {partNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 一括追加用アクションバー (複数選択時に画面下部に浮遊表示) */}
      {selectedVideos.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-4 border border-gray-700/50 max-w-lg w-[90vw]">
          <span className="text-xs font-extrabold whitespace-nowrap text-red-400">
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
                マイリストがありません（先に作成してください）
              </option>
            )}
          </select>

          <button
            type="button"
            onClick={handleBatchAdd}
            disabled={!targetPlaylistId || isAdding}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap shadow-sm"
          >
            {isAdding ? '追加中...' : '一括追加'}
          </button>

          <button
            type="button"
            onClick={() => setSelectedVideos([])}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* 3. 動画カードグリッド一覧表示 */}
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
                  {/* チェックボックス (カード左上に浮遊配置) */}
                  <div className="absolute top-3 left-3 z-20">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(video)}
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer shadow-md"
                    />
                  </div>

                  {/* 動画サムネイル画像 */}
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

                  {/* 動画タイトル & 投稿日時 */}
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

                {/* マイリスト追加用モーダルボタン */}
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