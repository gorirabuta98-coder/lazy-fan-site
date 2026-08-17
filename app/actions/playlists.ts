'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VideoInput {
  id: string
  title?: string
  thumbnailUrl?: string
}

// 1. 新規マイリスト作成 ＆ 動画追加
export async function createPlaylistAndAddVideo(name: string, video: VideoInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { data: playlist, error: plErr } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (plErr || !playlist) return { success: false, error: plErr?.message || '作成失敗' }

    const { error: itemErr } = await supabase.from('playlist_items').insert({
      playlist_id: playlist.id,
      video_id: video.id,
      video_title: video.title || 'YouTube動画',
      thumbnail_url: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    })

    if (itemErr) {
      await supabase.from('playlist_items').insert({
        playlist_id: playlist.id,
        video_id: video.id,
      })
    }

    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 2. 既存マイリストへ動画追加
export async function addVideoToPlaylist(playlistId: string, video: VideoInput) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { error } = await supabase.from('playlist_items').insert({
      playlist_id: playlistId,
      video_id: video.id,
      video_title: video.title || 'YouTube動画',
      thumbnail_url: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    })

    if (error) {
      await supabase.from('playlist_items').insert({
        playlist_id: playlistId,
        video_id: video.id,
      })
    }

    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 3. 単体マイリスト作成 (PlaylistActions用)
export async function createPlaylist(name: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '認証されていません' }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/playlists')
    return { success: true, playlist }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 4. マイリスト削除
export async function deletePlaylist(playlistId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('playlists').delete().eq('id', playlistId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 5. マイリスト名変更
export async function renamePlaylist(playlistId: string, newName: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('playlists').update({ name: newName }).eq('id', playlistId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 6. 動画の削除
export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('playlist_items').delete().eq('playlist_id', playlistId).eq('video_id', videoId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || 'エラーが発生しました' }
  }
}

// 7. ユーザーのマイリスト一覧を取得
export async function getUserPlaylists() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return playlists || []
}

// 8. マイリスト一覧と動画データを取得
export async function getPlaylistsWithVideos() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: playlists } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!playlists || playlists.length === 0) return []

  const playlistIds = playlists.map(p => p.id)
  const { data: items } = await supabase
    .from('playlist_items')
    .select('*')
    .in('playlist_id', playlistIds)

  return playlists.map(p => {
    const pItems = (items || [])
      .filter(i => i.playlist_id === p.id)
      .map(i => ({
        id: i.id,
        video_id: i.video_id,
        videos: {
          id: i.video_id,
          title: i.video_title || 'YouTube動画',
          thumbnail_url: i.thumbnail_url || `https://i.ytimg.com/vi/${i.video_id}/hqdefault.jpg`,
        }
      }))

    return {
      ...p,
      playlist_items: pItems
    }
  })
}