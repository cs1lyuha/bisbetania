import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Share, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { useUserData, planDayIndex } from '../../lib/user-data';
import { useChurch } from '../../lib/church';
import { formatTime, nextOccurrence } from '../../lib/calendar';
import { getDailyVerse } from '../../lib/daily';
import { formatRef, verseKey } from '../../lib/bible';
import { PLANS, planDays, formatReading } from '../../lib/plans';
import { DAY_NAMES, timeUntil } from '../../lib/format';
import { success, tap } from '../../lib/haptics';
import { YOUTUBE_LIVE } from '../../config/links';
import LanguageToggle from '../../components/LanguageToggle';
import StatusBarScrim from '../../components/StatusBarScrim';
import Hero from '../../components/Hero';
import LessonCard from '../../components/LessonCard';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../lib/auth';
import { useCommunity } from '../../lib/community';
import { fullName } from '../../lib/supabase';
import { currentLesson, lessonsFrom } from '../../lib/grupmic';

type IconName = keyof typeof Ionicons.glyphMap;

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function HomeScreen() {
  const { t, language } = useLanguage();
  const { colors, serifFont } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useNow();
  const church = useChurch();
  const auth = useAuth();
  const { stats: memberStats } = useCommunity();
  const myStreak = auth.session ? memberStats.get(auth.session.user.id)?.current_streak ?? 0 : 0;
  const { highlightOf, setHighlight, activePlan, plans, toggleDay, lastRead } = useUserData();
  const [copied, setCopied] = useState(false);

  const verse = getDailyVerse(language, now);
  const verseFavKey = verseKey(language, verse.ref.b, verse.ref.c, verse.ref.v);
  const isFavorite = !!highlightOf(verseFavKey);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [verse.text, fade]);

  const hour = now.getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 18 ? t('goodAfternoon') : t('goodEvening');

  const upcoming = nextOccurrence(church.services, church.events, language, now);
  const lessons = useMemo(() => lessonsFrom(church.events), [church.events]);
  const lesson = currentLesson(lessons, now);
  // Cardul apare cu o săptămână înainte de întâlnire.
  const showLesson = lesson && lesson.start.getTime() - now.getTime() < 7 * 86_400_000;

  const plan = activePlan ? PLANS.find((p) => p.id === activePlan) : undefined;
  const progress = activePlan ? plans[activePlan] : undefined;
  const todayIndex = plan && progress ? planDayIndex(progress, plan.days, now) : 0;
  const todayReading = plan ? planDays(plan.id)[todayIndex] : undefined;
  const todayDone = !!progress?.done.includes(todayIndex);

  const shareVerse = () => {
    tap();
    Share.share({ message: `„${verse.text}”\n— ${verse.reference}\n\n${t('churchName')}` });
  };

  const copyVerse = async () => {
    await Clipboard.setStringAsync(`„${verse.text}” — ${verse.reference}`);
    success();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = () => {
    tap();
    setHighlight(
      [{ key: verseFavKey, lang: language, ...verse.ref, text: verse.text }],
      isFavorite ? null : 'yellow',
    );
  };

  const openChapter = () =>
    router.push({ pathname: '/citire', params: { b: verse.ref.b, c: verse.ref.c, v: verse.ref.v } });

  const quick: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'book-outline', label: t('tabBible'), onPress: () => router.push('/biblia') },
    { icon: 'heart-outline', label: t('tabDonate'), onPress: () => router.push('/doneaza') },
    { icon: 'flame-outline', label: t('prayersShort'), onPress: () => router.push('/rugaciuni') },
    {
      icon: 'play-circle-outline',
      label: t('live'),
      onPress: () => WebBrowser.openBrowserAsync(YOUTUBE_LIVE, { toolbarColor: colors.primaryDeep }),
    },
    { icon: 'calendar-outline', label: t('calendarTitle'), onPress: () => router.push('/calendar') },
    { icon: 'bulb-outline', label: t('memoryTitle'), onPress: () => router.push('/memorare') },
  ];

  return (
    <View className="flex-1 bg-cream">
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Hero scrollY={scrollY} fadeHeight={140}>
          <View style={{ paddingTop: insets.top + 12, paddingBottom: 92 }} className="px-5">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.push('/setari')}
                hitSlop={10}
                className="w-10 h-10 rounded-full bg-white/15 items-center justify-center"
                activeOpacity={0.7}
              >
                <Ionicons name="color-palette-outline" size={20} color="white" />
              </TouchableOpacity>
              {auth.enabled && (
                <TouchableOpacity
                  onPress={() => router.push(auth.session ? '/profil' : '/cont')}
                  hitSlop={10}
                  activeOpacity={0.7}
                  className="ml-2 w-10 h-10 rounded-full bg-white/15 items-center justify-center overflow-hidden"
                >
                  {auth.profile ? (
                    <Avatar url={auth.profile.avatar_url} name={fullName(auth.profile)} size={40} />
                  ) : (
                    <Ionicons name="person-outline" size={19} color="white" />
                  )}
                </TouchableOpacity>
              )}
              {myStreak > 0 && (
                <TouchableOpacity
                  onPress={() => router.push('/membri')}
                  activeOpacity={0.8}
                  className="ml-2 h-10 px-3 rounded-full bg-white/15 flex-row items-center"
                >
                  <Ionicons name="flame" size={17} color="#FFB347" />
                  <Text className="text-white font-bold ml-1">{myStreak}</Text>
                </TouchableOpacity>
              )}
              <View className="flex-1" />
              <LanguageToggle />
            </View>
  
            <Text className="text-white/80 text-sm mt-6">{greeting} 👋</Text>
            <Text
              className="text-white text-[28px] font-bold mt-1"
              style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
            >
              {t('churchName')}
            </Text>
            <Text className="text-white/80 text-sm mt-1">{t('homeTagline')}</Text>
          </View>
        </Hero>
  
        {/* Versetul zilei */}
        <View className="px-4" style={{ marginTop: -64 }}>
          <Animated.View
            style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }], elevation: 6 }}
            className="bg-card rounded-3xl p-5 border border-line"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center bg-primary-light rounded-full px-3 py-1">
                <Ionicons name="sunny-outline" size={14} color={colors.primary} />
                <Text className="text-primary text-[11px] font-bold uppercase tracking-widest ml-1.5">{t('verseOfDay')}</Text>
              </View>
              <Text className="text-muted text-xs">
                {now.toLocaleDateString(language === 'ro' ? 'ro-RO' : 'ru-RU', { day: 'numeric', month: 'long' })}
              </Text>
            </View>
  
            <Text className="text-primary text-5xl leading-[48px] mt-2 -mb-4" style={{ fontFamily: serifFont }}>
              “
            </Text>
            <Text className="text-ink text-[19px] leading-[29px]" style={{ fontFamily: serifFont }}>
              {verse.text}
            </Text>
            <Text className="text-primary font-bold text-[15px] mt-3">— {verse.reference}</Text>
  
            <View className="flex-row items-center mt-4 pt-4 border-t border-line">
              <ActionButton icon={isFavorite ? 'heart' : 'heart-outline'} onPress={toggleFavorite} color={colors.primary} />
              <ActionButton icon={copied ? 'checkmark' : 'copy-outline'} onPress={copyVerse} color={colors.primary} />
              <ActionButton icon="share-social-outline" onPress={shareVerse} color={colors.primary} />
              <TouchableOpacity onPress={openChapter} activeOpacity={0.8} className="ml-auto flex-row items-center bg-primary rounded-full px-4 py-2">
                <Text className="text-white font-semibold text-sm mr-1">{t('readChapter')}</Text>
                <Ionicons name="arrow-forward" size={15} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
  
        {/* Acțiuni rapide */}
        <View className="px-4 mt-4 flex-row flex-wrap" style={{ gap: 10 }}>
          {quick.map((q) => (
            <TouchableOpacity
              key={q.label}
              onPress={() => {
                tap();
                q.onPress();
              }}
              activeOpacity={0.8}
              style={{ width: '31.3%' }}
              className="bg-card rounded-2xl border border-line items-center py-4"
            >
              <View className="w-11 h-11 rounded-full bg-primary-light items-center justify-center">
                <Ionicons name={q.icon} size={22} color={colors.primary} />
              </View>
              <Text className="text-ink text-[13px] font-semibold mt-2" numberOfLines={1}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
  
        {/* Următoarea întâlnire */}
        {upcoming && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/calendar', params: { date: upcoming.occurrence.start.toISOString() } })}
            activeOpacity={0.85}
            className="mx-4 mt-4 rounded-3xl p-5 overflow-hidden"
            style={{ backgroundColor: colors.primaryDeep }}
          >
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.75)" />
              <Text className="flex-1 text-white/75 text-[11px] font-bold uppercase tracking-widest ml-1.5">{t('nextService')}</Text>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.75)" />
            </View>
            <Text className="text-white text-xl font-bold mt-2">{upcoming.occurrence.title}</Text>
            {!!upcoming.occurrence.subtitle && (
              <Text className="text-white/85 text-sm mt-1 leading-5" numberOfLines={2}>
                {upcoming.occurrence.subtitle}
              </Text>
            )}
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-white/80 text-sm">
                {DAY_NAMES[language][upcoming.occurrence.start.getDay()]}, {formatTime(upcoming.occurrence.start)}
              </Text>
              <View className="bg-white/20 rounded-full px-3 py-1 flex-row items-center">
                {upcoming.live && <View className="w-2 h-2 rounded-full bg-red-400 mr-1.5" />}
                <Text className="text-white text-xs font-bold">
                  {upcoming.live ? t('happeningNow') : timeUntil(language, upcoming.occurrence.start, now)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Grup mic */}
        {showLesson && (
          <View className="mx-4 mt-4">
            <LessonCard lesson={lesson} now={now} />
            <TouchableOpacity onPress={() => router.push('/grup-mic')} hitSlop={6} className="self-center mt-2">
              <Text className="text-primary text-xs font-bold">{t('seasonLessons')} →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Planul de citire */}
        <View className="mx-4 mt-4 bg-card rounded-3xl p-5 border border-line">
          {plan && todayReading ? (
            <>
              <View className="flex-row items-center justify-between">
                <Text className="text-muted text-[11px] font-bold uppercase tracking-widest">
                  {t('todayReading')} · {t('day')} {todayIndex + 1}/{plan.days}
                </Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/plan', params: { id: plan.id } })} hitSlop={8}>
                  <Text className="text-primary text-xs font-bold">{t('seeAll')}</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-ink text-[17px] font-bold mt-2">{formatReading(todayReading, language)}</Text>
              <View className="h-1.5 bg-primary-light rounded-full mt-3 overflow-hidden">
                <View className="h-full bg-primary rounded-full" style={{ width: `${((progress?.done.length ?? 0) / plan.days) * 100}%` }} />
              </View>
              <View className="flex-row mt-4" style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({ pathname: '/citire', params: { b: todayReading[0].b, c: todayReading[0].c } })
                  }
                  activeOpacity={0.85}
                  className="flex-1 bg-primary rounded-xl py-3 items-center"
                >
                  <Text className="text-white font-bold">{t('read')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    success();
                    toggleDay(plan.id, todayIndex);
                  }}
                  activeOpacity={0.85}
                  className={`flex-1 rounded-xl py-3 items-center flex-row justify-center border-2 ${todayDone ? 'border-primary bg-primary-light' : 'border-line'}`}
                >
                  <Ionicons name={todayDone ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={colors.primary} />
                  <Text className="text-primary font-bold ml-1.5">{todayDone ? t('done') : t('markDone')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity onPress={() => router.push('/planuri')} activeOpacity={0.8} className="flex-row items-center">
              <View className="w-12 h-12 rounded-2xl bg-primary-light items-center justify-center mr-4">
                <Ionicons name="trail-sign-outline" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-ink font-bold text-base">{t('startPlanTitle')}</Text>
                <Text className="text-muted text-sm mt-0.5">{t('startPlanText')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>
  
        {/* Continuă lectura */}
        {lastRead && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/citire', params: { b: lastRead.b, c: lastRead.c } })}
            activeOpacity={0.8}
            className="mx-4 mt-4 bg-card rounded-2xl border border-line px-5 py-4 flex-row items-center"
          >
            <Ionicons name="bookmark" size={20} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text className="text-muted text-xs">{t('continueReading')}</Text>
              <Text className="text-ink font-semibold text-base">
                {formatRef(language, lastRead)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        )}
  
        {/* Anunțuri */}
        {church.announcements.length > 0 && (
          <View className="mx-4 mt-6">
            <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-3">{t('announcements')}</Text>
            {church.announcements.slice(0, 3).map((a) => (
              <View key={a.id} className="bg-card rounded-2xl border border-line p-4 mb-3">
                <Text className="text-ink font-bold text-[15px]">{a.title[language]}</Text>
                <Text className="text-muted text-sm mt-1 leading-5">{a.text[language]}</Text>
              </View>
            ))}
          </View>
        )}
  
        <Text className="text-center text-muted text-xs mt-4 px-8 leading-5">{t('subtitle')}</Text>
      </Animated.ScrollView>
      <StatusBarScrim />
    </View>
  );
}

function ActionButton({ icon, onPress, color }: { icon: IconName; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={6} activeOpacity={0.7} className="w-10 h-10 rounded-full bg-primary-light items-center justify-center mr-2">
      <Ionicons name={icon} size={19} color={color} />
    </TouchableOpacity>
  );
}
