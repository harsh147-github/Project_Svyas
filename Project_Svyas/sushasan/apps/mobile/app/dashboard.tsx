import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { fetchAllWards } from '../lib/api'
import { colors } from '../lib/colors'
import type { Cluster, Ward } from '../lib/types'

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open',        bg: '#fff7ed', text: '#c2410c' },
  in_progress: { label: 'In progress', bg: '#eff6ff', text: '#1d4ed8' },
  resolved:    { label: 'Resolved',    bg: '#f0fdf4', text: '#15803d' },
}
const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌'
}

export default function DashboardScreen() {
  const [wards, setWards]     = useState<Array<{ ward: Ward; clusters: Cluster[] }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllWards().then(d => setWards(d.wards ?? [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const pilotWards = wards.filter(w => w.ward.tier === 'pilot')

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 14 }}>← Map</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Transparency</Text>
          <Text style={styles.sub}>What is being done in your area</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.saffron} size="large" />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
          {pilotWards.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No ward data available yet.</Text>
              <Text style={styles.emptySub}>Check back soon as data is collected for pilot wards.</Text>
            </View>
          )}
          {pilotWards.map(({ ward, clusters }) => (
            <TouchableOpacity
              key={ward.id}
              style={styles.wardCard}
              onPress={() => router.push(`/ward/${ward.id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.wardHeader}>
                <View>
                  <Text style={styles.wardNum}>Ward {ward.ward_number}</Text>
                  <Text style={styles.wardName}>{ward.name}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.clusterList}>
                {clusters.slice(0, 3).map(c => {
                  const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.open
                  return (
                    <View key={c.id} style={styles.clusterRow}>
                      <Text style={{ fontSize: 16 }}>{ISSUE_EMOJI[c.issue_tag]}</Text>
                      <Text style={styles.clusterText} numberOfLines={1}>{c.centroid_text}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.navy },
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { paddingVertical: 6, paddingRight: 8 },
  title:       { fontSize: 20, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  sub:         { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1, fontFamily: 'Inter_400Regular' },
  body:        { padding: 16, gap: 12 },
  emptyState:  { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyText:   { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  emptySub:    { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8, textAlign: 'center', fontFamily: 'Inter_400Regular', lineHeight: 20 },
  wardCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  wardHeader:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  wardNum:     { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.ink4, fontFamily: 'Inter_700Bold', textTransform: 'uppercase' },
  wardName:    { fontSize: 16, fontWeight: '600', color: colors.ink, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  chevron:     { fontSize: 22, color: colors.ink4, marginTop: -2 },
  clusterList: { gap: 8 },
  clusterRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clusterText: { flex: 1, fontSize: 12, color: colors.ink3, fontFamily: 'Inter_400Regular' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText:  { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
})
