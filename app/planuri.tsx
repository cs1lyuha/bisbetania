import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { PLANS, planDays, planDescKey, planTitleKey } from '../lib/plans';
import { countLabel } from '../lib/format';
import ScreenHeader from '../components/ScreenHeader';

export default function PlansScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { plans, activePlan } = useUserData();

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('plansTitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-muted leading-5 mb-4 px-1">{t('plansIntro')}</Text>
        {PLANS.map((plan) => {
          const progress = plans[plan.id];
          const done = progress?.done.length ?? 0;
          const active = activePlan === plan.id;
          const chapters = planDays(plan.id).reduce((n, d) => n + d.length, 0);
          return (
            <TouchableOpacity
              key={plan.id}
              onPress={() => router.push({ pathname: '/plan', params: { id: plan.id } })}
              activeOpacity={0.85}
              className={`bg-card rounded-3xl p-5 mb-3 border-2 ${active ? 'border-primary' : 'border-line'}`}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-primary-light items-center justify-center mr-4">
                  <Ionicons name={plan.icon} size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-ink font-bold text-[17px]">{t(planTitleKey(plan.id))}</Text>
                  <Text className="text-muted text-xs mt-0.5">
                    {countLabel(language, plan.days, ['zi', 'zile'], ['день', 'дня', 'дней'])} ·{' '}
                    {countLabel(language, chapters, ['capitol', 'capitole'], ['глава', 'главы', 'глав'])}
                  </Text>
                </View>
                {active && (
                  <View className="bg-primary rounded-full px-2.5 py-1">
                    <Text className="text-white text-[10px] font-bold uppercase">{t('active')}</Text>
                  </View>
                )}
              </View>
              <Text className="text-muted text-sm leading-5 mt-3">{t(planDescKey(plan.id))}</Text>
              {done > 0 && (
                <View className="mt-3">
                  <View className="h-1.5 bg-primary-light rounded-full overflow-hidden">
                    <View className="h-full bg-primary rounded-full" style={{ width: `${(done / plan.days) * 100}%` }} />
                  </View>
                  <Text className="text-primary text-xs font-bold mt-1.5">
                    {Math.round((done / plan.days) * 100)}% · {done}/{plan.days}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
