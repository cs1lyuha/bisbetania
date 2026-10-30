import React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, type Insets, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { LIQUID_GLASS } from '../lib/glass';

interface Props {
  onPress: () => void;
  children: React.ReactNode;
  /** Înălțimea (și lățimea, dacă e rotund). */
  size?: number;
  /** Pastilă cu text lângă iconiță, în loc de cerc. */
  pill?: boolean;
  /** Margini față de vecini. */
  style?: StyleProp<ViewStyle>;
  hitSlop?: number | Insets;
  accessibilityLabel?: string;
}

/**
 * Butonul rotund de pe antetele colorate. Pe iOS 26+ e sticlă Apple interactivă: la atingere se umflă și
 * strălucește, ca butoanele sistemului. În rest, un cerc alb translucid.
 */
export default function GlassButton({ onPress, children, size = 40, pill = false, style, hitSlop = 8, accessibilityLabel }: Props) {
  const shape: ViewStyle = {
    height: size,
    minWidth: size,
    paddingHorizontal: pill ? 12 : 0,
    borderRadius: size / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };
  if (LIQUID_GLASS) {
    return (
      <Pressable onPress={onPress} hitSlop={hitSlop} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={style}>
        {/* Închisă, ca iconițele albe să se citească pe orice accent. */}
        <GlassView isInteractive glassEffectStyle="regular" colorScheme="dark" style={shape}>
          {children}
        </GlassView>
      </Pressable>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={hitSlop}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[shape, styles.fallback, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallback: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});
