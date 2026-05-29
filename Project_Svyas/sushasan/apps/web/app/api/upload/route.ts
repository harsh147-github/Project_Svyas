import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    // If Supabase not configured, return null URL (non-fatal)
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ url: null })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ url: null })
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ url: null })
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ url: null })
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const randomSuffix = randomUUID().slice(0, 8)
    const path = `reports/${Date.now()}_${randomSuffix}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    const supabase = createServerClient()

    const { error: uploadErr } = await supabase.storage
      .from('report-photos')
      .upload(path, buffer, {
        contentType: file.type,
        upsert:      false,
      })

    if (uploadErr) {
      console.error('[api/upload] storage error:', uploadErr)
      return NextResponse.json({ url: null })
    }

    const { data: urlData } = supabase.storage
      .from('report-photos')
      .getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('[api/upload]', err)
    return NextResponse.json({ url: null })
  }
}
