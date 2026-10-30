import React, { useRef } from 'react';
import { Animated, Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  /** Stilul elementului atins (lățime, margini în rând). */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Stilul conținutului (fundal, colțuri, padding). */
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Cât se micșorează la atingere. */
  scaleTo?: number;
  children: React.ReactNode;
}

/** Atingere cu un „arc”: cardul se strânge puțin și revine elastic, în loc să se estompeze. */
export default function PressableScale({ wrapperStyle, style, className, scaleTo = 0.97, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) => Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 7 }).start();
  return (
    <Pressable
      {...rest}
      style={wrapperStyle}
      onPressIn={(e) => {
        to(scaleTo);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(1);
        onPressOut?.(e);
      }}
    >
      {/* Animated.View nu primește className (pe web NativeWind nu-l aplică); stilurile stau pe View-ul dinăuntru. */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className={className} style={style}>
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}
