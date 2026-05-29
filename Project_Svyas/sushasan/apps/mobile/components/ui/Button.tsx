import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../lib/colors'

type ButtonVariant = 'saffron' | 'navy' | 'ghost'

type ButtonProps = {
  label: string
  onPress: () => void
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

const BG: Record<ButtonVariant, string> = {
  saffron: colors.saffron,
  navy:    colors.navy,
  ghost:   'transparent',
}
const FG: Record<ButtonVariant, string> = {
  saffron: '#fff',
  navy:    '#fff',
  ghost:   colors.navy,
}

export function Button({ label, onPress, variant = 'saffron', loading, disabled, style, textStyle }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { backgroundColor: BG[variant] },
        variant === 'ghost' && styles.ghostBorder,
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
    >
      {loading
        ? <ActivityIndicator color={FG[variant]} size="small" />
        : <Text style={[styles.label, { color: FG[variant] }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn:         { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  ghostBorder: { borderWidth: 1.5, borderColor: colors.navy },
  label:       { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
})
