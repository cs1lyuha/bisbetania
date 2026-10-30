import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { tap } from '../lib/haptics';
import HeaderBackground from './HeaderBackground';
import Icon from './Icon';
import GlassButton from './GlassButton';

const BAR = 44;
const RADIUS = 22;
/** Pe ce distanță de derulare apare bara. */
const FADE = 40;

interface Props {
  /** Derularea ecranului (Animated.ScrollView cu onScroll pe scrollY). */
  scrollY: Animated.Value;
  /** Derularea la care bara e complet vizibilă: când antetul mare a ieșit de sub bara de stare. */
  showAt: number;
  title: string;
  onBack?: () => void;
}

/** Înălțimea barei strânse (cu bara de stare), ca ecranele să știe când ajunge antetul mare sub ea. */
export function useCollapsedBarHeight() {
  return useSafeAreaInsets().top + BAR;
}

/**
 * Bara de sus pentru ecranele cu antet mare (Acasă, Donează, Profil): cât antetul e pe ecran nu se vede;
 * când iese, apare în locul lui o bară îngustă, cu același gradient și colțuri rotunjite, și titlul.
 */
export default function CollapsedBar({ scrollY, showAt, title, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  const shownRef = useRef(false);

  // Atingerile trec prin bară cât e ascunsă; starea se schimbă doar la trecerea pragului.
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const next = value > showAt - FADE / 2;
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, showAt]);

  // Întâi fundalul (acoperă titlul mare care trece pe dedesubt), apoi titlul barei: cele două nu se suprapun.
  const progress = scrollY.interpolate({ inputRange: [showAt - FADE, showAt - 12], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleOpacity = scrollY.interpolate({ inputRange: [showAt - 12, showAt], outputRange: [0, 1], extrapolate: 'clamp' });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] });

  return (
    <Animated.View
      pointerEvents={shown ? 'auto' : 'none'}
      // Ascunsă, nu există nici pentru cititorul de ecran (titlul ar fi citit de două ori).
      aria-hidden={!shown}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: insets.top + BAR,
        opacity: progress,
        transform: [{ translateY }],
        borderBottomLeftRadius: RADIUS,
        borderBottomRightRadius: RADIUS,
        backgroundColor: colors.primaryDeep,
        shadowColor: colors.isDark ? '#000000' : colors.primaryDeep,
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
      }}
    >
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderBottomLeftRadius: RADIUS, borderBottomRightRadius: RADIUS, overflow: 'hidden' }}
      >
        <HeaderBackground />
      </View>
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginTop: insets.top, height: BAR, opacity: titleOpacity }}>
        {onBack && shown ? (
          <GlassButton
            onPress={() => {
              tap();
              onBack();
            }}
            size={36}
            accessibilityLabel={t('back')}
          >
            <Icon name="chevron-left" size={20} color="white" />
          </GlassButton>
        ) : (
          <View className="w-9" />
        )}
        <Text className="flex-1 text-white font-ui-semibold text-[16px] text-center mx-2" numberOfLines={1}>
          {shown ? title : ''}
        </Text>
        <View className="w-9" />
      </Animated.View>
    </Animated.View>
  );
}
