import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { streakRanking, suggestionsFor, useCommunity } from '../lib/community';
import { fold } from '../lib/bible';
import { countLabel } from '../lib/format';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import MemberRow from '../components/MemberRow';
import FriendButton from '../components/FriendButton';

type Tab = 'members' | 'ranking';
const MEDALS = ['🥇', '🥈', '🥉'];

export default function MembersScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const { loaded, profiles, byId, stats, friendships, friendIds, incoming, refresh } = useCommunity();
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
          <Ionicons name="people-outline" size={36} color={colors.primary} />
          <Text className="text-ink text-center mt-3 leading-5">{t('loginRequired')}</Text>
          <TouchableOpacity onPress={() => router.push('/cont')} className="mt-4 bg-primary rounded-xl px-5 py-3">
            <Text className="text-white font-bold">{t('joinCommunity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const mutualText = (n: number) =>
    countLabel(language, n, ['prieten comun', 'prieteni comuni'], ['общий друг', 'общих друга', 'общих друзей']);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('membersTitle')} subtitle={t('membersSubtitle')} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View className="flex-row bg-card rounded-2xl border border-line p-1 mb-4">
          {(['members', 'ranking'] as Tab[]).map((x) => (
            <TouchableOpacity
              key={x}
              onPress={() => {
                tap();
                setTab(x);
              }}
              className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${tab === x ? 'bg-primary' : ''}`}
            >
              <Ionicons name={x === 'members' ? 'people-outline' : 'podium-outline'} size={16} color={tab === x ? 'white' : colors.muted} />
              <Text className={`font-bold ml-1.5 ${tab === x ? 'text-white' : 'text-muted'}`}>{x === 'members' ? t('tabMembers') : t('tabRanking')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!loaded ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : tab === 'ranking' ? (
          <>
            <Text className="text-muted text-xs mb-3 px-1 leading-4">{t('rankingHint')}</Text>
            {ranking.length ? (
              <View className="bg-card rounded-2xl border border-line overflow-hidden">
                {ranking.map(({ profile, stats: s }, i) => (
                  <MemberRow
                    key={profile.id}
                    profile={profile}
                    first={i === 0}
                    highlight={profile.id === me}
                    subtitle={`${t('bestStreak')}: ${s?.best_streak ?? 0} · ${t('activeDays')}: ${s?.active_days ?? 0}`}
                    left={
                      <Text className="w-8 text-center font-bold text-muted mr-1" style={{ fontSize: i < 3 ? 20 : 14 }}>
                        {i < 3 ? MEDALS[i] : i + 1}
                      </Text>
                    }
                    right={
                      <View className="flex-row items-center bg-primary-light rounded-full px-2.5 py-1">
                        <Ionicons name="flame" size={15} color="#F59E0B" />
                        <Text className="text-ink font-bold ml-1">{s?.current_streak ?? 0}</Text>
                      </View>
                    }
                  />
                ))}
              </View>
            ) : (
              <Empty icon="podium-outline" text={t('rankingEmpty')} />
            )}
          </>
        ) : (
          <>
            <View className="flex-row items-center bg-card border border-line rounded-2xl px-4 mb-4">
              <Ionicons name="search" size={17} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchMembers')}
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                className="flex-1 text-ink text-base py-3 ml-2"
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
                <Empty icon="search-outline" text={t('noMembersFound')} />
              )
            ) : (
              <>
                {incoming.length > 0 && (
                  <Section title={`${t('friendRequests')} · ${incoming.length}`}>
                    {incoming.map((f, i) => {
                      const p = byId.get(f.requester);
                      return p ? <MemberRow key={p.id} profile={p} first={i === 0} highlight right={<FriendButton userId={p.id} compact />} /> : null;
                    })}
                  </Section>
                )}

                {suggestions.length > 0 && (
                  <Section title={t('suggestions')}>
                    {suggestions.map(({ profile, mutual }, i) => (
                      <MemberRow
                        key={profile.id}
                        profile={profile}
                        first={i === 0}
                        subtitle={mutual ? mutualText(mutual) : `@${profile.nickname}`}
                        right={<FriendButton userId={profile.id} compact />}
                      />
                    ))}
                  </Section>
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
                      <MemberRow key={p.id} profile={p} first={i === 0} streak={stats.get(p.id)?.current_streak} />
                    ))}
                  </Section>
                ) : (
                  <Empty icon="people-outline" text={t('onlyYouYet')} />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View className="bg-card rounded-2xl border border-line overflow-hidden">{children}</View>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-2 px-1">{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors } = useTheme();
  return (
    <View className="bg-card rounded-3xl border border-line p-6 items-center">
      <Ionicons name={icon} size={30} color={colors.muted} />
      <Text className="text-muted text-center mt-2 leading-5">{text}</Text>
    </View>
  );
}
