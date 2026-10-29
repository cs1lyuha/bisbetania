import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { TranslationKey } from '../i18n/translations';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { GAMES, findVerse, getWeeklyVerse, isMastered, previousVerses, totalStars } from '../lib/memory';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Stars, { GAME_ICONS } from '../components/Stars';

export default function MemoryScreen() {
  const { t, language } = useLanguage();
  const { colors, serifFont } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { memory } = useUserData();
  const [hidden, setHidden] = useState(false);

  const weekly = getWeeklyVerse(language);
  const verse = (params.id && findVerse(language, params.id)) || weekly;
  const isWeekly = verse.id === weekly.id;
  const score = memory[verse.id];
  const masteredCount = Object.values(memory).filter(isMastered).length;
  const previous = previousVerses(language, 8);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title={t('memoryTitle')}
        subtitle={t('memorySubtitle')}
        right={
          <View className="bg-white/15 rounded-full px-3 py-1.5 flex-row items-center">
            <Ionicons name="trophy-outline" size={14} color="white" />
            <Text className="text-white font-bold text-xs ml-1">{masteredCount}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Versetul */}
        <View className="bg-card rounded-3xl border border-line p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center bg-primary-light rounded-full px-3 py-1">
              <Ionicons name="bulb-outline" size={14} color={colors.primary} />
              <Text className="text-primary text-[11px] font-bold uppercase tracking-widest ml-1.5">
                {isWeekly ? t('weeklyVerse') : t('review')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={8} className="flex-row items-center">
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={16} color={colors.muted} />
              <Text className="text-muted text-xs ml-1">{hidden ? t('showText') : t('hideText')}</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-ink text-[19px] leading-[29px] mt-3" style={{ fontFamily: serifFont, opacity: hidden ? 0.06 : 1 }}>
            {verse.text}
          </Text>
          <View className="flex-row items-center justify-between mt-3">
            <Text className="text-primary font-bold text-[15px]">— {verse.reference}</Text>
            {isMastered(score) && (
              <View className="flex-row items-center bg-primary rounded-full px-2.5 py-1">
                <Ionicons name="checkmark-circle" size={13} color="white" />
                <Text className="text-white text-[11px] font-bold ml-1">{t('mastered')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Jocurile */}
        <View className="mt-4" style={{ gap: 10 }}>
          {GAMES.map((game) => {
            const stars = score?.[game] ?? 0;
            return (
              <TouchableOpacity
                key={game}
                onPress={() => {
                  tap();
                  router.push({ pathname: '/joc', params: { game, id: verse.id } });
                }}
                activeOpacity={0.8}
                className="bg-card rounded-2xl border border-line px-4 py-4 flex-row items-center"
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${stars ? 'bg-primary' : 'bg-primary-light'}`}>
                  <Ionicons name={GAME_ICONS[game]} size={22} color={stars ? 'white' : colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-ink font-bold text-base">{t(`game_${game}` as TranslationKey)}</Text>
                  <Text className="text-muted text-xs mt-0.5">{t(`game_${game}_desc` as TranslationKey)}</Text>
                </View>
                <Stars count={stars} color={colors.primary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Repetare */}
        <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mt-6 mb-2 px-1">{t('review')}</Text>
        <View className="bg-card rounded-2xl border border-line overflow-hidden">
          {(isWeekly ? previous : [weekly, ...previous.filter((p) => p.id !== verse.id)]).map((p, i) => {
            const s = memory[p.id];
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  tap();
                  router.setParams({ id: p.id });
                }}
                activeOpacity={0.75}
                className={`flex-row items-center px-4 py-3 ${i ? 'border-t border-line' : ''}`}
              >
                <Ionicons
                  name={isMastered(s) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isMastered(s) ? colors.primary : colors.line}
                />
                <View className="flex-1 ml-3">
                  <Text className="text-ink font-semibold text-sm">{p.reference}</Text>
                  <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                    {p.text}
                  </Text>
                </View>
                {totalStars(s) > 0 && <Text className="text-primary text-xs font-bold ml-2">★ {totalStars(s)}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text className="text-muted text-xs text-center mt-4">
          {masteredCount} {t('versesMastered')}
        </Text>
      </ScrollView>
    </View>
  );
}
