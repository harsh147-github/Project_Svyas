import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

// Ward ID → route mapping
// Ward 46 = NIBM–Mohammadwadi
// Ward 47 = Salunke Vihar–Wanowrie
// Both are shown in the NIBM pilot page for now

const WARD_ROUTES: Record<string, string> = {
  '46': '/dashboard/nibm',
  '47': '/dashboard/salunke-garbage',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Ward ${id} — Sushasan`,
  }
}

export default async function WardDetailPage({ params }: Props) {
  const { id } = await params
  const target = WARD_ROUTES[id]

  if (target) {
    redirect(target)
  }

  // For unmapped wards, redirect to main dashboard
  redirect('/dashboard')
}
