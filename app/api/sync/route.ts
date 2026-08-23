import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface YouTubePlaylistItem {
  snippet?: {
    resourceId?: { videoId?: string }
    title?: string
    publishedAt?: string
    thumbnails?: {
      maxres?: { url?: string }
      high?: { url?: string }
      medium?: { url?: string }
      default?: { url?: string }
    }
  }
}

export async function POST() {
  const apiKey = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return NextResponse.json(
      {
        success: false,
        error: 'YOUTUBE_API_KEY または YOUTUBE_CHANNEL_ID が設定されていません',
      },
      { status: 500 }
    )
  }

  try {
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    const channelResponse = await fetch(channelUrl)
    const channelData = await channelResponse.json()

    if (!channelResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: channelData.error?.message || 'YouTube APIレスポンスエラー',
        },
        { status: 502 }
      )
    }

    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { success: false, error: 'チャンネルのアップロード再生リストIDが見つかりませんでした' },
        { status: 502 }
      )
    }

    const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()

    if (!videosResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: videosData.error?.message || '動画リスト取得エラー',
        },
        { status: 502 }
      )
    }

    const videosToUpsert = (videosData.items as YouTubePlaylistItem[] | undefined || [])
      .filter((item) => item.snippet?.resourceId?.videoId)
      .map((item) => {
        const snippet = item.snippet!
        const thumbnails = snippet.thumbnails

        return {
          id: snippet.resourceId!.videoId!,
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

    const supabase = await createClient()
    const { error } = await supabase.from('videos').upsert(videosToUpsert, {
      onConflict: 'id',
    })

    if (error) {
      console.error('動画保存エラー:', error)
      return NextResponse.json(
        { success: false, error: `DB保存エラー: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('YouTube同期APIエラー:', error)
    const message = error instanceof Error ? error.message : '同期処理中に不明なエラーが発生しました'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
