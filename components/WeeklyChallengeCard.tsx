import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { GAMES, getWeeklyVerse, isMastered, totalStars } from '../lib/memory';
import { FONT } from '../lib/fonts';
import { tap } from '../lib/haptics';
import PressableScale from './PressableScale';
import Stars, { GAME_ICONS } from './Stars';

/**
 * Provocarea săptămânii pe Acasă: versetul de memorat, cele trei jocuri cu stelele lor și „Joacă”.
 * Auriu (ca flacăra seriei), ca să se vadă că e un joc, pe oricare culoare a aplicației.
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
  const ink = colors.onGold;

  return (
    <PressableScale
      onPress={() => {
        tap();
        router.push('/memorare');
      }}
      accessibilityRole="button"
      accessibilityLabel={`${t('challengeTitle')}: ${verse.reference}`}
      wrapperStyle={{ marginHorizontal: 16, marginTop: 16 }}
      style={styles.card}
    >
      <LinearGradient colors={[colors.goldFrom, colors.goldTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Trofeul mare, abia vizibil, în colț. */}
      <View pointerEvents="none" style={styles.trophy}>
        <Ionicons name="trophy" size={150} color={ink} style={{ opacity: 0.08 }} />
      </View>

      <View className="flex-row items-center">
        <View className="flex-row items-center rounded-full px-2.5 py-1" style={{ backgroundColor: `${ink}14` }}>
          <Ionicons name="game-controller" size={14} color={ink} />
          <Text className="font-ui-bold text-[11px] uppercase tracking-widest ml-1.5" style={{ color: ink }}>
            {t('challengeTitle')}
          </Text>
        </View>
        <View className="flex-1" />
        <View className="flex-row items-center">
          <Ionicons name="star" size={15} color={ink} />
          <Text className="font-ui-bold text-[14px] ml-1" style={{ color: ink }}>
            {stars}/9
          </Text>
        </View>
      </View>

      <Text className="text-[24px] leading-[30px] mt-3" style={{ color: ink, fontFamily: FONT.serifSemibold }}>
        {verse.reference}
      </Text>
      <Text className="font-ui text-[14px] leading-5 mt-1" style={{ color: ink, opacity: 0.8 }}>
        {done ? t('challengeDone') : t('challengeDesc')}
      </Text>

      <View className="flex-row items-center mt-4">
        <View className="flex-row flex-1" style={{ gap: 6 }}>
          {GAMES.map((g) => (
            <View key={g} className="flex-row items-center rounded-full pl-2 pr-1.5 py-1" style={{ backgroundColor: `${ink}12` }}>
              <Ionicons name={GAME_ICONS[g]} size={13} color={ink} />
              <View className="ml-1">
                <Stars count={score?.[g] ?? 0} size={10} color={ink} />
              </View>
            </View>
          ))}
        </View>
        <View className="flex-row items-center rounded-full pl-4 pr-3 h-10" style={{ backgroundColor: ink }}>
          <Text className="font-ui-bold text-[14px]" style={{ color: colors.goldFrom }}>
            {done ? t('challengeAgain') : t('challengePlay')}
          </Text>
          <Ionicons name="arrow-forward" size={15} color={colors.goldFrom} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', padding: 18 },
  trophy: { position: 'absolute', right: -18, top: -10, transform: [{ rotate: '-12deg' }] },
});
