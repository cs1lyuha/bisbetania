import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { GAMES, getWeeklyVerse, isMastered, totalStars } from '../lib/memory';
import { mix } from '../lib/color';
import { FONT } from '../lib/fonts';
import { tap } from '../lib/haptics';
import PressableScale from './PressableScale';
import Sparkles, { type Sparkle } from './Sparkles';
import Stars, { GAME_ICONS } from './Stars';

// Lumina din colțul trofeului: raze subțiri care pornesc din centru (300×300, centrul la 150,150).
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const w = 0.07;
  const p = (t: number) => `${150 + Math.cos(t) * 150} ${150 + Math.sin(t) * 150}`;
  return `M150 150L${p(a - w)}L${p(a + w)}Z`;
}).join('');

/**
 * Provocarea săptămânii pe Acasă: versetul de memorat, cele trei jocuri cu stelele lor și „Joacă”.
 * În culoarea temei (verde pe verde, albastru pe albastru), cu steluțe care se aprind pe margini.
 */
export default function WeeklyChallengeCard() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { memory } = useUserData();
  const verse = getWeeklyVerse(language);
  const score = memory[verse.id];
  const stars = totalStars(score);
  const done = isMastered(score);
  const deep = colors.primaryDeep;
  // Capătul luminos, sus în dreapta, unde nu e text mărunt (stelele stau pe o pastilă închisă).
  const bright = mix(deep, colors.primaryBright, 0.75);
  const out = colors.primaryBright;
  const soft = mix(colors.primaryBright, '#FFFFFF', 0.6);

  const sparkles: Sparkle[] = [
    { top: -12, left: 20, size: 20, color: out, delay: 0, drift: [-3, -6] },
    { top: 16, right: 70, size: 12, color: '#FFFFFF', delay: 270, drift: [0, -3] },
    { bottom: 40, left: -10, size: 16, color: out, delay: 540, drift: [-6, 0] },
    { top: 58, right: -11, size: 22, color: out, delay: 810, drift: [6, -2] },
    { top: 100, right: 26, size: 14, color: soft, delay: 1080, drift: [2, -2] },
    { top: -10, right: 104, size: 14, color: out, delay: 1350, drift: [2, -6] },
    { bottom: -11, left: '44%', size: 17, color: out, delay: 1620, drift: [0, 6] },
    { top: 52, right: 132, size: 9, color: '#FFFFFF', delay: 1890 },
    { bottom: -8, right: 28, size: 13, color: out, delay: 2160, drift: [3, 5] },
    { top: -8, left: '52%', size: 11, color: out, delay: 2430, drift: [0, -5] },
  ];

  return (
    <PressableScale
      onPress={() => {
        tap();
        router.push('/memorare');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${t('challengeTitle')}: ${verse.reference}`}
      wrapperStyle={{ marginHorizontal: 16, marginTop: 18 }}
      style={[styles.card, { backgroundColor: deep, shadowColor: colors.isDark ? '#000000' : deep }]}
    >
      <View style={styles.clip}>
        <LinearGradient
          colors={[mix(deep, '#000000', 0.12), deep, bright]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Svg width={300} height={300} style={styles.glow}>
          <Defs>
            <RadialGradient id="glow" cx="150" cy="150" r="150" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.24} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Path d={RAYS} fill="#FFFFFF" opacity={0.045} />
          <Circle cx={150} cy={150} r={150} fill="url(#glow)" />
        </Svg>
        {/* Trofeul mare, abia vizibil, în colț. */}
        <View style={styles.trophy}>
          <Ionicons name="trophy" size={150} color="#FFFFFF" style={{ opacity: 0.1 }} />
        </View>
      </View>

      <View className="flex-row items-center">
        <View className="flex-row items-center rounded-full px-2.5 py-1 bg-white/15">
          <Ionicons name="game-controller" size={14} color="#FFFFFF" />
          <Text className="font-ui-bold text-[11px] uppercase tracking-widest ml-1.5 text-white">{t('challengeTitle')}</Text>
        </View>
        <View className="flex-1" />
        <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(0,0,0,0.22)' }}>
          <Ionicons name="star" size={14} color="#FFFFFF" />
          <Text className="font-ui-bold text-[13px] ml-1 text-white">{stars}/9</Text>
        </View>
      </View>

      <Text className="text-[24px] leading-[30px] mt-3 text-white" style={{ fontFamily: FONT.serifSemibold }}>
        {verse.reference}
      </Text>
      <Text className="font-ui text-[14px] leading-5 mt-1 text-white/85">{done ? t('challengeDone') : t('challengeDesc')}</Text>

      <View className="flex-row items-center mt-4">
        <View className="flex-row flex-1" style={{ gap: 6 }}>
          {GAMES.map((g) => (
            <View key={g} className="flex-row items-center rounded-full pl-2 pr-1.5 py-1 bg-white/15">
              <Ionicons name={GAME_ICONS[g]} size={13} color="#FFFFFF" />
              <View className="ml-1">
                <Stars count={score?.[g] ?? 0} size={10} color="#FFFFFF" />
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row items-center rounded-full pl-4 pr-3 h-10 bg-white">
          <Text className="font-ui-bold text-[14px]" style={{ color: deep }}>
            {done ? t('challengeAgain') : t('challengePlay')}
          </Text>
          <Ionicons name="arrow-forward" size={15} color={deep} style={{ marginLeft: 4 }} />
        </View>
      </View>

      <Sparkles items={sparkles} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  clip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, overflow: 'hidden' },
  glow: { position: 'absolute', right: -95, top: -95 },
  trophy: { position: 'absolute', right: -18, top: -10, transform: [{ rotate: '-12deg' }] },
});
