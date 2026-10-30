import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View, type DimensionValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** O steluță cu patru raze și laturile arcuite, ca o sclipire. */
function SparkleShape({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 0C12.7 6.4 17.6 11.3 24 12C17.6 12.7 12.7 17.6 12 24C11.3 17.6 6.4 12.7 0 12C6.4 11.3 11.3 6.4 12 0Z" fill={color} />
    </Svg>
  );
}

export interface Sparkle {
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  size: number;
  color: string;
  /** Când apare în ciclu, în ms. */
  delay: number;
  /** Încotro se depărtează cât se aprinde, în px. */
  drift?: [number, number];
}

// Un ciclu: fiecare steluță se aprinde, se stinge și așteaptă până la următorul, pe rând cu celelalte.
const PERIOD = 4400;
const IN = 700;
const HOLD = 250;
const OUT = 1000;

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function Twinkle({ sparkle, still }: { sparkle: Sparkle; still: boolean }) {
  const v = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(sparkle.delay),
        Animated.timing(v, { toValue: 1, duration: IN, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.delay(HOLD),
        Animated.timing(v, { toValue: 0, duration: OUT, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(Math.max(0, PERIOD - sparkle.delay - IN - HOLD - OUT)),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, sparkle.delay, v]);

  const [dx, dy] = sparkle.drift ?? [0, 0];
  const { top, bottom, left, right, size } = sparkle;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        opacity: still ? 0.8 : v,
        transform: still
          ? []
          : [
              { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
              { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-35deg', '10deg'] }) },
            ],
      }}
    >
      <SparkleShape size={size} color={sparkle.color} />
    </Animated.View>
  );
}

/**
 * Steluțe care se aprind pe rând și ies puțin în afară, peste un card (stratul nu primește atingeri).
 * Cu „Reducerea mișcării” din telefon pornită, rămân pe loc, fără animație.
 */
export default function Sparkles({ items }: { items: Sparkle[] }) {
  const still = useReduceMotion();
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {items.map((s, i) => (
        <Twinkle key={i} sparkle={s} still={still} />
      ))}
    </View>
  );
}
