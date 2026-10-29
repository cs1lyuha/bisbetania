import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { tap } from '../lib/haptics';

const HEIGHT = 64;
const PAD = 6;

/** Cât stă bara deasupra marginii de jos: pe iPhone, chiar peste bara de acasă; altfel, puțin desprinsă. */
const lift = (insetBottom: number) => (insetBottom > 0 ? insetBottom - 6 : 12);

/** Spațiul de lăsat sub conținutul unui tab, ca ultimul card să nu rămână sub bara plutitoare. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return HEIGHT + lift(insets.bottom) + 16;
}

// Sticla adevărată (Liquid Glass) există din iOS 26; mai vechi și pe web, un strat estompat; pe Android, unul translucid.
const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable();

/** Bara de taburi plutitoare, ca o bulă de sticlă, cu o pastilă care alunecă spre tabul ales. */
export default function GlassTabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const position = useRef(new Animated.Value(state.index)).current;
  const count = state.routes.length;
  const tabWidth = width > 0 ? (width - PAD * 2) / count : 0;

  useEffect(() => {
    Animated.spring(position, { toValue: state.index, useNativeDriver: true, damping: 18, stiffness: 180, mass: 0.9 }).start();
  }, [state.index, position]);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: lift(insets.bottom) }]}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={[
          styles.bar,
          {
            borderColor: colors.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.75)',
            shadowColor: colors.isDark ? '#000000' : colors.primaryDeep,
          },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.clip]}>
          {LIQUID_GLASS ? (
            <GlassView style={StyleSheet.absoluteFill} glassEffectStyle="regular" colorScheme={colors.isDark ? 'dark' : 'light'} />
          ) : Platform.OS === 'android' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.card}F2` }]} />
          ) : (
            <>
              <BlurView style={StyleSheet.absoluteFill} intensity={60} tint={colors.isDark ? 'dark' : 'light'} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.card}${colors.isDark ? 'B3' : '99'}` }]} />
            </>
          )}
        </View>

        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pill,
              {
                width: tabWidth,
                backgroundColor: `${colors.primary}${colors.isDark ? '33' : '1F'}`,
                transform: [{ translateX: Animated.multiply(position, tabWidth) }],
              },
            ]}
          />
        )}

        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key].options;
            const focused = state.index === index;
            const color = focused ? colors.primary : colors.muted;
            const label = typeof options.title === 'string' ? options.title : route.name;
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                tap();
                navigateToTab(route.key);
              }
            };
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
                accessibilityRole="tab"
                aria-selected={focused}
                accessibilityLabel={label}
                style={styles.tab}
              >
                {options.tabBarIcon?.({ focused, color, size: 24 })}
                <Text numberOfLines={1} className="font-ui-semibold text-[11px] mt-0.5" style={{ color }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  clip: { borderRadius: HEIGHT / 2, overflow: 'hidden' },
  pill: { position: 'absolute', top: PAD, left: PAD, height: HEIGHT - PAD * 2, borderRadius: (HEIGHT - PAD * 2) / 2 },
  row: { flex: 1, flexDirection: 'row', paddingHorizontal: PAD },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
