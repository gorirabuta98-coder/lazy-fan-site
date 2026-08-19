'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ----------------------------------------------------------------------
// 型定義
// ----------------------------------------------------------------------
export interface PlaylistItemInput {
  id?: string
  video_id?: string
  title?: string
  thumbnail_url?: string
  thumbnail?: string
}

// ----------------------------------------------------------------------
// 1. 全マイリスト一覧と動画データを取得（ログイン/未ログイン自動分岐）
// ----------------------------------------------------------------------
export async function getPlaylistsWithVideos() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let query = supabase
    .from('playlists')
    .select(`
      id,
      title,
      created_at,
      playlist_items (
        id,
        playlist_id,
        video_id,
        title,
        thumbnail_url,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (user) {
    // ログイン時：自分のマイリストのみ取得
    query = query.eq('user_id', user.id)
  } else {
    // 未ログイン時：デフォルト（user_id が NULL）の共有マイリストのみ取得
    query = query.is('user_id', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('getPlaylistsWithVideos エラー:', error)
    return []
  }

  return data || []
}

// ----------------------------------------------------------------------
// 2. ID指定で単一のマイリストを取得
// ----------------------------------------------------------------------
export async function getPlaylistById(playlistId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('playlists')
    .select(`
      id,
      title,
      created_at,
      user_id,
      playlist_items (
        id,
        playlist_id,
        video_id,
        title,
        thumbnail_url,
        created_at
      )
    `)
    .eq('id', playlistId)
    .single()

  if (error) {
    console.error('getPlaylistById エラー:', error)
    return null
  }

  return data
}

// ----------------------------------------------------------------------
// 3. マイリストの新規作成（単体）
// ----------------------------------------------------------------------
export async function createPlaylist(title: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      title,
      user_id: user ? user.id : null,
    })
    .select()
    .single()

  if (error) {
    console.error('createPlaylist エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true, playlist: data }
}

// ----------------------------------------------------------------------
// 4. マイリストへ動画の追加（単体）
// ----------------------------------------------------------------------
export async function addToPlaylist(playlistId: string, video: PlaylistItemInput | string) {
  const supabase = await createClient()

  const videoId = typeof video === 'string' ? video : video.id || video.video_id
  const title = typeof video === 'object' ? video.title || '無題' : '無題'
  const thumbnailUrl =
    typeof video === 'object' ? video.thumbnail_url || video.thumbnail || '' : ''

  if (!videoId) {
    return { success: false, error: '動画IDが不正です。' }
  }

  const { error } = await supabase.from('playlist_items').upsert(
    {
      playlist_id: playlistId,
      video_id: videoId,
      title: title,
      thumbnail_url: thumbnailUrl,
    },
    { onConflict: 'playlist_id,video_id' }
  )

  if (error) {
    console.error('addToPlaylist エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ----------------------------------------------------------------------
// 5. マイリストの作成 ＆ 動画一括追加（引数2個/3個の両パターンに対応）
// ----------------------------------------------------------------------
export async function addMultipleToPlaylist(
  playlistId: string | null,
  arg2: string | PlaylistItemInput[],
  arg3?: PlaylistItemInput[]
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const playlistName = typeof arg2 === 'string' ? arg2 : ''
  const videos = Array.isArray(arg2) ? arg2 : arg3 || []

  let targetPlaylistId = playlistId

  if (!targetPlaylistId) {
    const { data: newPlaylist, error: createError } = await supabase
      .from('playlists')
      .insert({
        title: playlistName || '新規マイリスト',
        user_id: user ? user.id : null,
      })
      .select()
      .single()

    if (createError || !newPlaylist) {
      console.error('マイリスト作成エラー:', createError)
      return {
        success: false,
        error: createError?.message || 'マイリストの作成に失敗しました。',
      }
    }

    targetPlaylistId = newPlaylist.id
  }

  if (videos && videos.length > 0) {
    const itemsToInsert = videos.map((video) => ({
      playlist_id: targetPlaylistId,
      video_id: video.id || video.video_id,
      title: video.title || '無題',
      thumbnail_url: video.thumbnail_url || video.thumbnail || '',
    }))

    const { error: insertError } = await supabase
      .from('playlist_items')
      .upsert(itemsToInsert, { onConflict: 'playlist_id,video_id' })

    if (insertError) {
      console.error('動画追加エラー:', insertError)
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath('/playlists')
  return { success: true, playlistId: targetPlaylistId }
}

// ----------------------------------------------------------------------
// 6. マイリスト名の変更
// ----------------------------------------------------------------------
export async function updatePlaylistTitle(playlistId: string, title: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('playlists')
    .update({ title })
    .eq('id', playlistId)

  if (error) {
    console.error('updatePlaylistTitle エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ----------------------------------------------------------------------
// 7. マイリストの完全削除
// ----------------------------------------------------------------------
export async function deletePlaylist(playlistId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)

  if (error) {
    console.error('deletePlaylist エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ----------------------------------------------------------------------
// 8. マイリストから個別の動画を削除
// ----------------------------------------------------------------------
export async function removeFromPlaylist(playlistId: string, videoId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('video_id', videoId)

  if (error) {
    console.error('removeFromPlaylist エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ----------------------------------------------------------------------
// 9. 特定の動画がどのマイリストに含まれているか取得
// ----------------------------------------------------------------------
export async function getPlaylistsContainingVideo(videoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('playlist_items')
    .select('playlist_id')
    .eq('video_id', videoId)

  if (error) {
    console.error('getPlaylistsContainingVideo エラー:', error)
    return []
  }

  return data.map((item) => item.playlist_id)
}