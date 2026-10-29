import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { formatRef } from '../lib/bible';
import { Lesson } from '../lib/grupmic';
import { countLabel, formatDayTitle, timeUntil } from '../lib/format';
import { success, tap } from '../lib/haptics';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { fullName, supabase } from '../lib/supabase';
import Avatar from './Avatar';

/** Cardul „Pregătire pentru Grup mic”: lecția, capitolul de citit și bifa „Am citit”. */
export default function LessonCard({ lesson, now = new Date(), showHeader = true }: { lesson: Lesson; now?: Date; showHeader?: boolean }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { lessonsRead, toggleLessonRead } = useUserData();
  const read = lessonsRead.includes(lesson.id);
  const passage = language === 'ro' ? lesson.passage : formatRef(language, { b: lesson.b, c: lesson.c, v: lesson.vFrom, ve: lesson.vTo });
  const live = lesson.start <= now && lesson.end > now;

  return (
    <View className="bg-card rounded-3xl border border-line p-5">
      {showHeader && (
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={15} color={colors.primary} />
          <Text className="flex-1 text-primary text-[11px] font-bold uppercase tracking-widest ml-1.5">{t('grupMicPrepare')}</Text>
          <Text className="text-muted text-xs">{live ? t('happeningNow') : timeUntil(language, lesson.start, now)}</Text>
        </View>
      )}
      <Text className={`text-muted text-xs ${showHeader ? 'mt-2' : ''}`}>
        {formatDayTitle(language, lesson.start)} · {t('lesson')} {lesson.number}
      </Text>
      <Text className="text-ink text-[19px] font-bold mt-1">{passage}</Text>
      <Text className="text-ink text-[15px] font-semibold mt-0.5 leading-5">{lesson.title}</Text>
      {!!lesson.summary && <Text className="text-muted text-sm mt-1.5 leading-5">{lesson.summary}</Text>}

      <View className="flex-row mt-4" style={{ gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            tap();
            router.push({ pathname: '/citire', params: { b: lesson.b, c: lesson.c, ...(lesson.vFrom ? { v: lesson.vFrom } : {}) } });
          }}
          activeOpacity={0.85}
          className="flex-1 bg-primary rounded-xl py-3 flex-row items-center justify-center"
        >
          <Ionicons name="book-outline" size={17} color="white" />
          <Text className="text-white font-bold ml-1.5">{t('read')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (!read) success();
            toggleLessonRead(lesson.id);
          }}
          activeOpacity={0.85}
          className={`flex-1 rounded-xl py-3 items-center flex-row justify-center border-2 ${read ? 'border-primary bg-primary-light' : 'border-line'}`}
        >
          <Ionicons name={read ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={colors.primary} />
          <Text className="text-primary font-bold ml-1.5">{read ? t('done') : t('markDone')}</Text>
        </TouchableOpacity>
      </View>
      <Readers lessonId={lesson.id} read={read} />
    </View>
  );
}

/** Cine din comunitate a citit deja lecția: întâi prietenii, apoi ceilalți. */
function Readers({ lessonId, read }: { lessonId: string; read: boolean }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const { session } = useAuth();
  const { byId, friendIds } = useCommunity();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (!session) return;
    const load = () =>
      supabase
        .from('lesson_reads')
        .select('user_id')
        .eq('lesson_id', lessonId)
        .then(({ data }) => data && setIds(data.map((r) => r.user_id as string)));
    load();
    // Bifa mea ajunge pe server după sincronizare (~1,5 s).
    const timer = setTimeout(load, 2500);
    return () => clearTimeout(timer);
  }, [session, lessonId, read]);

  const people = ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .sort((a, b) => Number(friendIds.has(b.id)) - Number(friendIds.has(a.id)));
  if (!people.length) return null;

  return (
    <View className="flex-row items-center mt-3 pt-3 border-t border-line">
      <View className="flex-row">
        {people.slice(0, 6).map((p, i) => (
          <View key={p.id} style={{ marginLeft: i ? -8 : 0, borderRadius: 14, borderWidth: 2, borderColor: colors.card }}>
            <Avatar url={p.avatar_url} name={fullName(p)} size={24} />
          </View>
        ))}
      </View>
      <Text className="text-muted text-xs ml-2">
        {countLabel(language, people.length, ['a citit', 'au citit'], ['прочитал(а)', 'прочитали', 'прочитали'])}
      </Text>
    </View>
  );
}
