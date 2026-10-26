import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData, planDayIndex } from '../lib/user-data';
import { PLANS, PlanId, planDays, formatReading, planTitleKey } from '../lib/plans';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: PlanId }>();
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { plans, activePlan, startPlan, stopPlan, toggleDay } = useUserData();
  const listRef = useRef<FlatList>(null);

  const plan = PLANS.find((p) => p.id === id) ?? PLANS[0];
  const days = planDays(plan.id);
  const progress = plans[plan.id];
  const active = activePlan === plan.id;
  const today = progress && active ? planDayIndex(progress, plan.days) : -1;
  const done = new Set(progress?.done ?? []);

  useEffect(() => {
    if (today > 2) setTimeout(() => listRef.current?.scrollToIndex({ index: today - 1, animated: true }), 300);
  }, [today]);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t(planTitleKey(plan.id))} subtitle={`${done.size}/${plan.days} · ${Math.round((done.size / plan.days) * 100)}%`} />

      <View className="px-4 pt-4">
        <TouchableOpacity
          onPress={() => {
            success();
            active ? stopPlan() : startPlan(plan.id);
          }}
          activeOpacity={0.85}
          className={`rounded-2xl py-3.5 items-center flex-row justify-center ${active ? 'bg-card border-2 border-line' : 'bg-primary'}`}
        >
          <Ionicons name={active ? 'pause' : 'play'} size={18} color={active ? colors.primary : 'white'} />
          <Text className={`font-bold text-base ml-2 ${active ? 'text-primary' : 'text-white'}`}>
            {active ? t('stopPlan') : progress ? t('resumePlan') : t('startPlan')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={days}
        keyExtractor={(_, i) => `${i}`}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => {
          const isDone = done.has(index);
          const isToday = index === today;
          return (
            <View style={{ height: 64, marginBottom: 8 }} className={`bg-card rounded-2xl flex-row items-center px-3 border-2 ${isToday ? 'border-primary' : 'border-line'}`}>
              <TouchableOpacity
                onPress={() => {
                  tap();
                  toggleDay(plan.id, index);
                }}
                hitSlop={8}
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDone ? 'bg-primary' : 'bg-primary-light'}`}
              >
                {isDone ? <Ionicons name="checkmark" size={20} color="white" /> : <Text className="text-primary font-bold text-xs">{index + 1}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1"
                onPress={() => router.push({ pathname: '/citire', params: { b: item[0].b, c: item[0].c } })}
                activeOpacity={0.7}
              >
                <Text className="text-muted text-[11px] font-semibold uppercase">
                  {t('day')} {index + 1}
                  {isToday ? ` · ${t('today')}` : ''}
                </Text>
                <Text className={`text-[15px] font-semibold ${isDone ? 'text-muted' : 'text-ink'}`} numberOfLines={1}>
                  {formatReading(item, language)}
                </Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
          );
        }}
      />
    </View>
  );
}
