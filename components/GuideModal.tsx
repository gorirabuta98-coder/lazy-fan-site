'use client'

interface GuideModalProps {
  onClose: () => void
}

export default function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base sm:text-lg text-gray-800 flex items-center gap-1.5">
            📖 使い方ガイド
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold px-2 py-1 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-gray-600 leading-relaxed">
          <section className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1">
              1. 🎬 動画の検索・視聴
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li><strong>Part切り替え</strong>: 上部の数字ボタンで過去動画をさかのぼれます。</li>
              <li><strong>キーワード検索</strong>: 「検索」タブで全動画から一括検索。</li>
              <li><strong>選べる再生方法</strong>: サムネイルタップ時に<strong>YouTubeアプリ（Premium広告なし推奨）</strong>か<strong>ブラウザ</strong>を選択できます。</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1">
              2. 📁 マイリスト機能（要ログイン）
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li><strong>1件ずつ追加</strong>: 動画下の「+ リスト追加」をタップ。</li>
              <li><strong>まとめて追加</strong>: 複数の動画にチェックを入れて、下部に表示されるバーから一括追加。</li>
              <li><strong>リスト管理</strong>: 「マイリスト」タブでタイトルの変更や動画の削除が行えます。</li>
            </ul>
          </section>

          <section className="space-y-1">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1">
              3. 🔗 共有＆同期
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-gray-600">
              <li><strong>マイリスト共有</strong>: 「共有」ボタンから専用リンクを発行してLINEやSNSで送信できます。</li>
              <li><strong>最新動画の反映</strong>: 右上の「同期」ボタンでYouTube上の最新データをサイトに取り込みます。</li>
            </ul>
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer mt-2"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}