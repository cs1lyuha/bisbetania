import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, RefreshControl, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { fullName, supabase } from '../lib/supabase';
import { timeAgo } from '../lib/format';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';

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
  const { session } = useAuth();
  const { refresh: refreshCommunity } = useCommunity();
  const me = session?.user.id;

  const [items, setItems] = useState<WallPrayer[] | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('all');
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
          <Ionicons name="hand-left-outline" size={36} color={colors.primary} />
          <Text className="text-ink text-center mt-3 leading-5">{t('loginRequired')}</Text>
          <TouchableOpacity onPress={() => router.push('/cont')} className="mt-4 bg-primary rounded-xl px-5 py-3">
            <Text className="text-white font-bold">{t('joinCommunity')}</Text>
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

  const shown = (items ?? []).filter((p) => filter === 'all' || p.user_id === me);

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
            <View className="bg-card rounded-3xl border border-line p-4">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('wallPlaceholder')}
                placeholderTextColor={colors.muted}
                multiline
                maxLength={500}
                className="text-ink text-base"
                style={{ minHeight: 70, textAlignVertical: 'top' }}
              />
              {/* Pe ecrane înguste (sau în rusă) butonul trece pe rândul următor, aliniat la dreapta. */}
              <View className="flex-row flex-wrap items-center mt-3" style={{ gap: 8 }}>
                {(['all', 'friends'] as Visibility[]).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => {
                      tap();
                      setVisibility(v);
                    }}
                    className={`flex-row items-center px-3 py-1.5 rounded-full border ${visibility === v ? 'border-primary bg-primary-light' : 'border-line'}`}
                  >
                    <Ionicons name={v === 'all' ? 'globe-outline' : 'people-outline'} size={14} color={visibility === v ? colors.primary : colors.muted} />
                    <Text className={`text-xs font-semibold ml-1 ${visibility === v ? 'text-primary' : 'text-muted'}`}>
                      {v === 'all' ? t('visibleAll') : t('visibleFriends')}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={post}
                  disabled={!text.trim() || posting}
                  className="bg-primary rounded-full px-4 py-2 flex-row items-center ml-auto"
                  style={{ opacity: !text.trim() || posting ? 0.5 : 1 }}
                >
                  {posting ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="send" size={14} color="white" />}
                  <Text className="text-white font-bold text-sm ml-1.5">{t('postPrayer')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row mt-5 mb-3" style={{ gap: 8 }}>
              {(['all', 'mine'] as Filter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => {
                    tap();
                    setFilter(f);
                  }}
                  className={`px-4 py-2 rounded-full ${filter === f ? 'bg-primary' : 'bg-card border border-line'}`}
                >
                  <Text className={`text-sm font-bold ${filter === f ? 'text-white' : 'text-muted'}`}>{f === 'all' ? t('wallAll') : t('wallMine')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          items === null && !error ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (
            <View className="items-center mt-8 px-8">
              <Ionicons name={error ? 'cloud-offline-outline' : 'hand-left-outline'} size={40} color={colors.muted} />
              <Text className="text-muted text-center mt-3 leading-5">{error ? t('auth_error_network') : t('wallEmpty')}</Text>
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

function PrayerCard({ prayer, me, onSupport, onAnswered, onDelete }: { prayer: WallPrayer; me: string; onSupport: () => void; onAnswered: () => void; onDelete: () => void }) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { byId } = useCommunity();
  const author = byId.get(prayer.user_id);
  const mine = prayer.user_id === me;
  const supported = prayer.prayer_support.some((s) => s.user_id === me);
  const supporters = prayer.prayer_support.map((s) => byId.get(s.user_id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <View className={`bg-card rounded-3xl border p-4 mb-3 ${prayer.answered_at ? 'border-primary' : 'border-line'}`}>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/profil', params: { id: prayer.user_id } })}
        activeOpacity={0.75}
        className="flex-row items-center"
      >
        <Avatar url={author?.avatar_url} name={author ? fullName(author) : '?'} size={36} />
        <View className="flex-1 ml-2.5">
          <Text className="text-ink font-semibold text-sm">{author ? fullName(author) : t('memberFallback')}</Text>
          <View className="flex-row items-center">
            <Text className="text-muted text-[11px]">{timeAgo(language, new Date(prayer.created_at))}</Text>
            <Ionicons name={prayer.visibility === 'all' ? 'globe-outline' : 'people-outline'} size={11} color={colors.muted} style={{ marginLeft: 6 }} />
          </View>
        </View>
        {!!prayer.answered_at && (
          <View className="bg-primary rounded-full px-2.5 py-1 flex-row items-center">
            <Ionicons name="checkmark-circle" size={12} color="white" />
            <Text className="text-white text-[11px] font-bold ml-1">{t('answered')}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text className="text-ink text-[15px] leading-[22px] mt-3">{prayer.text}</Text>

      <View className="flex-row items-center mt-3 pt-3 border-t border-line">
        <TouchableOpacity
          onPress={onSupport}
          activeOpacity={0.8}
          className={`flex-row items-center rounded-full px-3 py-1.5 ${supported ? 'bg-primary' : 'bg-primary-light'}`}
        >
          <Text style={{ fontSize: 14 }}>🙏</Text>
          <Text className={`text-xs font-bold ml-1.5 ${supported ? 'text-white' : 'text-primary'}`}>{supported ? t('praying') : t('willPray')}</Text>
          {prayer.prayer_support.length > 0 && (
            <Text className={`text-xs font-bold ml-1.5 ${supported ? 'text-white' : 'text-primary'}`}>· {prayer.prayer_support.length}</Text>
          )}
        </TouchableOpacity>
        <View className="flex-row ml-2">
          {supporters.slice(0, 5).map((p, i) => (
            <View key={p.id} style={{ marginLeft: i ? -8 : 0, borderRadius: 12, borderWidth: 2, borderColor: colors.card }}>
              <Avatar url={p.avatar_url} name={fullName(p)} size={20} />
            </View>
          ))}
        </View>
        <View className="flex-1" />
        {mine && (
          <>
            <TouchableOpacity onPress={onAnswered} hitSlop={8} className="w-8 h-8 rounded-full items-center justify-center">
              <Ionicons name={prayer.answered_at ? 'checkmark-circle' : 'checkmark-circle-outline'} size={21} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} hitSlop={8} className="w-8 h-8 rounded-full items-center justify-center ml-1">
              <Ionicons name="trash-outline" size={18} color={colors.muted} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
