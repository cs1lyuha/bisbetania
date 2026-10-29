import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { useLanguage } from '../../i18n';
import { TranslationKey } from '../../i18n/translations';
import { useTheme } from '../../lib/theme';
import { useUserData } from '../../lib/user-data';
import { tap } from '../../lib/haptics';
import ScreenHeader from '../../components/ScreenHeader';

type IconName = keyof typeof Ionicons.glyphMap;

const SECTIONS: { titleKey: TranslationKey; items: { icon: IconName; key: TranslationKey; descKey: TranslationKey; href: Href }[] }[] = [
  {
    titleKey: 'sectionSpiritual',
    items: [
      { icon: 'trail-sign-outline', key: 'plansTitle', descKey: 'plansMenuDesc', href: '/planuri' },
      { icon: 'flame-outline', key: 'prayersTitle', descKey: 'prayersMenuDesc', href: '/rugaciuni' },
      { icon: 'bulb-outline', key: 'memoryTitle', descKey: 'memoryMenuDesc', href: '/memorare' },
      { icon: 'bookmark-outline', key: 'favoritesTitle', descKey: 'favoritesMenuDesc', href: '/favorite' },
      { icon: 'search-outline', key: 'searchTitle', descKey: 'searchMenuDesc', href: '/cautare' },
    ],
  },
  {
    titleKey: 'sectionChurch',
    items: [
      { icon: 'calendar-number-outline', key: 'calendarTitle', descKey: 'calendarMenuDesc', href: '/calendar' },
      { icon: 'people-outline', key: 'grupMicTitle', descKey: 'grupMicMenuDesc', href: '/grup-mic' },
      { icon: 'time-outline', key: 'scheduleTitle', descKey: 'scheduleMenuDesc', href: '/program' },
      { icon: 'film-outline', key: 'historyButton', descKey: 'historyMenuDesc', href: '/istoria' },
      { icon: 'call-outline', key: 'contactsTitle', descKey: 'contactsMenuDesc', href: '/contacte' },
    ],
  },
  {
    titleKey: 'sectionApp',
    items: [{ icon: 'color-palette-outline', key: 'settingsTitle', descKey: 'settingsMenuDesc', href: '/setari' }],
  },
];

export default function MoreScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { favorites, prayers } = useUserData();

  const badge = (key: TranslationKey) => {
    if (key === 'favoritesTitle' && favorites.length) return favorites.length;
    if (key === 'prayersTitle') {
      const open = prayers.filter((p) => !p.answeredAt).length;
      return open || undefined;
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('tabMore')} back={false} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {SECTIONS.map((section) => (
          <View key={section.titleKey} className="mb-5">
            <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-2 px-1">{t(section.titleKey)}</Text>
            <View className="bg-card rounded-2xl border border-line overflow-hidden">
              {section.items.map((item, i) => {
                const count = badge(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => {
                      tap();
                      router.push(item.href);
                    }}
                    activeOpacity={0.7}
                    className={`flex-row items-center px-4 py-3.5 ${i > 0 ? 'border-t border-line' : ''}`}
                  >
                    <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center mr-3">
                      <Ionicons name={item.icon} size={20} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-ink font-semibold text-[15px]">{t(item.key)}</Text>
                      <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
                        {t(item.descKey)}
                      </Text>
                    </View>
                    {!!count && (
                      <View className="bg-primary rounded-full min-w-[22px] h-[22px] px-1.5 items-center justify-center mr-2">
                        <Text className="text-white text-[11px] font-bold">{count}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <Text className="text-center text-muted text-xs mt-2">BisBetania 1.1 · {t('madeWithLove')}</Text>
      </ScrollView>
    </View>
  );
}
