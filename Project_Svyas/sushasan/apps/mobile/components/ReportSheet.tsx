import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../lib/colors'

// ReportSheet is implemented inline in app/report.tsx
// This file is a placeholder for future extraction to a bottom sheet component
export function ReportSheet() {
  return <View style={styles.container}><Text style={styles.text}>Report Sheet</Text></View>
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:      { color: colors.ink3 },
})
