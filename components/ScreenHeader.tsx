import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { useLanguage } from '../i18n';
import { tap } from '../lib/haptics';
import Icon from './Icon';
import HeaderBackground from './HeaderBackground';
import GlassButton from './GlassButton';

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
  const { t } = useLanguage();

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
          <GlassButton
            onPress={() => {
              tap();
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
            accessibilityLabel={t('back')}
            style={{ marginRight: 12 }}
          >
            <Icon name="chevron-left" size={22} color="white" />
          </GlassButton>
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
