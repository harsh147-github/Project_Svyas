import { useState, useEffect } from 'react'
import * as Location from 'expo-location'

export type LocationState = {
  lat: number | null
  lng: number | null
  loading: boolean
  error: string | null
  permissionGranted: boolean
}

export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    loading: true,
    error: null,
    permissionGranted: false,
  })

  useEffect(() => {
    let cancelled = false

    async function detect() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          if (!cancelled) setState(s => ({ ...s, loading: false, error: 'Location permission denied', permissionGranted: false }))
          return
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        if (!cancelled) setState({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          loading: false,
          error: null,
          permissionGranted: true,
        })
      } catch (e: any) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: e.message ?? 'Location error' }))
      }
    }

    detect()
    return () => { cancelled = true }
  }, [])

  return state
}
