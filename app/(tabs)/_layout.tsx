import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';
import GlassTabBar from '../../components/GlassTabBar';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: { name: string; titleKey: 'tabHome' | 'tabBible' | 'tabDonate' | 'tabMore'; icon: IconName }[] = [
  { name: 'index', titleKey: 'tabHome', icon: 'home' },
  { name: 'biblia', titleKey: 'tabBible', icon: 'book' },
  { name: 'doneaza', titleKey: 'tabDonate', icon: 'heart' },
  { name: 'mai-mult', titleKey: 'tabMore', icon: 'grid' },
];

export default function TabsLayout() {
  const { t } = useLanguage();
  const { colors } = useTheme();

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
