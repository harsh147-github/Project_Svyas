import { StyleSheet, View } from 'react-native'
import MapView, { Circle, PROVIDER_DEFAULT } from 'react-native-maps'
import { colors } from '../lib/colors'
import type { Cluster, IssueTag } from '../lib/types'

const ISSUE_COLOR: Record<IssueTag, string> = {
  traffic:     colors.traffic,
  water:       colors.water,
  electricity: colors.electricity,
  garbage:     colors.garbage,
  other:       colors.other,
}

type MarkerCluster = Cluster & { lat: number; lng: number }

type WardMapProps = {
  markers: MarkerCluster[]
  onClusterPress?: (cluster: Cluster) => void
  initialLat?: number
  initialLng?: number
  latDelta?: number
  lngDelta?: number
}

export function WardMap({
  markers,
  onClusterPress,
  initialLat = 18.4605,
  initialLng = 73.9040,
  latDelta = 0.035,
  lngDelta = 0.035,
}: WardMapProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude:      initialLat,
        longitude:     initialLng,
        latitudeDelta:  latDelta,
        longitudeDelta: lngDelta,
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
          onPress={() => onClusterPress?.(m)}
        />
      ))}
    </MapView>
  )
}
