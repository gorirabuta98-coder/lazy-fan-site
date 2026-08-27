import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// マイリスト一覧取得
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*, playlist_items(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('GET Playlists Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(playlists || [])
  } catch (err: any) {
    console.error('GET Server Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// マイリスト新規作成
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { title } = await request.json()

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 })
    }

    // ユーザー情報の取得（ログイン/匿名ユーザー）
    const { data: { user } } = await supabase.auth.getUser()

    const insertPayload: { title: string; user_id?: string } = {
      title: title.trim(),
    }

    if (user) {
      insertPayload.user_id = user.id
    }

    const { data, error } = await supabase
      .from('playlists')
      .insert([insertPayload])
      .select()

    if (error) {
      console.error('Supabase Insert Error Detail:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (err: any) {
    console.error('POST Server Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}