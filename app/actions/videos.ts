'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Video {
  id: string
  title: string
  thumbnail_url: string
  published_at: string
  is_short?: boolean
}

// ISO 8601 形式の動画時間 (PT1M30S など) を秒数に変換するヘルパー関数
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

// --- 1. YouTube Data API から最新・過去動画を一括同期する処理 ---
export async function syncVideosFromYouTube() {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    if (!apiKey || !channelId) {
      return { success: false, error: 'YOUTUBE_API_KEY または YOUTUBE_CHANNEL_ID が設定されていません' }
    }

    const supabase = await createClient()
    let nextPageToken = ''
    let totalFetched = 0

    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    )
    const channelData = await channelRes.json()

    if (!channelData.items || channelData.items.length === 0) {
      return { success: false, error: 'チャンネル情報の取得に失敗しました' }
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

    for (let i = 0; i < 10; i++) {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&pageToken=${nextPageToken}&key=${apiKey}`
      const playlistRes = await fetch(playlistUrl)
      const playlistData = await playlistRes.json()

      if (!playlistData.items || playlistData.items.length === 0) break

      const videoIds = playlistData.items
        .map((item: any) => item.snippet.resourceId.videoId)
        .join(',')

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`
      const detailsRes = await fetch(detailsUrl)
      const detailsData = await detailsRes.json()

      if (!detailsData.items) break

      const videosToUpsert = detailsData.items.map((item: any) => {
        const title = item.snippet.title || ''
        const durationSec = parseISO8601Duration(item.contentDetails?.duration || '')

        const isShort = (durationSec > 0 && durationSec <= 60) || title.includes('#')

        return {
          id: item.id,
          title: title,
          thumbnail_url:
            item.snippet.thumbnails.maxres?.url ||
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
          published_at: item.snippet.publishedAt,
          is_short: isShort,
        }
      })

      const { error } = await supabase
        .from('videos')
        .upsert(videosToUpsert, { onConflict: 'id' })

      if (error) {
        console.error('Supabase Upsert Error:', error)
      }

      totalFetched += videosToUpsert.length
      nextPageToken = playlistData.nextPageToken || ''
      if (!nextPageToken) break
    }

    revalidatePath('/')
    return { success: true, count: totalFetched }
  } catch (err: any) {
    console.error('Sync Error:', err)
    return { success: false, error: err.message }
  }
}

// --- 2. データベースからの取得アクション ---

export async function getVideosByPart(part: number = 1, pageSize: number = 20) {
  try {
    const supabase = await createClient()

    const from = (part - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact' })
      
    
      .order('published_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching videos by part:', error)
      return { videos: [], totalCount: 0 }
    }

    return {
      videos: (data as Video[]) || [],
      totalCount: count || 0,
    }
  } catch (e) {
    console.error('getVideosByPart failed:', e)
    return { videos: [], totalCount: 0 }
  }
}

export async function getVideos(limit = 24) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      
      
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching videos:', error)
      return []
    }

    return (data as Video[]) || []
  } catch (e) {
    console.error('getVideos failed:', e)
    return []
  }
}

export async function getShorts(limit = 24) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .or('is_short.eq.true,title.ilike.%#%')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching shorts:', error)
      return []
    }

    return (data as Video[]) || []
  } catch (e) {
    console.error('getShorts failed:', e)
    return []
  }
}

export async function getVideosCount() {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      
      .not('title', 'ilike', '%#%')

    if (error) {
      console.error('Error getting videos count:', error)
      return 0
    }

    return count || 0
  } catch (e) {
    console.error('getVideosCount failed:', e)
    return 0
  }
}