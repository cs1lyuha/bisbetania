import React, { useId, useState } from 'react';
import { Animated, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../lib/theme';

interface Props {
  /** Poziția de derulare a ecranului (Animated.ScrollView), ca fundalul să se întindă la tras în jos. */
  scrollY: Animated.Value;
  /** Cât de jos începe trecerea în culoarea fundalului. */
  fadeHeight?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Antetul cu poza bisericii. La tras în jos (bounce pe iOS) poza se mărește și acoperă golul de sus,
 * iar marginea de jos se topește în culoarea fundalului, pentru orice culoare și temă.
 */
export default function Hero({ scrollY, fadeHeight = 120, style, children }: Props) {
  const { colors } = useTheme();
  const [height, setHeight] = useState(360);
  const gradientId = `heroFade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  const pull = scrollY.interpolate({ inputRange: [-height, 0], outputRange: [-height, 0], extrapolateRight: 'clamp' });
  const scale = pull.interpolate({ inputRange: [-height, 0], outputRange: [2, 1] });
  // Mărirea pornește din centru, deci jumătate din ea iese sus; mutăm cu încă jumătate ca marginea de sus să rămână lipită de ecran.
  const translateY = Animated.multiply(pull, 0.5);

  return (
    <View style={style} onLayout={(e) => setHeight(Math.max(1, e.nativeEvent.layout.height))}>
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height, transform: [{ translateY }, { scale }] }}
      >
        <Animated.Image
          source={require('../assets/images/church.png')}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.heroOverlay }} />
        <Svg width="100%" height={fadeHeight} style={{ position: 'absolute', left: 0, right: 0, bottom: -1 }}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
              <Stop offset="0.45" stopColor={colors.bg} stopOpacity={0.45} />
              <Stop offset="0.8" stopColor={colors.bg} stopOpacity={0.9} />
              <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={fadeHeight} fill={`url(#${gradientId})`} />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}
