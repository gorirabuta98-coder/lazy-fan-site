import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// マイリスト名変更 (PATCH)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { title } = await request.json()
    const supabase = await createClient()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('playlists')
      .update({ title: title.trim() })
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// マイリスト削除 (DELETE)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    await supabase.from('playlist_items').delete().eq('playlist_id', id)
    const { error } = await supabase.from('playlists').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}