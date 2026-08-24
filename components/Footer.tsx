export default function Footer() {
  // X（旧Twitter）のアカウントID（@抜きの文字列）
  const twitterId = '0w2XbKpl7VZe3jW'

  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-8 px-4 mt-16 text-center text-xs text-gray-500 space-y-2">
      <p className="font-bold text-gray-700">
        ※当サイトはファン個人が運営する非公式ファンツールです。
      </p>
      <p>
        YouTube公式およびレイクレ（Lazy Lie Crazy）、所属事務所様とは一切関係ありません。
      </p>
      <p>
        掲載している動画の著作権・肖像権は各権利所有者に帰属します。
      </p>
      <p className="pt-2">
        権利等に関するお問い合わせや掲載取り下げのご連絡は、
        <a
          href={`https://x.com/${twitterId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-600 underline font-bold hover:text-red-800 ml-1"
        >
          X（旧Twitter）：@{twitterId}
        </a>
        のDMまでお願いいたします。
      </p>
      <p className="text-[10px] text-gray-400 pt-4">
        &copy; {new Date().getFullYear()} レイクレファンツール
      </p>
    </footer>
  )
}