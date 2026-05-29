import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { colors } from '../lib/colors'
import { submitReport, fetchWardByLocation } from '../lib/api'

const ISSUE_EMOJI: Record<string, string> = {
  traffic: '🚗', water: '💧', electricity: '⚡', garbage: '🗑️', other: '📌'
}
const ISSUE_LABEL: Record<string, string> = {
  traffic: 'Traffic', water: 'Water', electricity: 'Electricity', garbage: 'Garbage', other: 'Civic issue'
}

export default function ReportScreen() {
  const [input, setInput]           = useState('')
  const [wardId, setWardId]         = useState<string | null>(null)
  const [wardName, setWardName]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState<any>(null)
  const inputRef = useRef<TextInput>(null)

  useEffect(() => {
    detectLocation()
    setTimeout(() => inputRef.current?.focus(), 400)
  }, [])

  async function detectLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const d = await fetchWardByLocation(loc.coords.latitude, loc.coords.longitude)
      if (d?.ward_id) { setWardId(d.ward_id); setWardName(d.ward_name ?? null) }
    } catch { /* silent */ }
  }

  async function handleSubmit() {
    const text = input.trim()
    if (!text || submitting) return
    setSubmitting(true); setError(null)
    try {
      const d = await submitReport({ raw_input: text, ward_id: wardId })
      if (d.error) throw new Error(d.error)
      setSuccess(d)
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    const { parsed, cluster } = success
    const color = (colors as any)[parsed?.issue_tag] ?? colors.saffron
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${colors.indiaGreen}18` }]}>
            <Text style={{ fontSize: 32 }}>✅</Text>
          </View>
          <Text style={styles.successTitle}>Signal received</Text>
          <Text style={styles.successSub}>AI read your report and created a civic signal for this ward.</Text>

          {parsed && (
            <View style={styles.parsedCard}>
              <Text style={styles.parsedLabel}>WHAT AI DETECTED</Text>
              <View style={styles.parsedTags}>
                <View style={[styles.tag, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
                  <Text style={[styles.tagText, { color }]}>
                    {ISSUE_EMOJI[parsed.issue_tag]} {ISSUE_LABEL[parsed.issue_tag] ?? parsed.issue_tag}
                  </Text>
                </View>
                <View style={[styles.tag, { backgroundColor: '#f0f0ec', borderColor: '#e0e0d8' }]}>
                  <Text style={[styles.tagText, { color: colors.ink2 }]}>Severity {parsed.severity}/5</Text>
                </View>
                {parsed.location_hint ? (
                  <View style={[styles.tag, { backgroundColor: '#f0f0ec', borderColor: '#e0e0d8' }]}>
                    <Text style={[styles.tagText, { color: colors.ink2 }]}>📍 {parsed.location_hint}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {cluster && (
            <View style={styles.clusterCard}>
              <Text style={[styles.clusterLabel, { color: colors.saffron }]}>YOU JOINED A CLUSTER</Text>
              <Text style={styles.clusterCount}>{cluster.post_count} people reported this in {cluster.ward_name}</Text>
              {cluster.centroid_text ? <Text style={styles.clusterText}>{cluster.centroid_text}</Text> : null}
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#fff' }]} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={{ fontSize: 16, color: colors.ink3 }}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>What&apos;s happening near you?</Text>
            <Text style={styles.headerSub}>Type in any language — AI will understand</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Ward chip */}
          {wardName && (
            <View style={styles.wardChip}>
              <Text style={styles.wardChipText}>📍 {wardName}</Text>
              <TouchableOpacity onPress={() => { setWardId(null); setWardName(null) }}>
                <Text style={{ color: colors.indiaGreen, fontSize: 12, marginLeft: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            multiline
            placeholder={"\"Garbage pile at NIBM Road, 4 days uncollected\"\n\"Paani nahi aa raha 3 din se\"\n\"Signal broken at Konark Square\"\n\nAnything works — just describe what you see."}
            placeholderTextColor="rgba(10,10,10,0.25)"
            textAlignVertical="top"
          />

          <Text style={styles.langNote}>Works in Hindi, Marathi, English or any mix</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: input.trim() ? 1 : 0.4 }]}
            onPress={handleSubmit}
            disabled={!input.trim() || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitBtnText}>AI is reading your report...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Send Report →</Text>
            )}
          </TouchableOpacity>

          <View style={styles.anonRow}>
            <Text style={styles.anonText}>🛡 Completely anonymous — no login, no personal data</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(10,10,10,0.06)', gap: 12 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,10,10,0.06)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  headerTitle:  { fontSize: 20, fontWeight: '700', color: colors.ink, fontFamily: 'Inter_700Bold', lineHeight: 26 },
  headerSub:    { fontSize: 13, color: colors.ink3, marginTop: 2, fontFamily: 'Inter_400Regular' },
  body:         { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 12 },
  wardChip:     { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: `${colors.indiaGreen}12`, borderWidth: 1, borderColor: `${colors.indiaGreen}30` },
  wardChipText: { fontSize: 12, color: colors.indiaGreen, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  textInput:    { backgroundColor: 'rgba(10,10,10,0.03)', borderWidth: 2, borderColor: 'rgba(10,10,10,0.10)', borderRadius: 16, padding: 16, fontSize: 15, color: colors.ink, minHeight: 160, lineHeight: 22, fontFamily: 'Inter_400Regular' },
  langNote:     { fontSize: 11, color: 'rgba(10,10,10,0.35)', textAlign: 'center', fontFamily: 'Inter_400Regular' },
  errorBox:     { backgroundColor: '#fff0f0', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 12, padding: 12 },
  errorText:    { fontSize: 12, color: '#dc2626', fontFamily: 'Inter_400Regular' },
  footer:       { paddingHorizontal: 16, paddingBottom: 8, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(10,10,10,0.06)', paddingTop: 12 },
  submitBtn:    { backgroundColor: colors.saffron, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: colors.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  submitBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  anonRow:      { alignItems: 'center', paddingVertical: 4 },
  anonText:     { fontSize: 11, color: colors.indiaGreen, fontWeight: '500', fontFamily: 'Inter_500Medium' },
  // Success
  successWrap:  { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 48, gap: 16 },
  successIcon:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle: { fontSize: 22, fontWeight: '700', color: colors.ink, fontFamily: 'Inter_700Bold' },
  successSub:   { fontSize: 13, color: colors.ink3, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular' },
  parsedCard:   { width: '100%', backgroundColor: `${colors.navy}08`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${colors.navy}15`, gap: 8 },
  parsedLabel:  { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, color: `${colors.navy}60`, fontFamily: 'Inter_700Bold' },
  parsedTags:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  tagText:      { fontSize: 11, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  clusterCard:  { width: '100%', backgroundColor: `${colors.saffron}0a`, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${colors.saffron}30`, gap: 4 },
  clusterLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.4, fontFamily: 'Inter_700Bold' },
  clusterCount: { fontSize: 14, fontWeight: '600', color: colors.ink, fontFamily: 'Inter_600SemiBold' },
  clusterText:  { fontSize: 12, color: colors.ink3, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  doneBtn:      { width: '100%', backgroundColor: colors.saffron, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: colors.saffron, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  doneBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
})
