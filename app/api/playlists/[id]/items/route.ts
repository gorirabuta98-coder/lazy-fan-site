import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// マイリストに動画追加 (POST)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { videoId, videoTitle, thumbnailUrl } = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('playlist_items')
      .insert([
        {
          playlist_id: id,
          video_id: videoId,
          video_title: videoTitle,
          thumbnail_url: thumbnailUrl,
        },
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// マイリストから動画削除 (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params
    const { itemId, videoId } = await request.json()
    const supabase = await createClient()

    let query = supabase.from('playlist_items').delete().eq('playlist_id', playlistId)

    if (itemId) {
      query = query.eq('id', itemId)
    } else if (videoId) {
      query = query.eq('video_id', videoId)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}