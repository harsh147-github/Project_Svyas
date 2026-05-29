import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../../lib/colors'

type BadgeStatus = 'open' | 'in_progress' | 'resolved' | 'draft' | string

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open',        bg: '#fff7ed', text: '#c2410c' },
  in_progress: { label: 'In progress', bg: '#eff6ff', text: '#1d4ed8' },
  resolved:    { label: 'Resolved',    bg: '#f0fdf4', text: '#15803d' },
  draft:       { label: 'Draft',       bg: '#f5f5f0', text: colors.ink3 },
}

type BadgeProps = {
  status: BadgeStatus
  style?: ViewStyle
}

export function Badge({ status, style }: BadgeProps) {
  const conf = STATUS_MAP[status] ?? STATUS_MAP.open
  return (
    <View style={[styles.badge, { backgroundColor: conf.bg }, style]}>
      <Text style={[styles.label, { color: conf.text }]}>{conf.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  label: { fontSize: 10, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
})
