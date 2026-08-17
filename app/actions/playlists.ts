'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface VideoInput {
  id: string
  title?: string
  thumbnailUrl?: string
}

export async function createPlaylistAndAddVideo(name: string, video: VideoInput) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    
    if (authErr || !user) {
      return { success: false, error: 'ログインしていません' }
    }

    const { data: playlist, error: plErr } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (plErr || !playlist) {
      return { success: false, error: `プレイリスト作成失敗: ${plErr?.message}` }
    }

    const { error: itemErr } = await supabase.from('playlist_items').insert({
      playlist_id: playlist.id,
      video_id: video.id,
      video_title: video.title || 'YouTube動画',
      thumbnail_url: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      position: 0,
    })

    if (itemErr) {
      if (itemErr.code === '23505' || itemErr.message.includes('duplicate key')) {
        return { success: false, error: 'この動画はすでにこのマイリストに追加されています' }
      }
      return { success: false, error: `動画保存失敗: ${itemErr.message}` }
    }

    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: `予期せぬエラー: ${e.message}` }
  }
}

export async function addVideoToPlaylist(playlistId: string, video: VideoInput) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()

    if (authErr || !user) {
      return { success: false, error: 'ログインしていません' }
    }

    const { error: itemErr } = await supabase.from('playlist_items').insert({
      playlist_id: playlistId,
      video_id: video.id,
      video_title: video.title || 'YouTube動画',
      thumbnail_url: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      position: 0,
    })

    if (itemErr) {
      if (itemErr.code === '23505' || itemErr.message.includes('duplicate key')) {
        return { success: false, error: 'この動画はすでにこのマイリストに追加されています' }
      }
      return { success: false, error: `動画追加失敗: ${itemErr.message}` }
    }

    revalidatePath('/playlists')
    return { success: true }
  } catch (e: any) {
    return { success: false, error: `予期せぬエラー: ${e.message}` }
  }
}

export async function createPlaylist(name: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: '未ログイン' }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/playlists')
    return { success: true, playlist }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deletePlaylist(playlistId: string) {
  const supabase = await createClient()
  await supabase.from('playlists').delete().eq('id', playlistId)
  revalidatePath('/playlists')
  return { success: true }
}

export async function renamePlaylist(playlistId: string, newName: string) {
  const supabase = await createClient()
  await supabase.from('playlists').update({ name: newName }).eq('id', playlistId)
  revalidatePath('/playlists')
  return { success: true }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string) {
  const supabase = await createClient()
  await supabase.from('playlist_items').delete().eq('playlist_id', playlistId).eq('video_id', videoId)
  revalidatePath('/playlists')
  return { success: true }
}

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