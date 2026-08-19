'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Video {
  id: string
  title: string
  thumbnail_url: string
  published_at?: string
  created_at?: string
  is_short?: boolean
}

/**
 * 動画の総件数を取得する
 */
export async function getVideosCount(): Promise<number> {
  try {
    const supabase = await createClient()
    const { count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('動画総数取得エラー:', error)
      return 0
    }

    return count || 0
  } catch (err) {
    console.error('getVideosCount 例外:', err)
    return 0
  }
}

/**
 * 指定された Part（ページ）の動画一覧と総件数を取得する
 * @param part 取得する Part 番号 (1〜)
 * @param pageSize 1 Part あたりの件数 (デフォルト 50件)
 */
export async function getVideosByPart(part: number = 1, pageSize: number = 50) {
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
      console.error('getVideosByPart DBエラー:', error)
      return { videos: [], totalCount: 0 }
    }

    return {
      videos: (data as Video[]) || [],
      totalCount: count || 0,
    }
  } catch (err) {
    console.error('getVideosByPart 例外:', err)
    return { videos: [], totalCount: 0 }
  }
}

/**
 * 最新の動画を件数指定で取得する
 */
export async function getVideos(limit: number = 20): Promise<Video[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('getVideos DBエラー:', error)
      return []
    }

    return (data as Video[]) || []
  } catch (err) {
    console.error('getVideos 例外:', err)
    return []
  }
}

/**
 * YouTube APIからチャンネル内の全動画を取得し、Supabaseに同期する
 * nextPageTokenを利用して最新から過去の動画まで最後まで全件取得・更新します
 */
export async function syncVideosFromYouTube() {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return {
      success: false,
      error: 'YOUTUBE_API_KEY または YOUTUBE_CHANNEL_ID が設定されていません',
    }
  }

  const supabase = await createClient()

  try {
    // 1. チャンネル情報からアップロード動画リスト (Uploads Playlist ID) を取得
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    const channelRes = await fetch(channelUrl)
    const channelData = await channelRes.json()

    if (!channelRes.ok) {
      throw new Error(channelData.error?.message || 'YouTube APIレスポンスエラー')
    }

    const uploadsListId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsListId) {
      return {
        success: false,
        error: 'チャンネルのアップロード再生リストIDが見つかりませんでした',
      }
    }

    let nextPageToken: string | undefined = ''
    let totalSynced = 0
    let pageCount = 0

    // 2. nextPageTokenがなくなるまで全動画をループ同期
    do {
      let playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsListId}&maxResults=50&key=${apiKey}`
      if (nextPageToken) {
        playlistUrl += `&pageToken=${nextPageToken}`
      }

      const playlistRes = await fetch(playlistUrl)
      const playlistData = await playlistRes.json()

      if (!playlistRes.ok) {
        console.error('PlaylistItems APIエラー:', playlistData)
        throw new Error(playlistData.error?.message || '動画リスト取得エラー')
      }

      if (!playlistData.items || playlistData.items.length === 0) {
        break
      }

      const videosToUpsert = playlistData.items
        .filter((item: any) => item.snippet?.resourceId?.videoId)
        .map((item: any) => {
          const snippet = item.snippet
          const videoId = snippet.resourceId.videoId
          const thumbnails = snippet.thumbnails

          return {
            id: videoId,
            title: snippet.title || '無題',
            thumbnail_url:
              thumbnails?.maxres?.url ||
              thumbnails?.high?.url ||
              thumbnails?.medium?.url ||
              thumbnails?.default?.url ||
              '',
            published_at: snippet.publishedAt,
          }
        })

      if (videosToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('videos')
          .upsert(videosToUpsert, {
            onConflict: 'id',
          })

        if (upsertError) {
          console.error('Supabase Upsert エラー:', upsertError)
          throw new Error(`DB保存エラー: ${upsertError.message}`)
        }

        totalSynced += videosToUpsert.length
      }

      pageCount++
      nextPageToken = playlistData.nextPageToken
    } while (nextPageToken)

    revalidatePath('/')
    return {
      success: true,
      count: totalSynced,
      pages: pageCount,
    }
  } catch (error: any) {
    console.error('YouTube同期処理で例外が発生しました:', error)
    return {
      success: false,
      error: error.message || '同期処理中に不明なエラーが発生しました',
    }
  }
}