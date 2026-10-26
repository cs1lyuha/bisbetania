import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useChurch, nextService } from '../lib/church';
import { DAY_NAMES, formatDate, timeUntil } from '../lib/format';
import ScreenHeader from '../components/ScreenHeader';

// Săptămâna începe luni.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function ScheduleScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { services, announcements } = useChurch();
  const now = new Date();
  const upcoming = nextService(services, now);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('scheduleTitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {WEEK_ORDER.filter((day) => services.some((s) => s.day === day)).map((day) => (
          <View key={day} className="mb-4">
            <Text className={`text-[11px] font-bold uppercase tracking-widest mb-2 px-1 ${day === now.getDay() ? 'text-primary' : 'text-muted'}`}>
              {DAY_NAMES[language][day]}
              {day === now.getDay() ? ` · ${t('today')}` : ''}
            </Text>
            <View className="bg-card rounded-2xl border border-line overflow-hidden">
              {services
                .filter((s) => s.day === day)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((s, i) => {
                  const isNext = upcoming?.service === s;
                  return (
                    <View key={`${s.time}-${i}`} className={`flex-row items-center px-4 py-4 ${i > 0 ? 'border-t border-line' : ''} ${isNext ? 'bg-primary-light' : ''}`}>
                      <View className="w-16">
                        <Text className="text-primary font-bold text-lg">{s.time}</Text>
                      </View>
                      <Text className="flex-1 text-ink font-semibold text-[15px]">{s.title[language]}</Text>
                      {isNext && (
                        <View className="bg-primary rounded-full px-2.5 py-1">
                          <Text className="text-white text-[10px] font-bold">
                            {upcoming!.live ? t('happeningNow') : timeUntil(language, upcoming!.start, now)}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        ))}

        {announcements.length > 0 && (
          <>
            <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mt-2 mb-2 px-1">{t('announcements')}</Text>
            {announcements.map((a) => (
              <View key={a.id} className="bg-card rounded-2xl border border-line p-4 mb-3">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="megaphone-outline" size={15} color={colors.primary} />
                  <Text className="text-muted text-xs ml-1.5">{formatDate(language, new Date(a.date))}</Text>
                </View>
                <Text className="text-ink font-bold text-[15px]">{a.title[language]}</Text>
                <Text className="text-muted text-sm mt-1 leading-5">{a.text[language]}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
