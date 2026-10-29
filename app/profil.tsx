import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { MemberStats, Profile, fullName, supabase } from '../lib/supabase';
import { formatRef, useBible } from '../lib/bible';
import { formatDate } from '../lib/format';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';

export default function ProfileScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { ready, session, profile: me } = useAuth();
  const id = params.id || session?.user.id;
  const isMe = !!id && id === session?.user.id;

  const [other, setOther] = useState<Profile | null>(null);
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const profile = isMe ? me : other;

  const load = useCallback(async () => {
    if (!id || !session) return;
    const [p, s] = await Promise.all([
      isMe ? Promise.resolve(null) : supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('member_stats').select('*').eq('user_id', id).maybeSingle(),
    ]);
    if (p?.data) setOther(p.data as Profile);
    if (s.data) setStats(s.data as MemberStats);
  }, [id, isMe, session]);

  useEffect(() => {
    load();
  }, [load]);

  if (ready && !session) return <Redirect href="/cont" />;

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title={t('profileTitle')}
        right={
          isMe ? (
            <TouchableOpacity onPress={() => router.push('/editeaza-profil')} hitSlop={8} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <Ionicons name="create-outline" size={19} color="white" />
            </TouchableOpacity>
          ) : undefined
        }
      />
      {!profile ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
            />
          }
        >
          <View className="items-center mt-2">
            <Avatar url={profile.avatar_url} name={fullName(profile)} size={104} />
            <Text className="text-ink text-2xl font-bold mt-3 text-center">{fullName(profile)}</Text>
            <Text className="text-primary font-semibold mt-0.5">@{profile.nickname}</Text>
            {!!profile.bio && <Text className="text-ink/80 text-[15px] text-center mt-3 leading-6 px-4">{profile.bio}</Text>}
          </View>

          <View className="flex-row mt-6" style={{ gap: 10 }}>
            <Stat icon="flame" value={stats?.current_streak ?? 0} label={t('streak')} highlight />
            <Stat icon="trophy-outline" value={stats?.best_streak ?? 0} label={t('bestStreak')} />
            <Stat icon="calendar-outline" value={stats?.active_days ?? 0} label={t('activeDays')} />
          </View>

          <FavoriteVerseCard profile={profile} isMe={isMe} />

          <Text className="text-muted text-xs text-center mt-6">
            {t('memberSince')} {formatDate(language, new Date(profile.created_at))}
          </Text>

          {isMe && (
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push('/editeaza-profil');
              }}
              activeOpacity={0.85}
              className="mt-4 rounded-2xl border-2 border-primary py-3.5 flex-row items-center justify-center"
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text className="text-primary font-bold ml-2">{t('editProfile')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ icon, value, label, highlight }: { icon: 'flame' | 'trophy-outline' | 'calendar-outline'; value: number; label: string; highlight?: boolean }) {
  const { colors } = useTheme();
  return (
    <View className={`flex-1 rounded-2xl p-3 items-center ${highlight ? 'bg-primary' : 'bg-card border border-line'}`}>
      <Ionicons name={icon} size={20} color={highlight ? '#FFB347' : colors.primary} />
      <Text className={`text-2xl font-bold mt-1 ${highlight ? 'text-white' : 'text-ink'}`}>{value}</Text>
      <Text className={`text-[11px] ${highlight ? 'text-white/80' : 'text-muted'}`}>{label}</Text>
    </View>
  );
}

/** Versetul preferat, în limba în care l-a ales omul (numerotarea Psalmilor diferă între traduceri). */
function FavoriteVerseCard({ profile, isMe }: { profile: Profile; isMe: boolean }) {
  const { t } = useLanguage();
  const { colors, serifFont } = useTheme();
  const router = useRouter();
  const fv = profile.favorite_verse;
  const { data } = useBible(fv?.lang ?? 'ro');
  const text = fv && data ? data[fv.b - 1]?.[fv.c - 1]?.[fv.v - 1] : undefined;

  return (
    <View className="bg-card rounded-3xl border border-line p-5 mt-4">
      <View className="flex-row items-center">
        <Ionicons name="star" size={15} color={colors.primary} />
        <Text className="text-primary text-[11px] font-bold uppercase tracking-widest ml-1.5">{t('favoriteVerse')}</Text>
      </View>
      {fv ? (
        <TouchableOpacity onPress={() => router.push({ pathname: '/citire', params: { b: fv.b, c: fv.c, v: fv.v } })} activeOpacity={0.8}>
          <Text className="text-ink text-[18px] leading-[28px] mt-3" style={{ fontFamily: serifFont }}>
            {text ?? '…'}
          </Text>
          <Text className="text-primary font-bold mt-2">— {formatRef(fv.lang, fv)}</Text>
        </TouchableOpacity>
      ) : (
        <View className="mt-2">
          <Text className="text-muted text-sm">{isMe ? t('chooseFavoriteVerse') : t('noFavoriteVerse')}</Text>
          {isMe && (
            <TouchableOpacity onPress={() => router.push('/biblia')} className="self-start mt-3 bg-primary-light rounded-full px-4 py-2">
              <Text className="text-primary font-bold text-sm">{t('openBible')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
