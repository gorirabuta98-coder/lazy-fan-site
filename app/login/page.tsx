'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    // 1. ゲスト用Cookieを消去
    document.cookie = 'guest_mode=; path=/; max-age=0'

    // 2. ログインまたは新規登録を実行
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error(isSignUp ? '新規登録エラー:' : 'ログインエラー:', error)
      if (error.message.includes('Invalid login credentials')) {
        setErrorMsg('メールアドレスまたはパスワードが正しくありません。')
      } else if (error.message.includes('Email not confirmed')) {
        setErrorMsg('メールアドレスの確認が完了していません。届いたメールのリンクをクリックしてください。')
      } else {
        setErrorMsg(`ログイン失敗: ${error.message}`)
      }
      setLoading(false)
      return
    }

    if (isSignUp) {
      setErrorMsg('登録確認メールを送信しました。メール内のリンクから登録を完了してください。')
      setLoading(false)
      return
    }

    // 3. ログイン成功時
    router.push('/')
    router.refresh()
  }

  const handleGuestLogin = () => {
    document.cookie = 'guest_mode=true; path=/; max-age=86400'
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isSignUp ? '新規登録' : 'ログイン'}</h1>
          <p className="text-xs text-gray-500 mt-2">
            {isSignUp
              ? 'メールアドレスとパスワードを登録してください。'
              : 'マイリストを保存・管理するにはログインが必要です。'}
          </p>
        </div>

        {/* 💡 エラーメッセージ表示エリア */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100 text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-blue-50/50 text-gray-900 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              placeholder="gorirabuta98@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-xl text-sm transition cursor-pointer"
          >
            {loading
              ? isSignUp ? '登録処理中...' : 'ログイン処理中...'
              : isSignUp ? '新規登録' : 'ログイン'}
          </button>
        </form>

        <div className="text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setErrorMsg('')
            }}
            className="text-gray-500 cursor-pointer hover:underline"
          >
            {isSignUp ? 'ログインはこちら' : 'アカウントをお持ちでない方はこちら（新規登録）'}
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-xs text-gray-400 absolute">または</span>
        </div>

        <button
          onClick={handleGuestLogin}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          ログインせずに使う（ゲスト利用）
        </button>
      </div>
    </div>
  )
}