import { Tabs } from 'expo-router';
import { NativeTabs, type SFSymbolIcon } from 'expo-router/native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { LIQUID_GLASS } from '../../lib/glass';
import { tap } from '../../lib/haptics';
import GlassTabBar from '../../components/GlassTabBar';

type IconName = keyof typeof Ionicons.glyphMap;
// Numele simbolurilor SF (iconițele sistemului iOS), din tipurile NativeTabs.
type SFSymbol = Extract<NonNullable<SFSymbolIcon['sf']>, string>;

const TABS: { name: string; titleKey: 'tabHome' | 'tabBible' | 'tabDonate' | 'tabMore'; icon: IconName; sf: SFSymbol }[] = [
  { name: 'index', titleKey: 'tabHome', icon: 'home', sf: 'house' },
  { name: 'biblia', titleKey: 'tabBible', icon: 'book', sf: 'book' },
  { name: 'doneaza', titleKey: 'tabDonate', icon: 'heart', sf: 'heart' },
  { name: 'mai-mult', titleKey: 'tabMore', icon: 'grid', sf: 'square.grid.2x2' },
];

export default function TabsLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (LIQUID_GLASS) {
    // iOS 26+: bara de taburi a sistemului, cu Liquid Glass adevărat (la ținut apăsat lentila se mărește
    // și se plimbă după deget între taburi, ca în aplicațiile Apple).
    return (
      <NativeTabs
        tintColor={colors.primary}
        // Bara urmează tema aleasă în aplicație, nu doar pe cea a telefonului.
        unstable_nativeProps={{ colorScheme: colors.isDark ? 'dark' : 'light' }}
        screenListeners={{ tabPress: () => tap() }}
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger
            key={tab.name}
            name={tab.name}
            // Antetele trec pe sub bara de stare, iar spațiul de jos îl lasă ecranele (useTabBarSpace).
            disableAutomaticContentInsets
            contentStyle={{ backgroundColor: colors.bg }}
          >
            <NativeTabs.Trigger.Icon sf={{ default: tab.sf, selected: `${tab.sf}.fill` as SFSymbol }} />
            <NativeTabs.Trigger.Label>{t(tab.titleKey)}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      // Bara plutitoare, de sticlă; conținutul trece pe sub ea (fiecare tab lasă loc jos cu useTabBarSpace).
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Trecerea între taburi: ecranul alunecă puțin și apare treptat, în loc să sară.
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused, size }) => (
              // Culorile vin din GlassTabBar (șiruri din temă).
              <Ionicons name={focused ? tab.icon : (`${tab.icon}-outline` as IconName)} size={size - 2} color={color as string} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
