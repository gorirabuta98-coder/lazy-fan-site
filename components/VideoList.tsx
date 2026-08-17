'use server'

import { createClient } from '@/lib/supabase/server'

export interface Video {
  id: string
  title: string
  thumbnail_url: string
  published_at: string
  is_short?: boolean
}

// 1. 横動画（通常動画）のみを取得（トップ用）
export async function getVideos(limit = 24) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .or('is_short.eq.false,is_short.is.null')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }

  return (data as Video[]) || []
}

// 2. ショート動画のみを取得
export async function getShorts(limit = 24) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('is_short', true)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching shorts:', error)
    return []
  }

  return (data as Video[]) || []
}

// 3. パート指定（分割取得）で横動画と総件数を取得 (VideoList用)
export async function getVideosByPart(part: number = 1, pageSize: number = 20) {
  const supabase = await createClient()

  const from = (part - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('videos')
    .select('*', { count: 'exact' })
    .or('is_short.eq.false,is_short.is.null')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching videos by part:', error)
    return { videos: [], totalCount: 0 }
  }

  return {
    videos: (data as Video[]) || [],
    totalCount: count || 0,
  }
}

// 4. 横動画の総件数を取得
export async function getVideosCount() {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .or('is_short.eq.false,is_short.is.null')

  if (error) {
    console.error('Error getting videos count:', error)
    return 0
  }

  return count || 0
}