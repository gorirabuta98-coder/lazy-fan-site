'use client'

import { useState } from 'react'
import { getVideosByPart } from '@/app/actions/videos'
import AddToListModal from '@/components/AddToListModal'

type Video = {
  id: string
  title: string
  thumbnail_url: string
  published_at: string
}

interface VideoListProps {
  initialVideos: Video[]
  totalCount?: number
  playlists: any[]
}

export default function VideoList({
  initialVideos,
  totalCount = 0,
  playlists,
}: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [currentPart, setCurrentPart] = useState<number>(1)
  const [total, setTotal] = useState<number>(totalCount)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const totalParts = 10
  const pageSize = Math.max(1, Math.ceil(total / totalParts))

  const handleSelectPart = async (partNum: number) => {
    if (partNum === currentPart || isLoading) return
    setIsLoading(true)

    const res = await getVideosByPart(partNum)

    setVideos(res.videos)
    if (res.totalCount) setTotal(res.totalCount)
    setCurrentPart(partNum)
    setIsLoading(false)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startNum = (currentPart - 1) * pageSize + 1
  const endNum = Math.min(currentPart * pageSize, total)

  return (
    <section className="space-y-6">
      {/* Part 選択エリア */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📂 Part を選択して移動</span>
          </h2>
          <span className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full">
            Part {currentPart} 表示中（{startNum}〜{endNum}本目 / 全{total}本）
          </span>
        </div>

        {/* Part 1 〜 Part 10 ボタン */}
        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: totalParts }, (_, i) => i + 1).map((part) => {
            const isActive = part === currentPart
            return (
              <button
                key={part}
                onClick={() => handleSelectPart(part)}
                disabled={isLoading}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60'
                }`}
              >
                Part {part}
              </button>
            )
          })}
        </div>
      </div>

      {/* ヘッダー */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold text-gray-900">
          公式動画一覧 <span className="text-red-600">Part {currentPart}</span>
        </h3>
      </div>

      {/* 読み込み中・動画一覧 */}
      {isLoading ? (
        <div className="py-24 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-3"></div>
          <p className="text-sm font-semibold text-gray-700">
            Part {currentPart} の動画を読み込んでいます...
          </p>
        </div>
      ) : videos.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">
            このPartに表示できる動画はありません。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => {
            const watchUrl = `https://www.youtube.com/watch?v=${video.id}`

            return (
              <div
                key={video.id}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col p-3"
              >
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-video group overflow-hidden bg-black rounded-lg"
                >
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </a>

                <div className="pt-3 flex flex-col justify-between flex-grow">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2">
                    {video.title}
                  </h3>

                  <div className="mt-auto">
                    <div className="flex items-center justify-between py-1 text-[11px] text-gray-400">
                      <span>
                        {new Date(video.published_at).toLocaleDateString('ja-JP')}
                      </span>
                      <a
                        href={watchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 font-semibold hover:underline"
                      >
                        YouTubeで見る ↗
                      </a>
                    </div>

                    <AddToListModal videoId={video.id} playlists={playlists} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 下部 Part 移動ボタン */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => handleSelectPart(currentPart - 1)}
          disabled={currentPart === 1 || isLoading}
          className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold text-xs py-2.5 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Part {currentPart - 1} に移動
        </button>

        <span className="text-xs font-bold text-gray-500">
          Part {currentPart} / {totalParts}
        </span>

        <button
          onClick={() => handleSelectPart(currentPart + 1)}
          disabled={currentPart === totalParts || isLoading}
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs py-2.5 px-5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Part {currentPart + 1} に移動 →
        </button>
      </div>
    </section>
  )
}