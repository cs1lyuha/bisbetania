import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';
import { mix } from '../lib/color';

/**
 * Fundalul antetelor: accentul închis care trece în diagonală spre varianta lui deschisă, cu o lumină
 * de sus și două cercuri abia vizibile, ca antetul să nu mai fie un bloc plat.
 */
export default function HeaderBackground() {
  const { colors } = useTheme();
  const from = mix(colors.primaryDeep, '#000000', 0.14);
  const to = mix(colors.primaryDeep, colors.primaryBright, 0.55);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[from, colors.primaryDeep, to]} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.55, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { right: -70, top: -90, width: 240, height: 240 }]} />
      <View style={[styles.orb, { right: 70, top: -150, width: 200, height: 200, opacity: 0.7 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.07)' },
});
