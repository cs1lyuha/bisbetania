import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Platform, TouchableOpacity, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { MemberStats, Profile, fullName, supabase } from '../lib/supabase';
import { formatRef, useBible } from '../lib/bible';
import { countLabel, formatDate, pluralWord } from '../lib/format';
import { recordNote, streakToRecord } from '../lib/achievements';
import { FONT } from '../lib/fonts';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import FriendButton from '../components/FriendButton';
import AchievementsGrid from '../components/AchievementsGrid';
import Icon, { IconName } from '../components/Icon';
import ProgressBar from '../components/ProgressBar';
import HeaderBackground from '../components/HeaderBackground';
import GlassButton from '../components/GlassButton';
import { GlassView } from 'expo-glass-effect';
import { LIQUID_GLASS } from '../lib/glass';
import SectionLabel from '../components/SectionLabel';
import CollapsedBar, { useCollapsedBarHeight } from '../components/CollapsedBar';
import { useCommunity } from '../lib/community';

const AVATAR = 120;
const AVATAR_RING = 6;

export default function ProfileScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { ready, session, profile: me } = useAuth();
  const { friendships } = useCommunity();
  const id = params.id || session?.user.id;
  const isMe = !!id && id === session?.user.id;

  const [other, setOther] = useState<Profile | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [missing, setMissing] = useState<'notFound' | 'error' | null>(null);
  const profile = isMe ? me : other;
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const barHeight = useCollapsedBarHeight();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const load = useCallback(async () => {
    if (!id || !session) return;
    const [p, s] = await Promise.all([
      isMe ? Promise.resolve(null) : supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('member_stats').select('*').eq('user_id', id).maybeSingle(),
    ]);
    if (p) setMissing(p.error ? 'error' : p.data ? null : 'notFound');
    if (p?.data) setOther(p.data as Profile);
    if (s.data) setStats(s.data as MemberStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isMe, session, friendships]);

  useEffect(() => {
    load();
  }, [load]);

  if (ready && !session) return <Redirect href="/cont" />;

  if (!profile) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title={t('profileTitle')} />
        {missing ? (
          <View className="m-4 bg-card rounded-3xl border border-line p-6 items-center">
            <Ionicons name={missing === 'error' ? 'cloud-offline-outline' : 'person-remove-outline'} size={32} color={colors.muted} />
            <Text className="text-muted font-ui text-center mt-2 leading-5">{missing === 'error' ? t('auth_error_network') : t('profileNotFound')}</Text>
            <TouchableOpacity onPress={load} className="mt-4 bg-primary-light rounded-full px-4 py-2">
              <Text className="text-primary font-ui-bold text-sm">{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            // Pe iOS spinner-ul nativ ar sta sub insula din vârf; îl ascundem și arătăm unul propriu, sub bara de stare.
            tintColor="transparent"
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
            progressViewOffset={insets.top + 8}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <ProfileHeader title={t('profileTitle')} backLabel={t('back')} scrollY={scrollY} onBack={goBack} />

        <View className="items-center px-4" style={{ marginTop: -(AVATAR / 2 + AVATAR_RING) }}>
          <View style={{ borderRadius: AVATAR / 2 + AVATAR_RING, borderWidth: AVATAR_RING, borderColor: colors.bg }}>
            <Avatar url={profile.avatar_url} name={fullName(profile)} size={AVATAR} tone="soft" />
          </View>
          <Text className="text-ink font-display-semibold text-[30px] leading-[38px] mt-2 text-center">{fullName(profile)}</Text>
          <View className="flex-row flex-wrap justify-center items-center mt-1 px-4">
            <Text className="text-primary font-ui-semibold text-[15px]">@{profile.nickname}</Text>
            <Text className="text-muted font-ui text-[15px] mx-2">·</Text>
            <Text className="text-muted font-ui text-[15px]">
              {countLabel(language, stats?.friends ?? 0, ['prieten', 'prieteni'], ['друг', 'друга', 'друзей'])}
            </Text>
          </View>
          {!!profile.bio && <Text className="text-ink font-ui text-[15px] leading-[22px] text-center mt-3 px-8">{profile.bio}</Text>}

          <View className="mt-5">
            {isMe ? (
              <TouchableOpacity
                onPress={() => {
                  tap();
                  router.push('/editeaza-profil');
                }}
                activeOpacity={0.8}
                className="h-[42px] px-5 rounded-full bg-card border border-line flex-row items-center"
              >
                <Icon name="pencil" size={15} color={colors.primary} />
                <Text className="text-ink font-ui-semibold text-[14px] ml-2">{t('editProfile')}</Text>
              </TouchableOpacity>
            ) : (
              <FriendButton userId={profile.id} />
            )}
          </View>
        </View>

        <View className="px-4 mt-6">
          <StatsCard stats={stats} />
          <FavoriteVerseCard profile={profile} isMe={isMe} />
          <AchievementsGrid stats={stats} showClosest={isMe} />
          <Text className="text-muted font-ui text-[14px] text-center mt-6">
            {t('memberSince')} {formatDate(language, new Date(profile.created_at))}
          </Text>
        </View>
      </Animated.ScrollView>
      {Platform.OS === 'ios' && <PullSpinner scrollY={scrollY} refreshing={refreshing} />}
      <CollapsedBar scrollY={scrollY} showAt={188 - (barHeight - insets.top) - 24} title={fullName(profile)} onBack={goBack} />
    </View>
  );
}

/** Spinner-ul de reîmprospătare pe iOS: apare sub bara de stare cât tragi în jos și stă acolo până se încarcă. */
function PullSpinner({ scrollY, refreshing }: { scrollY: Animated.Value; refreshing: boolean }) {
  const insets = useSafeAreaInsets();
  const pulled = scrollY.interpolate({ inputRange: [-90, -30], outputRange: [1, 0], extrapolate: 'clamp' });
  const scale = pulled.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 6,
        alignSelf: 'center',
        opacity: refreshing ? 1 : pulled,
        transform: [{ scale: refreshing ? 1 : scale }],
      }}
    >
      {LIQUID_GLASS ? (
        <GlassView glassEffectStyle="regular" colorScheme="dark" style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="white" />
        </GlassView>
      ) : (
        <View className="w-9 h-9 rounded-full bg-white/20 border border-white/25 items-center justify-center">
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * Antetul profilului: accentul închis, cu arcuri concentrice în jurul pozei (care stă pe jumătate peste el).
 * La tras în jos fundalul se întinde în sus (marginea de jos rămâne pe loc), ca să nu se vadă un gol.
 */
function ProfileHeader({ title, backLabel, scrollY, onBack }: { title: string; backLabel: string; scrollY: Animated.Value; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const height = insets.top + 188;
  const pull = scrollY.interpolate({ inputRange: [-height, 0], outputRange: [-height, 0], extrapolateRight: 'clamp' });
  const scale = pull.interpolate({ inputRange: [-height, 0], outputRange: [2, 1] });
  // Mărirea pornește din centru: mutăm cu jumătate din tras, ca marginea de sus să rămână lipită de ecran.
  const translateY = Animated.multiply(pull, 0.5);
  return (
    <View style={{ height }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          overflow: 'hidden',
          backgroundColor: colors.primaryDeep,
          transform: [{ translateY }, { scale }],
        }}
      >
        <HeaderBackground />
        <Svg width={width} height={height} style={{ position: 'absolute' }}>
          {[90, 128, 166, 204, 242, 280, 318].map((r) => (
            <Circle key={r} cx={width / 2} cy={height} r={r} stroke="white" strokeOpacity={0.1} strokeWidth={1.5} fill="none" />
          ))}
        </Svg>
      </Animated.View>
      <View className="flex-row items-center px-4" style={{ paddingTop: insets.top + 8 }}>
        <GlassButton
          onPress={() => {
            tap();
            onBack();
          }}
          accessibilityLabel={backLabel}
        >
          <Icon name="chevron-left" size={22} color="white" />
        </GlassButton>
        <Text className="flex-1 text-white font-ui-semibold text-[18px] text-center" numberOfLines={1}>
          {title}
        </Text>
        <View className="w-10" />
      </View>
    </View>
  );
}

/** Seria (mare, pe accent) lângă record și zilele active. */
function StatsCard({ stats }: { stats: MemberStats | null }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const current = stats?.current_streak ?? 0;
  const best = stats?.best_streak ?? 0;
  const active = stats?.active_days ?? 0;
  const { ratio, daysLeft } = streakToRecord(current, best);
  const days = (n: number) => pluralWord(language, n, ['zi', 'zile'], ['день', 'дня', 'дней']);

  return (
    <View className="flex-row bg-card rounded-3xl border border-line overflow-hidden">
      {/* minWidth 0: cele două jumătăți rămân egale (pe web conținutul lat ar lărgi stânga). */}
      <View className="flex-1 bg-primary p-5" style={{ minWidth: 0 }}>
        <View className="flex-row items-center">
          <Icon name="flame-filled" size={13} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-on-primary font-ui-bold text-[11px] uppercase tracking-widest ml-2">{t('streak')}</Text>
        </View>
        <View className="flex-row items-baseline mt-1.5">
          <Text className="text-on-primary font-display-semibold text-[46px] leading-[52px]">{current}</Text>
          <Text className="text-on-primary font-ui text-[14px] ml-2 flex-shrink" numberOfLines={2}>
            {pluralWord(language, current, ['zi la rând', 'zile la rând'], ['день подряд', 'дня подряд', 'дней подряд'])}
          </Text>
        </View>
        <View className="mt-2">
          <ProgressBar ratio={ratio} color={colors.onPrimary} track={`${colors.onPrimary}40`} height={5} />
        </View>
        <Text className="text-on-primary/90 font-ui text-[12px] leading-4 mt-2">{daysLeft === null ? t('streakIsRecord') : recordNote(language, daysLeft)}</Text>
      </View>
      <View className="flex-1" style={{ minWidth: 0 }}>
        <StatCell icon="trophy" label={t('bestStreak')} value={best} unit={days(best)} />
        <View className="h-px bg-line" />
        <StatCell icon="calendar" label={t('activeDays')} value={active} unit={t('inTotal')} />
      </View>
    </View>
  );
}

function StatCell({ icon, label, value, unit }: { icon: IconName; label: string; value: number; unit: string }) {
  const { colors } = useTheme();
  return (
    <View className="flex-1 justify-center px-5 py-3">
      <View className="flex-row items-center">
        <Icon name={icon} size={15} color={colors.primary} />
        <Text className="text-muted font-ui text-[13px] ml-2 flex-shrink" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View className="flex-row items-baseline">
        <Text className="text-ink font-display-semibold text-[28px] leading-[34px]">{value}</Text>
        <Text className="text-muted font-ui text-[13px] ml-1.5 flex-shrink" numberOfLines={1}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

/** Versetul preferat ca citat, în limba în care l-a ales omul (numerotarea Psalmilor diferă între traduceri). */
function FavoriteVerseCard({ profile, isMe }: { profile: Profile; isMe: boolean }) {
  const { t } = useLanguage();
  const { colors, settings } = useTheme();
  const router = useRouter();
  const fv = profile.favorite_verse;
  const { data } = useBible(fv?.lang ?? 'ro');
  const text = fv && data ? data[fv.b - 1]?.[fv.c - 1]?.[fv.v - 1] : undefined;
  const open = () => fv && router.push({ pathname: '/citire', params: { b: fv.b, c: fv.c, v: fv.v } });

  return (
    <View className="bg-primary-light rounded-3xl px-5 pt-6 pb-5 mt-4 overflow-hidden">
      {/* Ghilimelele mari, decorative, tăiate de marginea de sus. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: -22, right: 22 }}>
        <Text style={{ fontFamily: FONT.uiBold, fontSize: 100, lineHeight: 120, color: colors.primary, opacity: 0.18 }}>”</Text>
      </View>
      <View className="flex-row items-center">
        <Icon name="star-filled" size={13} color={colors.primary} strokeWidth={1.5} />
        <SectionLabel className="ml-2">{t('favoriteVerse')}</SectionLabel>
      </View>
      {fv ? (
        <TouchableOpacity onPress={open} activeOpacity={0.8}>
          {/* Textul Bibliei urmează alegerea din Personalizare: serif (italic, ca un citat) sau fontul interfeței. */}
          <Text className="text-ink text-[18px] leading-[30px] mt-3" style={{ fontFamily: settings.serif ? FONT.serifItalic : FONT.ui }}>
            {text ?? '…'}
          </Text>
          <View className="flex-row items-center mt-4">
            <View style={{ width: 24, height: 2, borderRadius: 1, backgroundColor: colors.primary }} />
            <Text className="text-ink font-ui-semibold text-[14px] ml-2.5 flex-1" numberOfLines={1}>
              {formatRef(fv.lang, fv)}
            </Text>
            <Text className="text-muted font-ui text-[15px] mr-1">{t('readChapter')}</Text>
            <Icon name="chevron-right" size={17} color={colors.muted} />
          </View>
        </TouchableOpacity>
      ) : (
        <View className="mt-3">
          <Text className="text-muted font-ui text-[15px] leading-[22px]">{isMe ? t('chooseFavoriteVerse') : t('noFavoriteVerse')}</Text>
          {isMe && (
            <TouchableOpacity onPress={() => router.push('/biblia')} className="self-start mt-3 bg-primary rounded-full px-4 py-2">
              <Text className="text-on-primary font-ui-semibold text-sm">{t('openBible')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
