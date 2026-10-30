import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useChurch } from '../lib/church';
import { useUserData } from '../lib/user-data';
import { formatRef } from '../lib/bible';
import { currentLesson, lessonsFrom } from '../lib/grupmic';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import LessonCard from '../components/LessonCard';

export default function GrupMicScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { events } = useChurch();
  const { lessonsRead } = useUserData();
  const now = new Date();

  const lessons = useMemo(() => lessonsFrom(events), [events]);
  const current = currentLesson(lessons, now);
  const readCount = lessons.filter((l) => lessonsRead.includes(l.id)).length;

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('grupMicTitle')} subtitle={t('grupMicSubtitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {current ? (
          <LessonCard lesson={current} now={now} />
        ) : (
          <View className="bg-card rounded-3xl border border-line p-6 items-center">
            <Ionicons name="people-outline" size={32} color={colors.muted} />
            <Text className="text-muted text-center mt-2 leading-5">{t('noLessons')}</Text>
          </View>
        )}

        {lessons.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-2 px-1">
              <Text className="text-muted text-[11px] font-bold uppercase tracking-widest">{t('seasonLessons')}</Text>
              <Text className="text-primary text-xs font-bold">
                {readCount}/{lessons.length} {t('lessonsReadLabel')}
              </Text>
            </View>
            <View className="h-1.5 bg-primary-light rounded-full mb-3 overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${(readCount / lessons.length) * 100}%` }} />
            </View>
            <View className="bg-card rounded-2xl border border-line overflow-hidden">
              {lessons.map((l, i) => {
                const read = lessonsRead.includes(l.id);
                const isCurrent = l.id === current?.id;
                const past = l.end <= now;
                const passage = language === 'ro' ? l.passage : formatRef(language, { b: l.b, c: l.c, v: l.vFrom, ve: l.vTo });
                return (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => {
                      tap();
                      router.push({ pathname: '/citire', params: { b: l.b, c: l.c, ...(l.vFrom ? { v: l.vFrom } : {}) } });
                    }}
                    activeOpacity={0.75}
                    className={`flex-row items-center px-4 py-3 ${i ? 'border-t border-line' : ''} ${isCurrent ? 'bg-primary-light' : ''}`}
                    style={{ opacity: past && !read ? 0.6 : 1 }}
                  >
                    <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${read ? 'bg-primary' : 'border-2 border-line'}`}>
                      {read ? (
                        <Ionicons name="checkmark" size={18} color="white" />
                      ) : (
                        <Text className="text-muted font-bold text-xs">{l.number}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-ink font-semibold text-[15px]">
                        {passage}
                        <Text className="text-muted font-normal text-xs">
                          {'  '}
                          {l.start.toLocaleDateString(language === 'ro' ? 'ro-RO' : 'ru-RU', { day: 'numeric', month: 'short' })}
                        </Text>
                      </Text>
                      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                        {l.title}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
