import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';

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
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
              <Ionicons name={focused ? tab.icon : (`${tab.icon}-outline` as IconName)} size={size - 2} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
