import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // ログインユーザー: 自身のマイリストを取得
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } else {
    // ② ゲストユーザー: デフォルトマイリスト（または user_id が NULL のもの）を取得
    const { data, error } = await supabase
      .from('playlists')
      .select('*, playlist_items(*)')
      .or('is_default.eq.true,user_id.is.null')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ゲストは新規作成不可
  if (!user) {
    return NextResponse.json({ error: 'マイリストを作成するにはログインが必要です' }, { status: 401 })
  }

  const { title } = await request.json()
  const { data, error } = await supabase
    .from('playlists')
    .insert([{ title, user_id: user.id }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}