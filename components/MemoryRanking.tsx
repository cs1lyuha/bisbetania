import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { useUserData } from '../lib/user-data';
import { supabase } from '../lib/supabase';
import MemberRow from './MemberRow';

interface Row {
  user_id: string;
  fill: number;
  order: number;
  recall: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];

/** Cine a adunat cele mai multe stele la versetul afișat (toate cele 3 jocuri = verset memorat). */
export default function MemoryRanking({ verseId, title }: { verseId: string; title: string }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { session } = useAuth();
  const { byId, loaded, refresh } = useCommunity();
  const askedRefresh = useRef(false);
  const { memory } = useUserData();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(() => {
    if (!session) return;
    supabase
      .from('memory_scores')
      .select('user_id, fill, order, recall')
      .eq('verse_id', verseId)
      .then(({ data }) => data && setRows(data as Row[]));
  }, [session, verseId]);

  // La revenirea din joc (și după ce rezultatul s-a sincronizat) clasamentul se reîmprospătează.
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setTimeout(load, 2500);
      return () => clearTimeout(timer);
    }, [load, memory[verseId]]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Cineva nou (înscris după ultima încărcare a membrilor): reîncărcăm o dată lista.
  useEffect(() => {
    if (loaded && rows?.some((r) => !byId.has(r.user_id)) && !askedRefresh.current) {
      askedRefresh.current = true;
      refresh();
    }
  }, [loaded, rows, byId, refresh]);

  if (!session || !rows || !loaded) return null;
  const ranked = rows
    .map((r) => ({ ...r, stars: r.fill + r.order + r.recall, mastered: r.fill > 0 && r.order > 0 && r.recall > 0, profile: byId.get(r.user_id) }))
    .filter((r) => r.profile && r.stars > 0)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 10);

  return (
    <>
      <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mt-6 mb-2 px-1">{title}</Text>
      <View className="bg-card rounded-2xl border border-line overflow-hidden">
        {ranked.length ? (
          ranked.map((r, i) => (
            <MemberRow
              key={r.user_id}
              profile={r.profile!}
              first={i === 0}
              highlight={r.user_id === session.user.id}
              subtitle={r.mastered ? `✓ ${t('mastered')}` : `@${r.profile!.nickname}`}
              left={
                <Text className="w-8 text-center font-bold text-muted mr-1" style={{ fontSize: i < 3 ? 20 : 14 }}>
                  {i < 3 ? MEDALS[i] : i + 1}
                </Text>
              }
              right={
                <View className="flex-row items-center">
                  <Ionicons name="star" size={14} color={colors.primary} />
                  <Text className="text-ink font-bold ml-1">{r.stars}</Text>
                </View>
              }
            />
          ))
        ) : (
          <Text className="text-muted text-sm text-center py-5 px-4">{t('memoryRankingEmpty')}</Text>
        )}
      </View>
    </>
  );
}
