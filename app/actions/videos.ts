'use server'

import { createClient } from '@/lib/supabase/server'

// ISO 8601形式の再生時間を秒数に変換
function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

// ショート動画判定
function isShortsVideo(title: string, durationSec?: number): boolean {
  // 1. 再生時間が180秒（3分）以下の動画は排除
  if (durationSec !== undefined && durationSec > 0 && durationSec <= 180) {
    return true
  }

  // 2. タイトルに「#」（ハッシュタグ）が含まれる動画はすべてショート/切り抜きとして排除
  // （※レイクレの通常企画動画のタイトルには「#」が含まれないため100%特定可能）
  if (title.includes('#')) {
    return true
  }

  return false
}

export async function syncAllVideos() {
  const supabase = await createClient()
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID || 'UC_SBuA4L3I7eSRx9nK6tJ3A'

  if (!apiKey) return

  try {
    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels')
    channelUrl.searchParams.append('part', 'contentDetails')
    channelUrl.searchParams.append('id', channelId)
    channelUrl.searchParams.append('key', apiKey)

    let uploadsPlaylistId = ''
    const channelRes = await fetch(channelUrl.toString(), { cache: 'no-store' })
    if (channelRes.ok) {
      const channelData = await channelRes.json()
      uploadsPlaylistId =
        channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || ''
    }

    if (!uploadsPlaylistId) {
      uploadsPlaylistId = channelId.startsWith('UC')
        ? 'UU' + channelId.slice(2)
        : channelId
    }

    const longVideos: any[] = []
    let nextPageToken: string | undefined = ''

    while (nextPageToken !== undefined) {
      const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
      playlistUrl.searchParams.append('part', 'snippet')
      playlistUrl.searchParams.append('playlistId', uploadsPlaylistId)
      playlistUrl.searchParams.append('maxResults', '50')
      playlistUrl.searchParams.append('key', apiKey)
      if (nextPageToken) {
        playlistUrl.searchParams.append('pageToken', nextPageToken)
      }

      const res = await fetch(playlistUrl.toString(), { cache: 'no-store' })
      if (!res.ok) break

      const data = await res.json()
      const items = data.items || []
      if (items.length === 0) break

      const videoIds = items
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter(Boolean)
        .join(',')

      if (!videoIds) break

      const detailUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
      detailUrl.searchParams.append('part', 'snippet,contentDetails')
      detailUrl.searchParams.append('id', videoIds)
      detailUrl.searchParams.append('key', apiKey)

      const detailRes = await fetch(detailUrl.toString(), { cache: 'no-store' })
      if (detailRes.ok) {
        const detailData = await detailRes.json()
        const videoDetails = detailData.items || []

        for (const detail of videoDetails) {
          const durationSec = parseISO8601Duration(detail.contentDetails?.duration || '')
          const title = detail.snippet?.title || ''

          if (!isShortsVideo(title, durationSec)) {
            longVideos.push({
              id: detail.id,
              title: title,
              thumbnail_url:
                detail.snippet.thumbnails?.maxres?.url ||
                detail.snippet.thumbnails?.high?.url ||
                detail.snippet.thumbnails?.standard?.url ||
                detail.snippet.thumbnails?.default?.url,
              published_at: detail.snippet.publishedAt,
            })
          }
        }
      }

      nextPageToken = data.nextPageToken
      if (!nextPageToken) break
    }

    if (longVideos.length > 0) {
      // データベースを一度リセットしてクリーンアップ
      await supabase.from('videos').delete().neq('id', '___dummy_id___')

      for (let i = 0; i < longVideos.length; i += 100) {
        const chunk = longVideos.slice(i, i + 100)
        await supabase.from('videos').upsert(chunk, { onConflict: 'id' })
      }
    }
  } catch (err) {
    console.error('Sync Error:', err)
  }
}

export async function getOrFetchVideos() {
  const supabase = await createClient()

  await syncAllVideos()

  const { data: dbVideos } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })

  const cleanVideos = (dbVideos || []).filter((v) => !isShortsVideo(v.title))
  const total = cleanVideos.length
  const pageSize = Math.max(1, Math.ceil(total / 10))

  return {
    videos: cleanVideos.slice(0, pageSize),
    totalCount: total,
  }
}

export async function getVideosByPart(partNum: number = 1) {
  const supabase = await createClient()

  const { data: dbVideos } = await supabase
    .from('videos')
    .select('*')
    .order('published_at', { ascending: false })

  const cleanVideos = (dbVideos || []).filter((v) => !isShortsVideo(v.title))
  const total = cleanVideos.length
  const pageSize = Math.max(1, Math.ceil(total / 10))
  const start = (partNum - 1) * pageSize
  const pageVideos = cleanVideos.slice(start, start + pageSize)

  return {
    videos: pageVideos,
    totalCount: total,
  }
}