export type MemberKey = 'dobashin' | 'takashi' | 'tecchan' | 'tomoyan' | 'pero' | 'perorinu'

export type MemberInfo = {
  key: MemberKey
  name: string
  shortName: string
  colorName: string
  bgColor: string
  textColor: string
  borderColor: string
  hex: string
}

// 投票データ用型（pero / perorinu の双方に完全対応）
export type MemberVotes = {
  dobashin: number
  takashi: number
  tecchan: number
  tomoyan: number
  pero: number
  perorinu?: number
  [key: string]: number | undefined
}

// サマリー用型定義
export type MemberSummary = {
  key: MemberKey | string
  name: string
  shortName: string
  points: number
  totalPoints: number
  bgColor: string
  textColor: string
  borderColor: string
  [key: string]: any
}

export const MEMBERS: MemberInfo[] = [
  {
    key: 'dobashin',
    name: 'どば師匠',
    shortName: 'どば',
    colorName: '赤',
    bgColor: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
    hex: '#ef4444',
  },
  {
    key: 'takashi',
    name: 'たかし',
    shortName: 'たかし',
    colorName: '緑',
    bgColor: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    borderColor: 'border-emerald-500',
    hex: '#10b981',
  },
  {
    key: 'tecchan',
    name: 'てっちゃん',
    shortName: 'てつ',
    colorName: '青',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500',
    hex: '#3b82f6',
  },
  {
    key: 'tomoyan',
    name: 'ともやん',
    shortName: 'とも',
    colorName: '黄色',
    bgColor: 'bg-amber-400',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-400',
    hex: '#f59e0b',
  },
  {
    key: 'pero',
    name: 'ぺろ愛男爵',
    shortName: 'ぺろ',
    colorName: 'ピンク',
    bgColor: 'bg-pink-500',
    textColor: 'text-pink-500',
    borderColor: 'border-pink-500',
    hex: '#ec4899',
  },
]