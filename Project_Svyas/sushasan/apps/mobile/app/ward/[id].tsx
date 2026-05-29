import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { fetchWard } from '../../lib/api'
import { colors } from '../../lib/colors'
import type { WardFull } from '../../lib/types'

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌'
}
const ISSUE_COLOR: Record<string, string> = {
  traffic: colors.traffic, water: colors.water,
  electricity: colors.electricity, garbage: colors.garbage, other: colors.other,
}

function fmt(n: number) {
  if (n >= 1e7)  return `₹${(n/1e7).toFixed(1)} Cr`
  if (n >= 1e5)  return `₹${(n/1e5).toFixed(1)} L`
  if (n >= 1000) return `₹${(n/1000).toFixed(0)}K`
  return `₹${n}`
}

export default function WardScreen() {
  const { id }                  = useLocalSearchParams<{ id: string }>()
  const [data, setData]         = useState<WardFull | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    fetchWard(id).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.saffron} size="large" />
    </View>
  )

  if (!data) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableOpacity onPress={() => router.back()} style={{ padding: 16 }}>
        <Text style={{ color: colors.navy }}>← Back</Text>
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.ink3 }}>Ward not found</Text>
      </View>
    </SafeAreaView>
  )

  const { ward, clusters, solutions } = data
  const totalCost = solutions.reduce((s, x) => s + (x.total_cost_est_inr ?? 0), 0)
  const budgetPct = ward.annual_budget_inr ? Math.min(100, (totalCost / ward.annual_budget_inr) * 100) : 0

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 14 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.wardNum}>Ward {ward.ward_number}</Text>
          <Text style={styles.wardName}>{ward.name}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {/* Budget bar */}
        {ward.annual_budget_inr > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Budget snapshot</Text>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Est. solution cost</Text>
              <Text style={styles.budgetValue}>{fmt(totalCost)}</Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Annual allocation</Text>
              <Text style={styles.budgetValue}>{fmt(ward.annual_budget_inr)}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${budgetPct}%` }]} />
            </View>
            <Text style={styles.budgetPct}>
              {budgetPct.toFixed(1)}% of annual budget{' '}
              <Text style={{ color: budgetPct <= 100 ? colors.indiaGreen : colors.saffronDark, fontWeight: '600' }}>
                {budgetPct <= 100 ? '✅ Within budget' : '⚠️ Exceeds'}
              </Text>
            </Text>
          </View>
        )}

        {/* Active issues */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Active issues this week</Text>
          {clusters.length === 0 && (
            <Text style={{ fontSize: 13, color: colors.ink4 }}>No active issues reported yet.</Text>
          )}
          {clusters.map(c => (
            <View key={c.id} style={styles.clusterRow}>
              <View style={[styles.issueDot, { backgroundColor: ISSUE_COLOR[c.issue_tag] ?? colors.other }]} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: ISSUE_COLOR[c.issue_tag] ?? colors.other, fontFamily: 'Inter_600SemiBold' }}>
                    {ISSUE_EMOJI[c.issue_tag]} {c.issue_tag.charAt(0).toUpperCase() + c.issue_tag.slice(1)}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.ink4 }}>{c.post_count} reports</Text>
                </View>
                <Text style={styles.clusterText} numberOfLines={2}>{c.centroid_text}</Text>
              </View>
              <Text style={styles.severity}>{c.severity_avg?.toFixed(1)}<Text style={{ color: colors.ink4, fontWeight: '400' }}>/5</Text></Text>
            </View>
          ))}
        </View>

        {/* Solutions */}
        {solutions.slice(0, 1).map(s => (
          <View key={s.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={styles.sectionLabel}>AI-suggested steps</Text>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: `${colors.saffron}15` }}>
                <Text style={{ fontSize: 10, color: colors.saffron, fontWeight: '700' }}>Needs official review</Text>
              </View>
            </View>
            <Text style={styles.summaryText}>{s.summary}</Text>
            {s.steps.map((step) => (
              <View key={step.step} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{step.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepAction}>{step.action}</Text>
                  <View style={styles.stepMeta}>
                    <Text style={styles.stepMetaText}>📋 {step.dept}</Text>
                    <Text style={styles.stepMetaText}>⏱ {step.timeline_days}d</Text>
                    <Text style={[styles.stepMetaText, { fontWeight: '600', color: colors.ink2 }]}>{fmt(step.cost_est_inr)}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Total{' '}
                <Text style={{ fontWeight: '700', color: colors.ink }}>{fmt(s.total_cost_est_inr)}</Text>
                {' '}over{' '}
                <Text style={{ fontWeight: '700', color: colors.ink }}>{s.timeline_days} days</Text>
              </Text>
              {s.budget_feasible
                ? <Text style={{ fontSize: 11, fontWeight: '700', color: colors.indiaGreen }}>✓ Within budget</Text>
                : <Text style={{ fontSize: 11, fontWeight: '700', color: colors.saffronDark }}>⚠ Review needed</Text>
              }
            </View>
          </View>
        ))}

        {/* Report CTA */}
        <TouchableOpacity style={styles.reportCta} onPress={() => router.push('/report')} activeOpacity={0.85}>
          <Text style={styles.reportCtaText}>+ Report an issue in this ward</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.navy },
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:      { paddingVertical: 6, paddingRight: 8 },
  wardNum:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  wardName:     { fontSize: 18, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  body:         { padding: 16, gap: 12, backgroundColor: colors.paper },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: colors.ink4, textTransform: 'uppercase', fontFamily: 'Inter_700Bold' },
  budgetRow:    { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel:  { fontSize: 13, color: colors.ink3 },
  budgetValue:  { fontSize: 13, fontWeight: '700', color: colors.ink },
  barBg:        { height: 6, borderRadius: 3, backgroundColor: 'rgba(10,10,10,0.08)', overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3, backgroundColor: colors.saffron },
  budgetPct:    { fontSize: 11, color: colors.ink4 },
  clusterRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  issueDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  clusterText:  { fontSize: 12, color: colors.ink3, marginTop: 2, lineHeight: 17 },
  severity:     { fontSize: 13, fontWeight: '700', color: colors.ink },
  summaryText:  { fontSize: 13, color: colors.ink2, lineHeight: 19, backgroundColor: 'rgba(10,10,10,0.03)', padding: 10, borderRadius: 10 },
  stepRow:      { flexDirection: 'row', gap: 10 },
  stepNum:      { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  stepAction:   { fontSize: 13, fontWeight: '500', color: colors.ink, lineHeight: 18 },
  stepMeta:     { flexDirection: 'row', gap: 10, marginTop: 4 },
  stepMetaText: { fontSize: 11, color: colors.ink3 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.06)' },
  totalLabel:   { fontSize: 12, color: colors.ink3 },
  reportCta:    { backgroundColor: colors.saffron, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: colors.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  reportCtaText:{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
})
