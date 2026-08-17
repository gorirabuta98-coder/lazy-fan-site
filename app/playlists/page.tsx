'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// 新規マイリスト作成 ＆ 動画追加
export async function createPlaylistAndAddVideo(name: string, videoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // 1. 新しいマイリストを作成
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .insert({
      user_id: user.id,
      name: name,
    })
    .select()
    .single()

  if (playlistError || !playlist) {
    console.error('Error creating playlist:', playlistError)
    throw new Error('Failed to create playlist')
  }

  // 2. 作成したマイリストに動画を追加
  const { error: itemError } = await supabase.from('playlist_items').insert({
    playlist_id: playlist.id,
    video_id: videoId,
  })

  if (itemError) {
    console.error('Error adding video to playlist:', itemError)
    throw new Error('Failed to add video to playlist')
  }

  revalidatePath('/playlists')
  return playlist
}

// 既存マイリストへ動画追加
export async function addVideoToPlaylist(playlistId: string, videoId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('playlist_items').insert({
    playlist_id: playlistId,
    video_id: videoId,
  })

  if (error) {
    console.error('Error adding video to playlist:', error)
    throw new Error('Failed to add video to playlist')
  }

  revalidatePath('/playlists')
}

// ユーザーのマイリスト一覧を取得
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