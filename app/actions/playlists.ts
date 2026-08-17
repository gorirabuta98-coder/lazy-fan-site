'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VideoInfoInput {
  id: string
  title?: string
  thumbnail_url?: string
}

// videos テーブルに動画情報が存在することを保障する関数
async function ensureVideoExists(supabase: any, videoInput: string | VideoInfoInput) {
  const videoId = typeof videoInput === 'string' ? videoInput : videoInput.id
  if (!videoId) return

  // 1. すでに DB に存在するか確認
  const { data: existing } = await supabase
    .from('videos')
    .select('id')
    .eq('id', videoId)
    .single()

  if (existing) return

  // 2. クライアントからタイトル等の情報が渡されていれば直接保存
  if (typeof videoInput === 'object' && videoInput.title && videoInput.thumbnail_url) {
    await supabase.from('videos').upsert({
      id: videoInput.id,
      title: videoInput.title,
      thumbnail_url: videoInput.thumbnail_url,
      published_at: new Date().toISOString(),
    })
    return
  }

  // 3. 情報がない場合、YouTube API から直接取得して登録
  const apiKey = process.env.YOUTUBE_API_KEY
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      )
      if (res.ok) {
        const data = await res.json()
        const item = data.items?.[0]
        if (item) {
          await supabase.from('videos').upsert({
            id: videoId,
            title: item.snippet.title,
            thumbnail_url:
              item.snippet.thumbnails?.maxres?.url ||
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.default?.url,
            published_at: item.snippet.publishedAt || new Date().toISOString(),
          })
        }
      }
    } catch (e) {
      console.error('Failed to fetch video details from YouTube API:', e)
    }
  }
}

// 1. 新規マイリスト作成 ＆ 動画追加
export async function createPlaylistAndAddVideo(name: string, videoInput: string | VideoInfoInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    // 動画情報の事前確保
    await ensureVideoExists(supabase, videoInput)

    const videoId = typeof videoInput === 'string' ? videoInput : videoInput.id

    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: name,
      })
      .select()
      .single()

    if (playlistError || !playlist) {
      return { success: false, error: playlistError?.message || 'マイリストの作成に失敗しました' }
    }

    const { error: itemError } = await supabase.from('playlist_items').insert({
      playlist_id: playlist.id,
      video_id: videoId,
    })

    if (itemError) {
      return { success: false, error: itemError.message }
    }

    revalidatePath('/playlists')
    return { success: true, playlist }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 2. 既存マイリストへ動画追加
export async function addVideoToPlaylist(playlistId: string, videoInput: string | VideoInfoInput) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    // 動画情報の事前確保
    await ensureVideoExists(supabase, videoInput)

    const videoId = typeof videoInput === 'string' ? videoInput : videoInput.id

    const { error } = await supabase.from('playlist_items').insert({
      playlist_id: playlistId,
      video_id: videoId,
    })

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 3. マイリストの単体作成
export async function createPlaylist(name: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({
        user_id: user.id,
        name: name,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true, playlist }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 4. マイリスト削除
export async function deletePlaylist(playlistId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 5. マイリスト名変更
export async function renamePlaylist(playlistId: string, newName: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { error } = await supabase
      .from('playlists')
      .update({ name: newName })
      .eq('id', playlistId)
      .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 6. マイリストから特定の動画を削除
export async function removeVideoFromPlaylist(playlistIdOrItemId: string, videoId?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    let error

    if (videoId) {
      const result = await supabase
        .from('playlist_items')
        .delete()
        .eq('playlist_id', playlistIdOrItemId)
        .eq('video_id', videoId)
      error = result.error
    } else {
      const result = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', playlistIdOrItemId)
      error = result.error
    }

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'エラーが発生しました' }
  }
}

// 7. ユーザーのマイリスト一覧を取得（ドロップダウン用）
export async function getUserPlaylists() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return playlists || []
}

// 8. マイリストと紐づく動画一覧を取得（完全補完付き）
export async function getPlaylistsWithVideos() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: playlists, error: plError } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (plError || !playlists || playlists.length === 0) return []

  const playlistIds = playlists.map((p) => p.id)

  const { data: items, error: itemsError } = await supabase
    .from('playlist_items')
    .select('*')
    .in('playlist_id', playlistIds)

  if (itemsError || !items || items.length === 0) {
    return playlists.map((p) => ({ ...p, playlist_items: [] }))
  }

  const videoIds = Array.from(new Set(items.map((item) => item.video_id)))

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds)

  const videoMap = new Map((videos || []).map((v) => [v.id, v]))

  // 未登録の動画 ID があれば YouTube API から一括取得して補完
  const missingVideoIds = videoIds.filter((id) => !videoMap.has(id))
  if (missingVideoIds.length > 0 && process.env.YOUTUBE_API_KEY) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${missingVideoIds.join(',')}&key=${process.env.YOUTUBE_API_KEY}`
      )
      if (res.ok) {
        const data = await res.json()
        const fetchedVideos = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          thumbnail_url:
            item.snippet.thumbnails?.maxres?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url,
          published_at: item.snippet.publishedAt || new Date().toISOString(),
        }))

        if (fetchedVideos.length > 0) {
          await supabase.from('videos').upsert(fetchedVideos)
          fetchedVideos.forEach((v: any) => videoMap.set(v.id, v))
        }
      }
    } catch (e) {
      console.error('Failed to fetch missing videos:', e)
    }
  }

  return playlists.map((p) => {
    const pItems = items
      .filter((item) => item.playlist_id === p.id)
      .map((item) => {
        const video = videoMap.get(item.video_id) || {
          id: item.video_id,
          title: 'YouTube動画',
          thumbnail_url: `https://i.ytimg.com/vi/${item.video_id}/hqdefault.jpg`,
        }
        return {
          id: item.id,
          video_id: item.video_id,
          videos: video,
        }
      })

    return {
      ...p,
      playlist_items: pItems,
    }
  })
}