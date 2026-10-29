import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import Icon from './Icon';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** Conținut sub titlu, tot pe fundalul antetului (de exemplu comutatorul Membri / Clasament). */
  children?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, back = true, right, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.primaryDeep, paddingTop: insets.top + 10, paddingBottom: children ? 16 : 20 }} className="px-4">
      <View className="flex-row items-center" style={{ minHeight: 44 }}>
        {back && (
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            activeOpacity={0.7}
            hitSlop={8}
            className="w-11 h-11 rounded-full bg-white/15 items-center justify-center mr-3"
          >
            <Icon name="chevron-left" size={24} color="white" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {/* Titlurile lungi (sau în rusă) se micșorează puțin în loc să fie tăiate. */}
          <Text className="text-white text-[24px] leading-[28px] font-display-semibold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {title}
          </Text>
          {!!subtitle && (
            <Text className="text-white/80 text-[13px] leading-[17px] font-ui" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {children && <View className="mt-4">{children}</View>}
    </View>
  );
}
