import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { ACHIEVEMENTS, earnedIds } from '../lib/achievements';
import { success } from '../lib/haptics';

/** Felicitarea pentru o realizare nouă; fiecare se arată o singură dată pe telefonul ăsta. */
export default function AchievementCelebration() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { session } = useAuth();
  const { stats } = useCommunity();
  const [queue, setQueue] = useState<string[]>([]);
  const scale = useRef(new Animated.Value(0.7)).current;
  // Lista celor văzute stă în memorie, ca o reîncărcare a statisticilor să nu readucă o felicitare tocmai închisă.
  const seen = useRef<{ key: string; ids: Set<string> } | null>(null);
  const me = session?.user.id;
  const mine = me ? stats.get(me) : undefined;
  const key = me ? `seenAchievements:${me}` : null;

  useEffect(() => {
    if (!key || !mine) return;
    let alive = true;
    (async () => {
      if (seen.current?.key !== key) {
        const raw = await AsyncStorage.getItem(key).catch(() => null);
        seen.current = { key, ids: new Set(raw ? (JSON.parse(raw) as string[]) : []) };
      }
      if (!alive) return;
      const fresh = earnedIds(mine).filter((id) => !seen.current!.ids.has(id));
      if (fresh.length) setQueue((q) => [...q, ...fresh.filter((id) => !q.includes(id))]);
    })();
    return () => {
      alive = false;
    };
  }, [key, mine]);

  const current = ACHIEVEMENTS.find((a) => a.id === queue[0]);

  useEffect(() => {
    if (!current) return;
    success();
    scale.setValue(0.7);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [current, scale]);

  const close = () => {
    if (!key || !current || !seen.current) return;
    seen.current.ids.add(current.id);
    AsyncStorage.setItem(key, JSON.stringify([...seen.current.ids])).catch(() => {});
    setQueue((q) => q.slice(1));
  };

  if (!current) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
          <View className="bg-card rounded-3xl p-6 items-center border border-line">
            <Text className="text-primary text-[11px] font-bold uppercase tracking-widest">{t('newAchievement')}</Text>
            <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center mt-4">
              <Ionicons name={current.icon as keyof typeof Ionicons.glyphMap} size={48} color="white" />
            </View>
            <Text className="text-ink text-2xl font-bold mt-4 text-center">{current.title[language]}</Text>
            <Text className="text-muted text-center mt-1 leading-5">{current.desc[language]}</Text>
            <TouchableOpacity onPress={close} activeOpacity={0.85} className="bg-primary rounded-2xl py-3.5 mt-6 self-stretch items-center">
              <Text className="text-white font-bold text-base">{t('thanksButton')}</Text>
            </TouchableOpacity>
            {queue.length > 1 && <Text className="text-muted text-xs mt-3">+{queue.length - 1}</Text>}
          </View>
        </Animated.View>
        <Ionicons name="sparkles" size={28} color={colors.primary} style={{ position: 'absolute', top: '22%', right: '18%' }} />
      </View>
    </Modal>
  );
}
