'use client'
import { useEffect } from 'react'

// lng, lat pairs for each ward centroid
const CENTROIDS: Record<string, [number, number]> = {
  '46': [73.9010, 18.4655],
  '47': [73.8780, 18.4489],
  '43': [73.8832, 18.4788],
  '42': [73.9140, 18.4730],
  '41': [73.8900, 18.4520],
  '44': [73.8950, 18.4400],
  '25': [73.9280, 18.5040],
  '26': [73.9050, 18.4990],
  '4':  [73.8450, 18.5290],
  '5':  [73.8930, 18.5360],
  '6':  [73.9140, 18.5670],
  '7':  [73.9380, 18.5500],
  '3':  [73.8070, 18.5080],
  '1':  [73.7920, 18.5590],
  '8':  [73.9210, 18.5930],
}

export function WardAutoSelect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const wardId = params.get('ward')
    if (!wardId) return
    const centroid = CENTROIDS[wardId]
    const [lng, lat] = centroid ?? [73.8567, 18.5204]
    // Delay lets MapLibre finish loading tiles before flyTo + selectWard
    const timer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('sushaasan:auto-select-ward', {
        detail: { wardId, lat, lng },
      }))
    }, 1800)
    return () => clearTimeout(timer)
  }, [])
  return null
}
