'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PlaylistItem {
  id?: string
  playlist_id: string
  video_id: string
  title: string
  thumbnail_url: string
  created_at?: string
}

export interface Playlist {
  id: string
  title: string
  created_at?: string
  playlist_items?: PlaylistItem[]
}

/**
 * すべてのマイリスト一覧を取得する
 */
export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getPlaylists DBエラー:', error)
      return []
    }

    return (data as Playlist[]) || []
  } catch (err) {
    console.error('getPlaylists 例外エラー:', err)
    return []
  }
}

/**
 * マイリスト一覧を、含まれる動画データと一緒に取得する
 */
export async function getPlaylistsWithVideos() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getPlaylistsWithVideos DBエラー:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('getPlaylistsWithVideos 例外エラー:', err)
    return []
  }
}

/**
 * IDを指定して特定のマイリストと、その中に含まれる動画を取得する
 */
export async function getPlaylistById(playlistId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_items (*)
      `)
      .eq('id', playlistId)
      .single()

    if (error) {
      console.error('getPlaylistById DBエラー:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('getPlaylistById 例外エラー:', err)
    return null
  }
}

/**
 * 新しいマイリストを作成する
 */
export async function createPlaylist(title: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('playlists')
      .insert([{ title }])
      .select()
      .single()

    if (error) {
      console.error('createPlaylist DBエラー:', error)
      return { success: false, playlist: null, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/playlists')
    return { success: true, playlist: data, error: null }
  } catch (err: any) {
    console.error('createPlaylist 例外エラー:', err)
    return { success: false, playlist: null, error: err.message || '不明なエラー' }
  }
}

/**
 * マイリストのタイトルを更新（変更）する
 */
export async function updatePlaylistTitle(playlistId: string, newTitle: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('playlists')
      .update({ title: newTitle })
      .eq('id', playlistId)
      .select()
      .single()

    if (error) {
      console.error('updatePlaylistTitle DBエラー:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/playlists')
    revalidatePath(`/playlists/${playlistId}`)
    return { success: true, playlist: data, error: null }
  } catch (err: any) {
    console.error('updatePlaylistTitle 例外エラー:', err)
    return { success: false, error: err.message || '不明なエラー' }
  }
}

/**
 * マイリストを削除する（紐づく動画アイテムも削除）
 */
export async function deletePlaylist(playlistId: string) {
  try {
    const supabase = await createClient()

    // 1. 紐づく動画アイテムを削除
    await supabase.from('playlist_items').delete().eq('playlist_id', playlistId)

    // 2. マイリスト本体を削除
    const { error } = await supabase.from('playlists').delete().eq('id', playlistId)

    if (error) {
      console.error('deletePlaylist DBエラー:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/playlists')
    return { success: true, error: null }
  } catch (err: any) {
    console.error('deletePlaylist 例外エラー:', err)
    return { success: false, error: err.message || '不明なエラー' }
  }
}

/**
 * 単一の動画をマイリストに追加する
 */
export async function addToPlaylist(
  playlistId: string,
  video: { id: string; title: string; thumbnail_url: string }
) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('playlist_items').upsert(
      {
        playlist_id: playlistId,
        video_id: video.id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
      },
      { onConflict: 'playlist_id,video_id' }
    )

    if (error) {
      console.error('addToPlaylist DBエラー:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/playlists')
    revalidatePath(`/playlists/${playlistId}`)
    return { success: true, error: null }
  } catch (err: any) {
    console.error('addToPlaylist 例外エラー:', err)
    return { success: false, error: err.message || '不明なエラー' }
  }
}

/**
 * 複数の動画を一括でマイリストに追加する（エラー対策強化版）
 */
export async function addMultipleToPlaylist(
  playlistId: string,
  videos: { id: string; title: string; thumbnail_url?: string; thumbnail?: string }[]
) {
  try {
    const supabase = await createClient()

    // 1. 既にこのマイリストに存在する動画IDを取得
    const { data: existingItems, error: fetchError } = await supabase
      .from('playlist_items')
      .select('video_id')
      .eq('playlist_id', playlistId)

    if (fetchError) {
      console.error('既存アイテム取得エラー:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const existingVideoIds = new Set(existingItems?.map((item) => item.video_id) || [])

    // 2. まだ追加されていない動画だけを抽出 ＆ データのフォーマット補正
    const newItems = videos
      .filter((v) => v.id && !existingVideoIds.has(v.id))
      .map((v) => ({
        playlist_id: playlistId,
        video_id: v.id,
        title: v.title || '無題',
        thumbnail_url: v.thumbnail_url || v.thumbnail || '',
      }))

    // 追加する対象がなければ成功として返す
    if (newItems.length === 0) {
      return { success: true, error: null }
    }

    // 3. insert で安全に追加（onConflictに依存しない）
    const { error: insertError } = await supabase
      .from('playlist_items')
      .insert(newItems)

    if (insertError) {
      console.error('一括追加 insert エラー:', insertError)
      return { success: false, error: insertError.message }
    }

    revalidatePath('/')
    revalidatePath('/playlists')
    revalidatePath(`/playlists/${playlistId}`)
    return { success: true, error: null }
  } catch (err: any) {
    console.error('addMultipleToPlaylist 例外エラー:', err)
    return { success: false, error: err.message || '不明なエラーが発生しました' }
  }
}
// マイリストから個別の動画を削除
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