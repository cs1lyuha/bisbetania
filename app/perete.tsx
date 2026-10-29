import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { Profile, fullName, supabase } from '../lib/supabase';
import { timeAgo } from '../lib/format';
import { prayedSentence, supportersSentence } from '../lib/wall';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import AvatarStack from '../components/AvatarStack';
import Icon from '../components/Icon';

type Visibility = 'all' | 'friends';
type Filter = 'all' | 'mine';

interface WallPrayer {
  id: string;
  user_id: string;
  text: string;
  visibility: Visibility;
  answered_at: string | null;
  created_at: string;
  prayer_support: { user_id: string }[];
}

export default function PrayerWallScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { session, profile: myProfile } = useAuth();
  const { refresh: refreshCommunity } = useCommunity();
  const me = session?.user.id;

  const [items, setItems] = useState<WallPrayer[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  // Cererile la care o atingere pe 🙏 încă așteaptă serverul (a doua atingere rapidă ar inversa ordinea).
  const pending = useRef(new Set<string>());

  const load = useCallback(async () => {
    if (!me) return;
    const { data, error: e } = await supabase
      .from('wall_prayers')
      .select('id, user_id, text, visibility, answered_at, created_at, prayer_support(user_id)')
      .order('created_at', { ascending: false })
      .limit(150);
    setError(!!e);
    if (data) setItems(data as WallPrayer[]);
  }, [me]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session) {
    return (
      <View className="flex-1 bg-cream">
        <ScreenHeader title={t('wallTitle')} />
        <View className="m-4 bg-card rounded-3xl border border-line p-6 items-center">
          <Icon name="praying-hands" size={36} color={colors.primary} />
          <Text className="text-ink font-ui text-center mt-3 leading-5">{t('loginRequired')}</Text>
          <TouchableOpacity onPress={() => router.push('/cont')} className="mt-4 bg-primary rounded-xl px-5 py-3">
            <Text className="text-on-primary font-ui-semibold">{t('joinCommunity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const post = async () => {
    const body = text.trim();
    if (!body || posting) return;
    setPosting(true);
    const { error: e } = await supabase.from('wall_prayers').insert({ user_id: me, text: body, visibility });
    setPosting(false);
    if (e) return Alert.alert(t('errorTitle'), t('auth_error_unknown'));
    success();
    setText('');
    await load();
    refreshCommunity();
  };

  // Schimbarea apare imediat; dacă serverul refuză, reîncărcăm lista reală.
  const toggleSupport = async (p: WallPrayer) => {
    if (!me || pending.current.has(p.id)) return;
    pending.current.add(p.id);
    tap();
    const supported = p.prayer_support.some((s) => s.user_id === me);
    setItems((list) =>
      list?.map((x) =>
        x.id === p.id
          ? { ...x, prayer_support: supported ? x.prayer_support.filter((s) => s.user_id !== me) : [...x.prayer_support, { user_id: me }] }
          : x,
      ) ?? null,
    );
    const { error: e } = supported
      ? await supabase.from('prayer_support').delete().eq('prayer_id', p.id).eq('user_id', me)
      : await supabase.from('prayer_support').insert({ prayer_id: p.id, user_id: me });
    pending.current.delete(p.id);
    if (e) load();
    else refreshCommunity();
  };

  const toggleAnswered = async (p: WallPrayer) => {
    if (!p.answered_at) success();
    const answered_at = p.answered_at ? null : new Date().toISOString();
    setItems((list) => list?.map((x) => (x.id === p.id ? { ...x, answered_at } : x)) ?? null);
    const { error: e } = await supabase.from('wall_prayers').update({ answered_at }).eq('id', p.id);
    if (e) load();
  };

  const remove = (p: WallPrayer) =>
    Alert.alert(t('deletePrayerTitle'), t('deletePrayerText'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          setItems((list) => list?.filter((x) => x.id !== p.id) ?? null);
          const { error: e } = await supabase.from('wall_prayers').delete().eq('id', p.id);
          if (e) load();
          else refreshCommunity();
        },
      },
    ]);

  const all = items ?? [];
  const mineCount = all.filter((p) => p.user_id === me).length;
  const shown = all.filter((p) => filter === 'all' || p.user_id === me);
  const canPost = !!text.trim() && !posting;
  const visibilityLabel = (v: Visibility) => (v === 'all' ? t('visibleAll') : t('visibleFriends'));

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('wallTitle')} subtitle={t('wallSubtitle')} />
      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
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
        ListHeaderComponent={
          <>
            <View className="bg-card rounded-3xl border border-line px-4 pt-4 pb-2.5">
              <View className="flex-row items-start">
                {myProfile && <Avatar url={myProfile.avatar_url} name={fullName(myProfile)} size={36} />}
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('wallPlaceholder')}
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={500}
                  className="flex-1 text-ink font-ui text-[16px] leading-6 ml-3"
                  style={{ minHeight: 68, textAlignVertical: 'top', paddingTop: 6 }}
                />
              </View>
              <View className="h-px bg-line mt-3" />
              {/* Pe ecrane înguste (sau în rusă) butonul trece pe rândul următor, aliniat la dreapta. */}
              <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    tap();
                    setMenuOpen((o) => !o);
                  }}
                  activeOpacity={0.75}
                  className="flex-row items-center h-10 pl-3.5 pr-3 rounded-full border border-line"
                >
                  <Icon name={visibility === 'all' ? 'globe' : 'users'} size={16} color={colors.ink} />
                  <Text className="text-ink font-ui-semibold text-[14px] ml-2">{visibilityLabel(visibility)}</Text>
                  <View className="ml-1.5" style={{ transform: [{ rotate: menuOpen ? '180deg' : '0deg' }] }}>
                    <Icon name="chevron-down" size={16} color={colors.muted} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={post}
                  disabled={!canPost}
                  activeOpacity={0.85}
                  className="bg-primary rounded-full h-10 px-4 flex-row items-center ml-auto"
                  style={{ opacity: canPost ? 1 : 0.45 }}
                >
                  {posting ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Icon name="send" size={15} color={colors.onPrimary} />}
                  <Text className="text-on-primary font-ui-semibold text-[14px] ml-2">{t('postPrayer')}</Text>
                </TouchableOpacity>
              </View>
              {menuOpen && (
                <View className="mt-3 bg-cream rounded-2xl overflow-hidden">
                  {(['all', 'friends'] as Visibility[]).map((v, i) => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => {
                        tap();
                        setVisibility(v);
                        setMenuOpen(false);
                      }}
                      className={`flex-row items-center px-4 py-3 ${i ? 'border-t border-line' : ''}`}
                    >
                      <Icon name={v === 'all' ? 'globe' : 'users'} size={17} color={colors.ink} />
                      <Text className="flex-1 text-ink font-ui-medium text-[15px] ml-2.5">{visibilityLabel(v)}</Text>
                      {visibility === v && <Icon name="check" size={17} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View className="flex-row mt-4 mb-4" style={{ gap: 8 }}>
              {(['all', 'mine'] as Filter[]).map((f) => {
                const active = filter === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => {
                      tap();
                      setFilter(f);
                    }}
                    className={`h-10 px-4 rounded-full flex-row items-center ${active ? 'bg-primary' : 'bg-card border border-line'}`}
                  >
                    <Text className={`font-ui-semibold text-[14px] ${active ? 'text-on-primary' : 'text-ink'}`}>{f === 'all' ? t('wallAll') : t('wallMine')}</Text>
                    {items && (
                      <Text className={`font-ui text-[14px] ml-2 ${active ? 'text-on-primary/75' : 'text-muted'}`}>{f === 'all' ? all.length : mineCount}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          items === null && !error ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <View className="items-center mt-8 px-8">
              {error ? <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} /> : <Icon name="praying-hands" size={40} color={colors.muted} />}
              <Text className="text-muted font-ui text-center mt-3 leading-5">{error ? t('auth_error_network') : t('wallEmpty')}</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <PrayerCard prayer={item} me={me!} onSupport={() => toggleSupport(item)} onAnswered={() => toggleAnswered(item)} onDelete={() => remove(item)} />
        )}
      />
    </KeyboardAvoidingView>
  );
}

interface CardProps {
  prayer: WallPrayer;
  me: string;
  onSupport: () => void;
  onAnswered: () => void;
  onDelete: () => void;
}

/**
 * O cerere: autorul, textul și, jos, după caz:
 * a altcuiva → „Mă voi ruga” / „Mă rog ✓” și cine se mai roagă;
 * a mea → cine se roagă pentru mine, „Marchează răspunsă”, ștergerea;
 * răspunsă → pe accent deschis, textul ca un citat și cine s-a rugat.
 */
function PrayerCard({ prayer, me, onSupport, onAnswered, onDelete }: CardProps) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { byId } = useCommunity();
  const author = byId.get(prayer.user_id);
  const mine = prayer.user_id === me;
  const answered = !!prayer.answered_at;
  const supported = prayer.prayer_support.some((s) => s.user_id === me);
  // Eu primul în șirul de poze, apoi ceilalți în ordinea în care s-au alăturat.
  const supporters = [...prayer.prayer_support]
    .sort((a, b) => Number(b.user_id === me) - Number(a.user_id === me))
    .map((s) => byId.get(s.user_id))
    .filter((p): p is Profile => !!p);
  const others = supporters.filter((p) => p.id !== me);
  const firstName = (p: Profile) => p.first_name || p.nickname;
  const surface = answered ? colors.primaryLight : colors.card;

  const markButton = (
    <TouchableOpacity onPress={onAnswered} activeOpacity={0.7} hitSlop={6} className="flex-row items-center py-1 flex-shrink">
      <Icon name="circle-check" size={18} color={colors.primary} />
      <Text className="text-primary font-ui-semibold text-[14px] ml-2 flex-shrink" numberOfLines={1}>
        {answered ? t('wallUnmarkAnswered') : t('wallMarkAnswered')}
      </Text>
    </TouchableOpacity>
  );
  const deleteButton = (
    <TouchableOpacity onPress={onDelete} hitSlop={8} className="w-9 h-9 rounded-full items-center justify-center ml-auto">
      <Icon name="trash" size={18} color={colors.muted} />
    </TouchableOpacity>
  );

  return (
    <View className={`rounded-3xl px-4 pt-4 pb-3.5 mb-3 border ${answered ? 'bg-primary-light border-primary-light' : 'bg-card border-line'}`}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/profil', params: { id: prayer.user_id } })}
        activeOpacity={0.75}
        className="flex-row items-center"
      >
        <Avatar url={author?.avatar_url} name={author ? fullName(author) : '?'} size={40} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-ink font-ui-semibold text-[15px] flex-shrink" numberOfLines={1}>
              {author ? fullName(author) : t('memberFallback')}
            </Text>
            {mine && (
              <View className={`rounded-full px-2 py-0.5 ml-2 ${answered ? 'bg-card' : 'bg-primary-light'}`}>
                <Text className="text-ink font-ui-semibold text-[12px]">{t('youBadge')}</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mt-0.5">
            <Text className="text-muted font-ui text-[12px]">{timeAgo(language, new Date(prayer.created_at))}</Text>
            {!answered && (
              <>
                <Text className="text-muted font-ui text-[12px] mx-1.5">·</Text>
                <Icon name={prayer.visibility === 'all' ? 'globe' : 'users'} size={12} color={colors.muted} />
                <Text className="text-muted font-ui text-[12px] ml-1 flex-shrink" numberOfLines={1}>
                  {prayer.visibility === 'all' ? t('visibleAll') : t('visibleFriends')}
                </Text>
              </>
            )}
          </View>
        </View>
        {answered && (
          <View className="bg-primary rounded-full h-7 px-3 flex-row items-center ml-2">
            <Icon name="check" size={13} color={colors.onPrimary} strokeWidth={2.5} />
            <Text className="text-on-primary font-ui-semibold text-[13px] ml-1.5">{t('answered')}</Text>
          </View>
        )}
      </TouchableOpacity>

      {answered ? (
        <Text className="text-ink font-display text-[18px] leading-[27px] mt-3.5">{prayer.text}</Text>
      ) : (
        <Text className="text-ink font-ui text-[16px] leading-6 mt-3.5">{prayer.text}</Text>
      )}

      {/* Pe cererea mea: cine se roagă pentru mine. */}
      {mine && !answered && others.length > 0 && (
        <View className="flex-row items-center mt-3">
          <AvatarStack people={others} size={20} max={3} ring={surface} />
          <Text className="text-muted font-ui text-[12.5px] ml-2 flex-1" numberOfLines={2}>
            {supportersSentence(language, others.map(firstName))}
          </Text>
        </View>
      )}

      <View className="h-px mt-3.5" style={{ backgroundColor: answered ? colors.card : colors.line }} />

      {answered ? (
        <>
          {prayer.prayer_support.length > 0 && (
            <View className="flex-row items-center pt-3.5">
              <AvatarStack people={supporters} size={20} max={3} ring={surface} hideExtra />
              <Text className="text-muted font-ui text-[12.5px] ml-2 flex-1" numberOfLines={2}>
                {prayedSentence(language, prayer.prayer_support.length, supported)}
              </Text>
            </View>
          )}
          {mine && (
            <View className="flex-row items-center pt-3">
              {markButton}
              {deleteButton}
            </View>
          )}
        </>
      ) : mine ? (
        <View className="flex-row items-center pt-3">
          {markButton}
          {deleteButton}
        </View>
      ) : (
        <View className="flex-row items-center pt-3">
          <TouchableOpacity
            onPress={onSupport}
            activeOpacity={0.8}
            className={`flex-row items-center h-[38px] px-4 rounded-full ${supported ? 'bg-primary' : 'bg-primary-light'}`}
          >
            <Icon name="praying-hands" size={16} color={supported ? colors.onPrimary : colors.primary} />
            <Text className={`font-ui-semibold text-[14px] ml-2 ${supported ? 'text-on-primary' : 'text-ink'}`}>{supported ? t('praying') : t('willPray')}</Text>
            {supported && (
              <View className="ml-1.5">
                <Icon name="check" size={14} color={colors.onPrimary} strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>
          <View className="flex-1" />
          <AvatarStack people={supporters} size={20} max={3} ring={surface} total={prayer.prayer_support.length} />
        </View>
      )}
    </View>
  );
}
