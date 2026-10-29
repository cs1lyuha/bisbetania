import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { podiumOrder, streakRanking, suggestionsFor, useCommunity } from '../lib/community';
import type { MemberStats, Profile } from '../lib/supabase';
import { fullName } from '../lib/supabase';
import { fold } from '../lib/bible';
import { countLabel, timeAgo } from '../lib/format';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import MemberRow from '../components/MemberRow';
import FriendButton from '../components/FriendButton';
import Avatar from '../components/Avatar';
import AvatarStack from '../components/AvatarStack';
import Icon from '../components/Icon';
import SectionLabel from '../components/SectionLabel';

type Tab = 'members' | 'ranking';
const STREAK = '#F59E0B';

export default function MembersScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { loaded, profiles, byId, stats, friendships, friendIds, incoming, relation, refresh } = useCommunity();
  const [tab, setTab] = useState<Tab>('members');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const me = session?.user.id;

  const others = useMemo(() => profiles.filter((p) => p.id !== me), [profiles, me]);
  const suggestions = useMemo(() => (me ? suggestionsFor(me, others, friendships, stats).slice(0, 5) : []), [me, others, friendships, stats]);
  const ranking = useMemo(() => streakRanking(profiles, stats), [profiles, stats]);
  const friends = others.filter((p) => friendIds.has(p.id));

  const q = fold(query.trim());
  const found = q
    ? others.filter((p) => fold(`${p.first_name} ${p.last_name} ${p.last_name} ${p.first_name} ${p.nickname}`).includes(q))
    : [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (!session) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title={t('membersTitle')} />
        <View className="m-4 bg-card rounded-3xl border border-line p-6 items-center">
          <Icon name="users" size={36} color={colors.primary} />
          <Text className="text-ink font-ui text-center mt-3 leading-5">{t('loginRequired')}</Text>
          <TouchableOpacity onPress={() => router.push('/cont')} className="mt-4 bg-primary rounded-xl px-5 py-3">
            <Text className="text-on-primary font-ui-semibold">{t('joinCommunity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const mutualText = (n: number) =>
    countLabel(language, n, ['prieten comun', 'prieteni comuni'], ['общий друг', 'общих друга', 'общих друзей']);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('membersTitle')} subtitle={t('membersSubtitle')}>
        <View className="flex-row bg-white/15 rounded-full p-1">
          {(['members', 'ranking'] as Tab[]).map((x) => {
            const active = tab === x;
            const color = active ? colors.primaryDeep : 'white';
            return (
              <TouchableOpacity
                key={x}
                onPress={() => {
                  tap();
                  setTab(x);
                }}
                activeOpacity={0.85}
                className={`flex-1 h-10 rounded-full items-center flex-row justify-center ${active ? 'bg-white' : ''}`}
              >
                <Icon name={x === 'members' ? 'users' : 'podium'} size={16} color={color} />
                <Text className="font-ui-semibold text-[15px] ml-2" style={{ color }} numberOfLines={1}>
                  {x === 'members' ? t('tabMembers') : t('tabRanking')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!loaded ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : tab === 'ranking' ? (
          <Ranking ranking={ranking} me={me} />
        ) : (
          <>
            <View className="flex-row items-center bg-card border border-line rounded-2xl px-4 h-12 mb-5">
              <Icon name="search" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchMembers')}
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                className="flex-1 text-ink font-ui text-[16px] h-full ml-2.5"
              />
              {!!query && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {q ? (
              found.length ? (
                <Card>
                  {found.map((p, i) => (
                    <MemberRow key={p.id} profile={p} first={i === 0} streak={stats.get(p.id)?.current_streak} right={<FriendButton userId={p.id} compact />} />
                  ))}
                </Card>
              ) : (
                <Empty icon="search" text={t('noMembersFound')} />
              )
            ) : (
              <>
                {incoming.length > 0 && (
                  <View className="mb-6">
                    <SectionLabel className="mb-2.5 px-1">
                      {t('friendRequests')} · {incoming.length}
                    </SectionLabel>
                    <View style={{ gap: 8 }}>
                      {incoming.map((f) => {
                        const p = byId.get(f.requester);
                        return p ? <RequestRow key={p.id} profile={p} at={f.created_at} /> : null;
                      })}
                    </View>
                  </View>
                )}

                {suggestions.length > 0 && (
                  <View className="mb-6">
                    <SectionLabel className="mb-2.5 px-1">{t('suggestions')}</SectionLabel>
                    {/* Cardurile se derulează orizontal până la marginea ecranului. */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: -16 }}
                      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                    >
                      {suggestions.map(({ profile, mutual, mutualIds }) => (
                        <SuggestionCard
                          key={profile.id}
                          profile={profile}
                          mutual={mutualIds.map((id) => byId.get(id)).filter((p): p is Profile => !!p)}
                          caption={mutual ? mutualText(mutual) : `@${profile.nickname}`}
                        />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {friends.length > 0 && (
                  <Section title={`${t('myFriends')} · ${friends.length}`}>
                    {friends.map((p, i) => (
                      <MemberRow key={p.id} profile={p} first={i === 0} streak={stats.get(p.id)?.current_streak} />
                    ))}
                  </Section>
                )}

                {others.length ? (
                  <Section title={`${t('allMembers')} · ${others.length}`}>
                    {others.map((p, i) => (
                      <MemberRow
                        key={p.id}
                        profile={p}
                        first={i === 0}
                        streak={stats.get(p.id)?.current_streak}
                        extra={relation(p.id) === 'sent' ? <FriendButton userId={p.id} compact /> : undefined}
                      />
                    ))}
                  </Section>
                ) : (
                  <Empty icon="users" text={t('onlyYouYet')} />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/** O cerere de prietenie primită: cine, de când, Acceptă / Refuză. */
function RequestRow({ profile, at }: { profile: Profile; at: string }) {
  const { language } = useLanguage();
  const router = useRouter();
  return (
    // Când butoanele nu încap lângă nume (în rusă sau pe ecrane înguste), trec pe rândul următor, la dreapta.
    <View className="bg-primary-light rounded-3xl flex-row flex-wrap items-center pl-3.5 pr-1.5 py-3" style={{ rowGap: 8 }}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/profil', params: { id: profile.id } })}
        activeOpacity={0.75}
        className="flex-row items-center mr-2"
        style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150 }}
      >
        <Avatar url={profile.avatar_url} name={fullName(profile)} size={44} />
        <View className="flex-1 ml-3">
          <Text className="text-ink font-ui-semibold text-[15px]" numberOfLines={1}>
            {fullName(profile)}
          </Text>
          <Text className="text-muted font-ui text-[12.5px] mt-0.5" numberOfLines={1}>
            {timeAgo(language, new Date(at))}
          </Text>
        </View>
      </TouchableOpacity>
      <View className="ml-auto">
        <FriendButton userId={profile.id} compact />
      </View>
    </View>
  );
}

/** Sugestie de prieten: card îngust, cu pozele prietenilor comuni. */
function SuggestionCard({ profile, mutual, caption }: { profile: Profile; mutual: Profile[]; caption: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View className="bg-card rounded-3xl border border-line px-2.5 pt-5 pb-4 items-center" style={{ width: 150 }}>
      <TouchableOpacity onPress={() => router.push({ pathname: '/profil', params: { id: profile.id } })} activeOpacity={0.75} className="items-center self-stretch">
        <Avatar url={profile.avatar_url} name={fullName(profile)} size={56} />
        <Text className="text-ink font-ui-semibold text-[15px] leading-[19px] text-center mt-3" numberOfLines={2}>
          {fullName(profile)}
        </Text>
        <View className="flex-row items-center justify-center mt-2 self-stretch">
          {mutual.length > 0 && (
            <View className="mr-1.5">
              <AvatarStack people={mutual} size={18} max={2} ring={colors.card} />
            </View>
          )}
          <Text className="text-muted font-ui text-[12px] leading-4 text-center flex-shrink" numberOfLines={2}>
            {caption}
          </Text>
        </View>
      </TouchableOpacity>
      <View className="self-stretch mt-3">
        <FriendButton userId={profile.id} compact stretch />
      </View>
    </View>
  );
}

/** Clasamentul seriilor: podium pentru primii trei, apoi lista. */
function Ranking({ ranking, me }: { ranking: { profile: Profile; stats?: MemberStats }[]; me?: string }) {
  const { t, language } = useLanguage();
  if (!ranking.length) return <Empty icon="podium" text={t('rankingEmpty')} />;
  const rest = ranking.slice(3);
  return (
    <>
      <View className="flex-row items-center px-1 mb-4">
        <Icon name="flame-filled" size={13} color={STREAK} strokeWidth={1.5} />
        <Text className="text-muted font-ui text-[13px] leading-[18px] ml-2 flex-1">{t('rankingHint')}</Text>
      </View>

      <View className="bg-card rounded-3xl border border-line overflow-hidden flex-row items-end px-3.5 pt-4" style={{ gap: 8 }}>
        {podiumOrder(ranking.slice(0, 3)).map(({ item, place }) => (
          <PodiumColumn key={item.profile.id} profile={item.profile} streak={item.stats?.current_streak ?? 0} place={place} isMe={item.profile.id === me} />
        ))}
      </View>

      {rest.length > 0 && (
        <View className="bg-card rounded-3xl border border-line overflow-hidden mt-4">
          {rest.map(({ profile, stats: s }, i) => {
            const mine = profile.id === me;
            const streak = s?.current_streak ?? 0;
            return (
              <MemberRow
                key={profile.id}
                profile={profile}
                first={i === 0}
                avatarSize={40}
                highlight={mine}
                badge={mine ? <YouBadge /> : undefined}
                subtitle={`${t('bestStreak')} ${s?.best_streak ?? 0} · ${countLabel(language, s?.active_days ?? 0, ['zi activă', 'zile active'], ['активный день', 'активных дня', 'активных дней'])}`}
                left={<Text className="w-7 text-muted font-display text-[17px] text-center mr-2">{i + 4}</Text>}
                right={
                  streak > 0 ? (
                    <View className="flex-row items-center">
                      <Icon name="flame-filled" size={15} color={STREAK} strokeWidth={1.5} />
                      <Text className="text-ink font-ui-semibold text-[16px] ml-1.5">{streak}</Text>
                    </View>
                  ) : (
                    <Text className="text-muted font-ui-semibold text-[16px]">0</Text>
                  )
                }
              />
            );
          })}
        </View>
      )}
    </>
  );
}

const PODIUM = {
  1: { avatar: 72, block: 120, number: 40 },
  2: { avatar: 56, block: 84, number: 33 },
  3: { avatar: 56, block: 64, number: 33 },
} as const;

function PodiumColumn({ profile, streak, place, isMe }: { profile: Profile; streak: number; place: number; isMe: boolean }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const size = PODIUM[place as 1 | 2 | 3];
  const first = place === 1;
  // Eu am inelul flăcării; locul întâi, inelul accentului. Ceilalți, fără inel.
  const ring = isMe ? STREAK : first ? colors.primary : null;
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/profil', params: { id: profile.id } })}
      activeOpacity={0.8}
      className="flex-1 items-center"
    >
      <View>
        <View style={ring ? { borderWidth: 2, borderColor: ring, borderRadius: 999, padding: isMe ? 3 : 2 } : undefined}>
          <Avatar url={profile.avatar_url} name={fullName(profile)} size={size.avatar} />
        </View>
        {isMe && (
          <View className="absolute left-0 right-0 items-center" style={{ bottom: -9 }}>
            <View className="bg-ink rounded-full px-2 py-0.5">
              <Text className="text-card font-ui-bold text-[11px] uppercase tracking-wider">{t('youBadge')}</Text>
            </View>
          </View>
        )}
      </View>
      <Text className="text-ink font-ui-semibold text-[14px] leading-[18px] text-center mt-2.5" numberOfLines={2}>
        {fullName(profile)}
      </Text>
      <View className="flex-row items-center mt-1">
        <Icon name="flame-filled" size={14} color={STREAK} strokeWidth={1.5} />
        <Text className="text-ink font-ui-semibold text-[16px] ml-1.5">{streak}</Text>
      </View>
      <View
        className={`self-stretch items-center mt-2.5 pt-2.5 ${first ? 'bg-primary' : 'bg-primary-light'}`}
        style={{ height: size.block, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      >
        <Text className={`font-display-semibold ${first ? 'text-on-primary' : 'text-ink'}`} style={{ fontSize: size.number, lineHeight: size.number * 1.2 }}>
          {place}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function YouBadge() {
  const { t } = useLanguage();
  return (
    <View className="bg-card rounded-full px-2 py-0.5 ml-2">
      <Text className="text-ink font-ui-bold text-[11px]">{t('youBadge')}</Text>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="bg-card rounded-3xl border border-line overflow-hidden">{children}</View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <SectionLabel className="mb-2.5 px-1">{title}</SectionLabel>
      <Card>{children}</Card>
    </View>
  );
}

function Empty({ icon, text }: { icon: 'search' | 'users' | 'podium'; text: string }) {
  const { colors } = useTheme();
  return (
    <View className="bg-card rounded-3xl border border-line p-6 items-center">
      <Icon name={icon} size={30} color={colors.muted} />
      <Text className="text-muted font-ui text-center mt-2 leading-5">{text}</Text>
    </View>
  );
}
