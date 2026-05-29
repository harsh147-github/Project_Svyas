import type { Metadata } from 'next'
import { AddReportClient } from './AddReportClient'

export const metadata: Metadata = {
  title: 'Report an issue — Sushaasan',
  description: 'Tell us what\'s broken in your ward. Just speak or type naturally — our AI synthesizes it into a ward-level signal sent to PMC.',
}

export default function AddReportPage() {
  return <AddReportClient />
}
