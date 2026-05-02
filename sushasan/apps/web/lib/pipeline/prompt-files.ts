import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

/** Resolve prompts from monorepo `sushasan/prompts` when cwd is `.../apps/web` or Vercel bundle root. */
export function tryLoadPromptFile(filename: string): string {
  const candidates = [
    join(process.cwd(), '..', '..', 'prompts', filename),
    join(process.cwd(), '..', 'prompts', filename),
    join(process.cwd(), 'prompts', filename),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8')
  }
  return ''
}
