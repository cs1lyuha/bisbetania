import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { ACHIEVEMENTS, Achievement, closestAchievement, progressHint, progressOf } from '../lib/achievements';
import type { MemberStats } from '../lib/supabase';
import Icon from './Icon';
import ProgressBar from './ProgressBar';
import SectionLabel from './SectionLabel';

/**
 * Toate realizările, în 4 coloane: cele obținute pline, celelalte cu un inel de progres.
 * `showClosest`: deasupra, cea mai aproape de obținut (doar pe profilul meu, textul e la persoana a doua).
 */
export default function AchievementsGrid({ stats, showClosest }: { stats?: MemberStats | null; showClosest?: boolean }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const items = ACHIEVEMENTS.map((a) => ({ a, p: progressOf(a, stats) }));
  const earned = items.filter((x) => x.p.earned).length;
  const closest = showClosest ? closestAchievement(stats) : null;
  // Pe telefoanele înguste (360dp) 4 coloane ar rupe titluri ca „Неопалимая” la mijlocul cuvântului.
  const { width } = useWindowDimensions();
  const column = width < 370 ? '33.33%' : '25%';

  return (
    <View className="bg-card rounded-3xl border border-line p-5 mt-4">
      <View className="flex-row items-center justify-between">
        <SectionLabel>{t('achievements')}</SectionLabel>
        <Text className="text-muted font-ui text-[14px]">
          {earned} {t('outOf')} {ACHIEVEMENTS.length}
        </Text>
      </View>

      {closest && (
        <View className="bg-primary-light rounded-2xl p-3.5 mt-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-card items-center justify-center">
            <Icon name={closest.achievement.icon} size={18} color={colors.primary} />
          </View>
          <View className="flex-1 ml-3.5">
            <View className="flex-row items-center">
              <Text className="flex-1 text-ink font-ui-semibold text-[14px]" numberOfLines={1}>
                {t('almost')}: {closest.achievement.title[language]}
              </Text>
              <Text className="text-muted font-ui text-[14px] ml-2">
                {closest.progress.value}/{closest.achievement.goal}
              </Text>
            </View>
            <View className="mt-2">
              <ProgressBar ratio={closest.progress.ratio} color={colors.primary} track={colors.card} height={5} />
            </View>
            <Text className="text-muted font-ui text-[13px] mt-1.5">{progressHint(closest.achievement, closest.progress.value, language)}</Text>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap mt-5 -mx-2" style={{ rowGap: 12 }}>
        {items.map(({ a, p }) => (
          <View key={a.id} className="items-center px-0.5" style={{ width: column }}>
            <Badge achievement={a} ratio={p.ratio} earned={p.earned} />
            <Text className="text-ink font-ui-semibold text-[12px] leading-[15px] text-center mt-1.5" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
              {a.title[language]}
            </Text>
            {!p.earned && (
              <Text className="text-muted font-ui text-[12px] mt-0.5">
                {p.value}/{a.goal}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const SIZE = 64;
const RING = 56;
// Inelul celor neobținute e puțin mai mic decât cercul plin al celor obținute (ca în planșe).
const TRACK = 53;
const STROKE = 3;

/** Insigna: obținută = cerc plin cu un halou; neobținută = inelul cât s-a parcurs până la ea. */
export function Badge({ achievement, ratio, earned }: { achievement: Achievement; ratio: number; earned: boolean }) {
  const { colors } = useTheme();
  if (earned) {
    return (
      <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.primaryLight }} className="items-center justify-center">
        <View style={{ width: RING, height: RING, borderRadius: RING / 2, backgroundColor: colors.primary }} className="items-center justify-center">
          <Icon name={achievement.icon} size={24} color={colors.onPrimary} />
        </View>
      </View>
    );
  }
  const r = (TRACK - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const mid = SIZE / 2;
  return (
    <View style={{ width: SIZE, height: SIZE }} className="items-center justify-center">
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={mid} cy={mid} r={r} stroke={colors.line} strokeWidth={STROKE} fill="none" />
        {ratio > 0 && (
          <Circle
            cx={mid}
            cy={mid}
            r={r}
            stroke={colors.primary}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - ratio)}
            transform={`rotate(-90 ${mid} ${mid})`}
          />
        )}
      </Svg>
      <Icon name={achievement.icon} size={24} color={colors.muted} />
    </View>
  );
}
