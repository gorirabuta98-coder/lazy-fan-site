'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ==========================================
// 1. マイリスト一覧と動画データを取得
// ==========================================
export async function getPlaylistsWithVideos(deviceId: string) {
  const supabase = await createClient()

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

  query = query.eq('user_id', deviceId)

  const { data, error } = await query

  if (error) {
    console.error('getPlaylistsWithVideos エラー:', error)
    return []
  }

  return data || []
}

// ==========================================
// 2. マイリストの新規作成（単体）
// ==========================================
export async function createPlaylist(title: string, deviceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      title,
      user_id: deviceId,
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

// ==========================================
// 3. マイリストへ動画の追加（単体）
// ==========================================
export async function addToPlaylist(playlistId: string, video: any, deviceId: string) {
  const supabase = await createClient()

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', deviceId)
    .single()

  if (playlistError || !playlist) {
    return { success: false, error: playlistError?.message || 'マイリストが見つかりません。' }
  }

  const videoId = typeof video === 'string' ? video : video.id || video.video_id
  const title = typeof video === 'object' ? video.title || '無題' : '無題'
  const thumbnailUrl =
    typeof video === 'object' ? video.thumbnail_url || video.thumbnail || '' : ''

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

// ==========================================
// 4. マイリストの作成 ＆ 動画一括追加
// ==========================================
export async function addMultipleToPlaylist(
  playlistId: string | null,
  playlistName: string,
  videos: any[],
  deviceId: string
) {
  const supabase = await createClient()

  let targetPlaylistId = playlistId

  if (!targetPlaylistId) {
    const { data: newPlaylist, error: createError } = await supabase
      .from('playlists')
      .insert({
        title: playlistName,
        user_id: deviceId,
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

// ==========================================
// 5. マイリスト名の変更
// ==========================================
export async function updatePlaylistTitle(playlistId: string, title: string, deviceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('playlists')
    .update({ title })
    .eq('id', playlistId)
    .eq('user_id', deviceId)

  if (error) {
    console.error('updatePlaylistTitle エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ==========================================
// 6. マイリストの完全削除
// ==========================================
export async function deletePlaylist(playlistId: string, deviceId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', playlistId)
    .eq('user_id', deviceId)

  if (error) {
    console.error('deletePlaylist エラー:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/playlists')
  return { success: true }
}

// ==========================================
// 7. マイリストから個別の動画を削除
// ==========================================
export async function removeFromPlaylist(playlistId: string, videoId: string, deviceId: string) {
  const supabase = await createClient()

  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('id')
    .eq('id', playlistId)
    .eq('user_id', deviceId)
    .single()

  if (playlistError || !playlist) {
    return { success: false, error: playlistError?.message || 'マイリストが見つかりません。' }
  }

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