import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { colors } from '../lib/colors'
import { fetchAllWards } from '../lib/api'
import type { Cluster, Ward } from '../lib/types'
import MapView, { Circle, PROVIDER_DEFAULT } from 'react-native-maps'

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌'
}
const ISSUE_COLOR: Record<string, string> = {
  traffic: colors.traffic, water: colors.water,
  electricity: colors.electricity, garbage: colors.garbage, other: colors.other,
}

type WardData = { ward: Ward; clusters: Cluster[] }

// Pilot ward center coordinates
const PILOT_COORDS: Record<string, { lat: number; lng: number }> = {
  '46': { lat: 18.461, lng: 73.905 },
  '47': { lat: 18.458, lng: 73.910 },
  '43': { lat: 18.452, lng: 73.908 },
}

export default function HomeScreen() {
  const [wards, setWards]       = useState<WardData[]>([])
  const [selected, setSelected] = useState<Cluster | null>(null)

  useEffect(() => {
    fetchAllWards()
      .then(d => setWards(d.wards ?? []))
      .catch(() => {})
  }, [])

  // Flatten all clusters with approximate coordinates
  const markers: Array<Cluster & { lat: number; lng: number }> = wards.flatMap(w =>
    w.clusters.map((c, i) => {
      const base = PILOT_COORDS[c.ward_id] ?? { lat: 18.460, lng: 73.905 }
      return {
        ...c,
        lat: base.lat + (i * 0.003) * (i % 2 === 0 ? 1 : -1),
        lng: base.lng + (i * 0.002) * (i % 2 === 0 ? -1 : 1),
      }
    })
  )

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude:      18.4605,
          longitude:     73.9040,
          latitudeDelta:  0.035,
          longitudeDelta: 0.035,
        }}
      >
        {markers.map(m => (
          <Circle
            key={m.id}
            center={{ latitude: m.lat, longitude: m.lng }}
            radius={Math.min(80, 30 + (m.post_count ?? 1) * 2)}
            fillColor={`${ISSUE_COLOR[m.issue_tag] ?? colors.other}CC`}
            strokeColor={ISSUE_COLOR[m.issue_tag] ?? colors.other}
            strokeWidth={1.5}
            onPress={() => setSelected(m)}
          />
        ))}
      </MapView>

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.headerTitle}>Sushaasan</Text>
          <Text style={styles.headerSub}>NIBM · Salunke Vihar · Kondhwa</Text>
        </View>
      </SafeAreaView>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => router.push('/report')}
          activeOpacity={0.85}
        >
          <Text style={styles.reportBtnText}>+ Report an issue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dashBtn}
          onPress={() => router.push('/dashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.dashBtnText}>View transparency →</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Hotspot popup */}
      {selected && (
        <View style={styles.popup}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.popupClose}>
            <Text style={{ color: colors.ink3, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
          <View style={styles.popupBadge}>
            <Text style={{ color: ISSUE_COLOR[selected.issue_tag] ?? colors.other, fontSize: 11, fontWeight: '700' }}>
              {ISSUE_EMOJI[selected.issue_tag]} {selected.issue_tag.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.popupTitle} numberOfLines={2}>{selected.centroid_text}</Text>
          <Text style={styles.popupMeta}>{selected.post_count} reports · severity {selected.severity_avg?.toFixed(1)}/5</Text>
          <TouchableOpacity
            style={[styles.popupCta, { backgroundColor: colors.navy }]}
            onPress={() => { setSelected(null); router.push(`/ward/${selected.ward_id}`) }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>View ward report →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.navy },
  header:        { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerInner:   { marginHorizontal: 16, marginTop: 4, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(11,31,58,0.92)', borderRadius: 16 },
  headerTitle:   { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  headerSub:     { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1, fontFamily: 'Inter_400Regular' },
  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  reportBtn:     { backgroundColor: colors.saffron, borderRadius: 20, paddingVertical: 16, alignItems: 'center', shadowColor: colors.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  reportBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  dashBtn:       { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  dashBtnText:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  popup:         { position: 'absolute', bottom: 140, left: 16, right: 16, backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12, zIndex: 20 },
  popupClose:    { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  popupBadge:    { backgroundColor: '#f5f5f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  popupTitle:    { fontSize: 15, fontWeight: '600', color: colors.ink, lineHeight: 22, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  popupMeta:     { fontSize: 12, color: colors.ink3, marginBottom: 12, fontFamily: 'Inter_400Regular' },
  popupCta:      { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
})
