import { createHash } from 'crypto'

export interface NormalizedPost {
  platform: string
  content: string
  title: string
  timestamp: string
  engagement: number
  author_hash: string
  url: string
  source_post_id: string
  geo_hint?: string
}

const MONTHLY_SALT = `sushasan-${new Date().getFullYear()}-${new Date().getMonth()}`

export function hashAuthor(username: string): string {
  return createHash('sha256').update(username + MONTHLY_SALT).digest('hex')
}

export const PUNE_KEYWORDS = [
  'NIBM', 'NIBM Road', 'Salunke Vihar', 'Mohammadwadi', 'Mohammed Wadi',
  'Wanowrie', 'Kondhwa', 'Pisoli', 'Undri', 'Konark Pyramid', 'Pyramid Square',
  'Clover Park', 'Lunkad Goldcoast', 'Corinthians', 'Kumar Park',
  'Hadapsar', 'Pune 411048', 'Pune 411040',
  'water supply Pune', 'traffic Pune NIBM', 'garbage Pune',
  'electricity Pune', 'PMC Pune', 'pune municipal corporation',
]
