import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { isSupabaseConfigured, createServerClient } from '@/lib/supabase'
import { getWardData } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { issue_tag, sub_tag, description, severity, ward_id, landmark, photo_url } = body

    // Validate required fields
    if (!issue_tag || !ward_id || !landmark) {
      return NextResponse.json(
        { error: 'Missing required fields: issue_tag, ward_id, landmark' },
        { status: 400 }
      )
    }

    // ── Supabase path ────────────────────────────────────────────────────────
    if (isSupabaseConfigured()) {
      const supabase = createServerClient()

      // 1. Insert raw_post
      const rawPostData: Record<string, unknown> = {
        source:          'citizen',
        source_post_id:  `citizen_${Date.now()}_${randomUUID().slice(0, 8)}`,
        raw_text:        description || `[${issue_tag}] ${sub_tag || ''} at ${landmark}`,
        author_hash:     createHash('sha256').update(randomUUID()).digest('hex').slice(0, 16),
        geo_hint:        landmark,
      }
      // photo_url is a new column — add only if provided (graceful if column missing)
      if (photo_url) rawPostData.photo_url = photo_url

      let rawPostId: string | null = null
      try {
        const { data: rawPost, error: rawErr } = await supabase
          .from('raw_posts')
          .insert(rawPostData)
          .select('id')
          .single()
        if (rawErr) throw rawErr
        rawPostId = rawPost.id
      } catch {
        // If insert fails (e.g. photo_url column missing), retry without it
        const { data: rawPost, error: rawErr2 } = await supabase
          .from('raw_posts')
          .insert({ ...rawPostData, photo_url: undefined })
          .select('id')
          .single()
        if (rawErr2) throw rawErr2
        rawPostId = rawPost.id
      }

      // 2. Insert classified post
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          raw_post_id:     rawPostId,
          text_clean:      description || `Issue at ${landmark}`,
          issue_tag,
          sub_tags:        sub_tag ? [sub_tag] : [],
          severity:        severity ?? 3,
          sentiment:       -1,
          cited_location:  landmark,
          is_actionable:   true,
          civic_ask:       sub_tag || issue_tag,
          ward_id,
          classifier_ver:  'citizen-v1',
        })
        .select('id')
        .single()
      if (postErr) throw postErr

      // 3. Find or create cluster
      const { data: existingCluster } = await supabase
        .from('clusters')
        .select('*')
        .eq('ward_id', ward_id)
        .eq('issue_tag', issue_tag)
        .eq('status', 'open')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      let clusterId: string
      let clusterPostCount: number

      if (existingCluster) {
        // Update post count
        await supabase
          .from('clusters')
          .update({ post_count: existingCluster.post_count + 1, updated_at: new Date().toISOString() })
          .eq('id', existingCluster.id)
        clusterId      = existingCluster.id
        clusterPostCount = existingCluster.post_count + 1
      } else {
        // Create new cluster
        const { data: newCluster, error: clusterErr } = await supabase
          .from('clusters')
          .insert({
            ward_id,
            issue_tag,
            centroid_text: `Citizen report: ${sub_tag || issue_tag} at ${landmark}`,
            post_count:    1,
            severity_avg:  severity ?? 3,
            status:        'open',
          })
          .select('id')
          .single()
        if (clusterErr) throw clusterErr
        clusterId      = newCluster.id
        clusterPostCount = 1
      }

      // 4. Insert cluster_posts join
      await supabase
        .from('cluster_posts')
        .insert({ cluster_id: clusterId, post_id: post.id })

      // 5. Fetch ward name
      const { data: wardRow } = await supabase
        .from('wards')
        .select('name')
        .eq('id', ward_id)
        .single()

      const wardName = wardRow?.name ?? `Ward ${ward_id}`

      return NextResponse.json({
        success: true,
        cluster: {
          id:            clusterId,
          issue_tag,
          post_count:    clusterPostCount,
          ward_name:     wardName,
          centroid_text: existingCluster?.centroid_text ?? `${issue_tag} issue at ${landmark}`,
          ward_id,
        },
      })
    }

    // ── Seed / fallback path ─────────────────────────────────────────────────
    const wardData = getWardData(ward_id)
    if (!wardData) {
      return NextResponse.json({ success: true, cluster: null })
    }

    const matchingCluster = wardData.clusters.find(c => c.issue_tag === issue_tag)

    return NextResponse.json({
      success: true,
      cluster: matchingCluster
        ? {
            id:            matchingCluster.id,
            issue_tag:     matchingCluster.issue_tag,
            post_count:    (matchingCluster.post_count ?? 0) + 1,
            ward_name:     wardData.ward.name,
            centroid_text: matchingCluster.centroid_text,
            ward_id,
          }
        : null,
    })
  } catch (err) {
    console.error('[api/report]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
