'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  videoIds: string[]
}

export default function ShareModal({ isOpen, onClose, videoIds }: ShareModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Supabaseにマイリストを保存して公開URLを発行
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || videoIds.length === 0) return

    setIsSubmitting(true)

    const { data, error } = await supabase
      .from('playlists')
      .insert([{ title, description, video_ids: videoIds }])
      .select('id')
      .single()

    setIsSubmitting(false)

    if (error) {
      alert('保存に失敗しました。時間をおいて再度お試しください。')
      return
    }

    const generatedUrl = `${window.location.origin}/playlist/${data.id}`
    setShareUrl(generatedUrl)
  }

  // URLをコピーする処理
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            マイリストを公開・共有
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
        </div>

        {!shareUrl ? (
          <form onSubmit={handlePublish} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                タイトル（必須）
              </label>
              <input
                type="text"
                placeholder="例：レイクレ神回厳選集"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                説明・ひと言（任意）
              </label>
              <textarea
                placeholder="例：個人的に腹抱えて笑った動画だけ集めました！"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <p className="text-xs text-gray-500">
              ※登録動画数: {videoIds.length}件
            </p>

            <button
              type="submit"
              disabled={isSubmitting || videoIds.length === 0}
              className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:bg-gray-300"
            >
              {isSubmitting ? '発行中...' : '公開URLを発行する'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-green-600 font-bold">
              🎉 公開URLが発行されました！
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-lg text-xs"
              />
              <button
                onClick={handleCopy}
                className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-900 shrink-0"
              >
                {copied ? 'コピー完了' : 'コピー'}
              </button>
            </div>

            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `【マイリスト公開】${title}\nレイクレのおすすめ動画まとめを作成しました！🔥\n`
              )}&url=${encodeURIComponent(
                shareUrl
              )}&hashtags=レイクレ,LazyLieCrazy`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition text-sm"
            >
              X（旧Twitter）で共有する
            </a>
          </div>
        )}
      </div>
    </div>
  )
}