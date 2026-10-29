import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { ACHIEVEMENTS, progressOf } from '../lib/achievements';
import type { MemberStats } from '../lib/supabase';

/** Toate realizările: cele obținute colorate, celelalte estompate, cu progresul până la ele. */
export default function AchievementsGrid({ stats }: { stats?: MemberStats | null }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const items = ACHIEVEMENTS.map((a) => ({ a, p: progressOf(a, stats) }));
  const earned = items.filter((x) => x.p.earned).length;

  return (
    <View className="bg-card rounded-3xl border border-line p-5 mt-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <Ionicons name="ribbon-outline" size={15} color={colors.primary} />
          <Text className="text-primary text-[11px] font-bold uppercase tracking-widest ml-1.5">{t('achievements')}</Text>
        </View>
        <Text className="text-muted text-xs font-bold">
          {earned}/{ACHIEVEMENTS.length}
        </Text>
      </View>
      <View className="flex-row flex-wrap" style={{ rowGap: 16 }}>
        {items.map(({ a, p }) => (
          <View key={a.id} className="items-center px-1" style={{ width: '33.33%', opacity: p.earned ? 1 : 0.55 }}>
            <View className={`w-14 h-14 rounded-2xl items-center justify-center ${p.earned ? 'bg-primary' : 'bg-primary-light'}`}>
              <Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={26} color={p.earned ? 'white' : colors.muted} />
            </View>
            <Text className="text-ink text-xs font-bold mt-1.5 text-center" numberOfLines={1}>
              {a.title[language]}
            </Text>
            {p.earned ? (
              <Text className="text-muted text-[10px] text-center leading-3 mt-0.5" numberOfLines={2}>
                {a.desc[language]}
              </Text>
            ) : (
              <View className="w-12 mt-1.5">
                <View className="h-1 bg-line rounded-full overflow-hidden">
                  <View className="h-full bg-primary rounded-full" style={{ width: `${p.ratio * 100}%` }} />
                </View>
                <Text className="text-muted text-[10px] text-center mt-0.5">
                  {p.value}/{a.goal}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
