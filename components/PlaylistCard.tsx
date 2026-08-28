'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  updatePlaylistTitle,
  deletePlaylist,
  removeFromPlaylist,
} from '@/app/actions/playlists'
import { getDeviceId } from '@/lib/deviceId'

interface Video {
  id: string
  title: string
  thumbnail_url: string
  published_at?: string
}

interface PlaylistItem {
  id?: string
  playlist_id?: string
  video_id: string
  title?: string
  thumbnail_url?: string
  created_at?: string
  videos?: Video | Video[] | null
}

interface Playlist {
  id: string
  title?: string
  name?: string
  created_at?: string
  playlist_items?: PlaylistItem[]
}

interface PlaylistCardProps {
  playlist: Playlist
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const router = useRouter()
  const playlistTitle = playlist.title || playlist.name || '名称未設定'

  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [title, setTitle] = useState<string>(playlistTitle)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [items, setItems] = useState<PlaylistItem[]>(playlist.playlist_items || [])

  // 親データが更新されたら同期
  useEffect(() => {
    setItems(playlist.playlist_items || [])
  }, [playlist.playlist_items])

  // 1. マイリスト名の変更
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isProcessing) return

    setIsProcessing(true)
    try {
      const res = await updatePlaylistTitle(playlist.id, title.trim(), getDeviceId())
      if (res.success) {
        setIsEditing(false)
        router.refresh()
      } else {
        alert(res.error || '名前の変更に失敗しました。')
      }
    } catch (error) {
      console.error('マイリスト名変更エラー:', error)
      alert('エラーが発生しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  // 2. マイリスト全体の削除
  const handleDeletePlaylist = async () => {
    if (!window.confirm(`「${playlistTitle}」を削除してもよろしいですか？`)) return

    setIsProcessing(true)
    try {
      const res = await deletePlaylist(playlist.id, getDeviceId())
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error || 'マイリストの削除に失敗しました。')
      }
    } catch (error) {
      console.error('マイリスト削除エラー:', error)
      alert('エラーが発生しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  // 3. 動画の個別削除（即時画面反映）
  const handleRemoveVideo = async (videoId: string, videoTitle: string) => {
    if (!window.confirm(`「${videoTitle}」をこのマイリストから削除しますか？`)) return

    setIsProcessing(true)
    try {
      const res = await removeFromPlaylist(playlist.id, videoId, getDeviceId())
      if (res.success) {
        // 即座にローカル状態から除外（即時消去）
        setItems((prev) => prev.filter((item) => item.video_id !== videoId))
        router.refresh()
      } else {
        alert(res.error || '動画の削除に失敗しました。')
      }
    } catch (error) {
      console.error('動画削除エラー:', error)
      alert('エラーが発生しました。')
    } finally {
      setIsProcessing(false)
    }
  }

  const itemCount = items.length

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* カードヘッダー */}
      <div className="p-5 space-y-4">
        {isEditing ? (
          <form onSubmit={handleRename} className="flex gap-2 items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isProcessing}
              className="flex-1 text-sm font-bold text-gray-900 bg-white border border-gray-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isProcessing || !title.trim()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setTitle(playlistTitle)
              }}
              disabled={isProcessing}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
            >
              キャンセル
            </button>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <h3 className="text-base font-extrabold text-gray-900 line-clamp-1">
                  {playlistTitle}
                </h3>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                動画 {itemCount} 件
              </p>
            </div>

            {/* マイリスト本体の操作ボタン */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="名前を変更"
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs font-bold"
              >
                ✏️
              </button>
              <button
                type="button"
                onClick={handleDeletePlaylist}
                disabled={isProcessing}
                title="マイリストを削除"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold disabled:opacity-50"
              >
                🗑️
              </button>
            </div>
          </div>
        )}

        {/* サムネイルプレビュー */}
        {itemCount > 0 && (
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="grid grid-cols-3 gap-2 cursor-pointer group"
          >
            {items.slice(0, 3).map((item, idx) => {
              const thumb =
                item.thumbnail_url ||
                (Array.isArray(item.videos)
                  ? item.videos[0]?.thumbnail_url
                  : item.videos?.thumbnail_url) ||
                ''
              return (
                <div
                  key={item.id || item.video_id || idx}
                  className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={item.title || 'サムネイル'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      No Image
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 開閉ボタン */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1 border border-gray-200"
        >
          <span>{isOpen ? '▲ 動画一覧を閉じる' : '▼ 動画一覧を表示'}</span>
        </button>
      </div>

      {/* 動画一覧＆個別削除ボタンエリア */}
      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 font-bold">
              このマイリストには動画が入っていません。
            </p>
          ) : (
            items.map((item) => {
              const itemTitle =
                item.title ||
                (Array.isArray(item.videos)
                  ? item.videos[0]?.title
                  : item.videos?.title) ||
                '無題'
              const itemThumb =
                item.thumbnail_url ||
                (Array.isArray(item.videos)
                  ? item.videos[0]?.thumbnail_url
                  : item.videos?.thumbnail_url) ||
                ''

              return (
                <div
                  key={item.id || item.video_id}
                  className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${item.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 flex-1 min-w-0 group"
                  >
                    {itemThumb && (
                      <img
                        src={itemThumb}
                        alt={itemTitle}
                        className="w-16 h-10 object-cover rounded-lg border border-gray-100 shrink-0 group-hover:opacity-90"
                      />
                    )}
                    <span className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                      {itemTitle}
                    </span>
                  </a>

                  {/* 動画ごとの削除ボタン */}
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(item.video_id, itemTitle)}
                    disabled={isProcessing}
                    title="この動画をマイリストから削除"
                    className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors text-xs font-bold shrink-0 flex items-center gap-1 border border-red-100 disabled:opacity-50"
                  >
                    <span>🗑️</span>
                    <span>削除</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default PlaylistCard