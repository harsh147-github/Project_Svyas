import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors } from '../lib/colors'
import type { Cluster, IssueTag } from '../lib/types'

const ISSUE_COLOR: Record<IssueTag, string> = {
  traffic:     colors.traffic,
  water:       colors.water,
  electricity: colors.electricity,
  garbage:     colors.garbage,
  other:       colors.other,
}

const ISSUE_EMOJI: Record<IssueTag, string> = {
  traffic:     '🚗',
  water:       '💧',
  electricity: '⚡',
  garbage:     '🗑️',
  other:       '📌',
}

type HotspotMarkerProps = {
  cluster: Cluster
  onPress?: (cluster: Cluster) => void
}

export function HotspotMarker({ cluster, onPress }: HotspotMarkerProps) {
  const color = ISSUE_COLOR[cluster.issue_tag] ?? colors.other
  const size = Math.min(56, 28 + (cluster.post_count ?? 1) * 1.5)

  return (
    <TouchableOpacity
      onPress={() => onPress?.(cluster)}
      activeOpacity={0.8}
      style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}CC`, borderColor: color }]}
    >
      <Text style={{ fontSize: size * 0.4 }}>{ISSUE_EMOJI[cluster.issue_tag] ?? '📌'}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})
