'use client'

import { useState } from 'react'

interface ShareModalProps {
  playlist: {
    id: string
    title: string
  }
  onClose: () => void
}

export default function ShareModal({ playlist, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  // 共有用URLの生成
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/playlist/${playlist.id}`
    : ''

  // X（旧Twitter）シェア用URLの生成
  const shareText = `マイリスト「${playlist.title}」をチェック！`
  const twitterShareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`

  // URLをクリップボードにコピー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('コピー失敗:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <span className="text-3xl">🔗</span>
          <h3 className="text-lg font-bold text-gray-900">マイリストを共有</h3>
          <p className="text-xs text-gray-500 font-medium">「{playlist.title}」</p>
        </div>

        {/* URLコピー欄 */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            共有用URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {copied ? 'OK!' : 'コピー'}
            </button>
          </div>
        </div>

        {/* X（Twitter）シェアボタン */}
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition shadow-sm"
        >
          <span>𝕏 でシェアする</span>
        </a>
      </div>
    </div>
  )
}