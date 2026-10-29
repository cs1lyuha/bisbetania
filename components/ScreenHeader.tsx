import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { tap } from '../lib/haptics';
import Icon from './Icon';
import HeaderBackground from './HeaderBackground';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  /** Conținut sub titlu, tot pe fundalul antetului (de exemplu comutatorul Membri / Clasament). */
  children?: React.ReactNode;
}

/** Antetul paginilor: gradient pe accent, colțuri rotunjite jos, butonul „înapoi” ca o bulă de sticlă. */
export default function ScreenHeader({ title, subtitle, back = true, right, children }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.primaryDeep,
        paddingTop: insets.top + 8,
        paddingBottom: children ? 14 : 18,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
      }}
      className="px-4"
    >
      <HeaderBackground />
      <View className="flex-row items-center" style={{ minHeight: 42 }}>
        {back && (
          <TouchableOpacity
            onPress={() => {
              tap();
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            activeOpacity={0.7}
            hitSlop={8}
            className="w-10 h-10 rounded-full bg-white/15 border border-white/20 items-center justify-center mr-3"
          >
            <Icon name="chevron-left" size={22} color="white" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          {/* Titlurile lungi (sau în rusă) se micșorează puțin în loc să fie tăiate. */}
          <Text className="text-white text-[22px] leading-[27px] font-display-semibold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {title}
          </Text>
          {!!subtitle && (
            <Text className="text-white/75 text-[13px] leading-[17px] font-ui" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {children && <View className="mt-3.5">{children}</View>}
    </View>
  );
}
