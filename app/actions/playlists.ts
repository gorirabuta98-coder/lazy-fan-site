'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 1. 新規マイリスト作成 ＆ 動画追加
export async function createPlaylistAndAddVideo(name: string, videoId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

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
export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

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

// 6. マイリストから特定の動画を削除（1引数・2引数の両方に対応）
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

// 8. マイリストと紐づく動画一覧を取得（マイリストページ用）
export async function getPlaylistsWithVideos() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_items (
        video_id,
        videos (*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching playlists with videos:', error)
    return []
  }

  return playlists || []
}