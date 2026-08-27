'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function getErrorMessage(error: any): string {
  if (!error) return 'エラーが発生しました'
  const message = error.message || ''

  if (message.includes('Invalid login credentials')) {
    return 'メールアドレスまたはパスワードが間違っています。'
  }
  if (message.includes('User already registered')) {
    return 'このメールアドレスは既に登録されています。'
  }
  return message || 'エラーが発生しました。'
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
          if (signInError) throw signInError
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
      router.push('/')
      router.refresh()
    } catch (error: any) {
      setMessage(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'アカウント作成' : 'ログイン'}
          </h1>
          <p className="text-xs text-gray-500">
            マイリストを保存・管理するにはログインが必要です。
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="6文字以上"
            />
          </div>

          {message && (
            <p className="text-xs font-bold text-center text-red-500 bg-red-50 p-3 rounded-xl leading-relaxed">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {loading ? '処理中...' : isSignUp ? '登録する' : 'ログイン'}
          </button>
        </form>

        <div className="space-y-3 pt-2 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage('')
            }}
            className="text-xs font-bold text-gray-500 hover:text-gray-900 underline block w-full"
          >
            {isSignUp
              ? 'すでにアカウントをお持ちの方はこちら（ログイン）'
              : 'アカウントをお持ちでない方はこちら（新規登録）'}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">または</span></div>
          </div>

          {/* ① ゲスト利用ボタン */}
          <Link
            href="/"
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition block text-center"
          >
            ログインせずに使う（ゲスト利用）
          </Link>
        </div>
      </div>
    </div>
  )
}