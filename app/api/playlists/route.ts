import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// マイリスト一覧取得
export async function GET() {
  const supabase = await createClient()

  // ログインユーザー取得
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json([], { status: 200 })
  }

  const { data, error } = await supabase
    .from('playlists')
    .select('*, playlist_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 新規マイリスト作成
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 })
  }

  const { title } = await request.json()

  if (!title) {
    return NextResponse.json({ error: 'タイトルが必要です' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('playlists')
    .insert([{ title, user_id: user.id }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}