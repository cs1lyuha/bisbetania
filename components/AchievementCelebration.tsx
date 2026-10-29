import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, ScrollView, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { useLanguage } from '../i18n';
import { ThemeScope, useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { useCommunity } from '../lib/community';
import { ACHIEVEMENTS, earnedIds, nextInFamily, progressOf } from '../lib/achievements';
import { success } from '../lib/haptics';
import Icon from './Icon';
import ProgressBar from './ProgressBar';

/** Felicitarea pentru o realizare nouă; fiecare se arată o singură dată pe telefonul ăsta. */
export default function AchievementCelebration() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { session } = useAuth();
  const { stats } = useCommunity();
  const [queue, setQueue] = useState<string[]>([]);
  // Câte felicitări s-au închis din șirul de acum, pentru „1 din 2”.
  const [closed, setClosed] = useState(0);
  const scale = useRef(new Animated.Value(0.85)).current;
  const glow = useRef(new Animated.Value(0)).current;
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
    scale.setValue(0.85);
    glow.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 1, duration: 500, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [current, scale, glow]);

  const markSeen = (ids: string[]) => {
    if (!key || !seen.current) return;
    ids.forEach((id) => seen.current!.ids.add(id));
    AsyncStorage.setItem(key, JSON.stringify([...seen.current.ids])).catch(() => {});
  };

  const close = () => {
    if (!current) return;
    markSeen([current.id]);
    setClosed((n) => (queue.length > 1 ? n + 1 : 0));
    setQueue((q) => q.slice(1));
  };

  // Toate realizările se văd în profil, deci nu mai arătăm și restul felicitărilor din șir.
  const seeAll = () => {
    markSeen(queue);
    setQueue([]);
    setClosed(0);
    router.navigate('/profil');
  };

  if (!current) return null;
  const next = nextInFamily(current, mine);
  const nextProgress = next ? progressOf(next, mine) : null;
  const total = closed + queue.length;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={close}>
      <ThemeScope>
        {/* Pe ecranele înalte cardul stă sus (ca în planșe); pe cele mici sau cu text mărit se derulează, ca butonul să rămână la îndemână. */}
        <ScrollView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: height >= 740 ? Math.max(insets.top + 24, height * 0.2) : insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Animated.View style={{ transform: [{ scale }], width: '100%', maxWidth: 400 }}>
            <View className="bg-card rounded-[32px] px-6 pt-7 pb-4 items-center">
              <Text className="text-muted font-ui-bold text-[11px] uppercase tracking-widest">{t('newAchievement')}</Text>

              <View className="items-center justify-center mt-4" style={{ width: RAYS, height: RAYS }}>
                <Animated.View style={{ position: 'absolute', opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }}>
                  <Rays color={colors.primary} />
                </Animated.View>
                <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: colors.primaryLight }} className="items-center justify-center">
                  <View style={{ width: 86, height: 86, borderRadius: 43, backgroundColor: colors.primary }} className="items-center justify-center">
                    <Icon name={current.icon} size={34} color={colors.onPrimary} />
                  </View>
                </View>
              </View>

              <Text className="text-ink font-display-semibold text-[32px] leading-[40px] text-center mt-1">{current.title[language]}</Text>
              <Text className="text-muted font-ui text-[15px] leading-[21px] text-center mt-1">{current.desc[language]}</Text>

              {next && nextProgress && (
                <View className="self-stretch bg-cream rounded-2xl px-4 py-3.5 mt-4 flex-row items-center">
                  <Icon name={next.icon} size={18} color={colors.muted} />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="flex-1 text-ink font-ui-semibold text-[14px]" numberOfLines={1}>
                        {t('nextAchievement')}: {next.title[language]}
                      </Text>
                      <Text className="text-muted font-ui text-[14px] ml-2">
                        {nextProgress.value}/{next.goal}
                      </Text>
                    </View>
                    <View className="mt-2">
                      <ProgressBar ratio={nextProgress.ratio} color={colors.primary} track={colors.line} height={5} />
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity onPress={close} activeOpacity={0.85} className="bg-primary rounded-2xl h-[52px] mt-4 self-stretch items-center justify-center">
                <Text className="text-on-primary font-ui-semibold text-[16px]">{t('thanksButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={seeAll} activeOpacity={0.7} hitSlop={8} className="mt-4">
                <Text className="text-primary font-ui-semibold text-[15px]">{t('seeAchievements')}</Text>
              </TouchableOpacity>
              {total > 1 && (
                <Text className="text-muted font-ui text-[13px] mt-3">
                  {closed + 1} {t('outOf')} {total}
                </Text>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </ThemeScope>
    </Modal>
  );
}

const RAYS = 150;

/** Razele din jurul insignei: liniuțe la fiecare 30°, cu puncte între ele. */
function Rays({ color }: { color: string }) {
  const c = RAYS / 2;
  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
  };
  return (
    <Svg width={RAYS} height={RAYS}>
      {Array.from({ length: 12 }, (_, i) => {
        const deg = i * 30;
        const from = at(deg, 63);
        const to = at(deg, 73);
        const dot = at(deg + 15, 66);
        return (
          <React.Fragment key={i}>
            <Line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeOpacity={0.4} strokeWidth={2} strokeLinecap="round" />
            <Circle cx={dot.x} cy={dot.y} r={1.4} fill={color} fillOpacity={0.4} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
