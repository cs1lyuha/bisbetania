import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useLanguage } from '../i18n';
import { ThemeProvider, useTheme } from '../lib/theme';
import { UserDataProvider } from '../lib/user-data';
import { ChurchProvider } from '../lib/church';
import { AuthProvider } from '../lib/auth';
import { CommunityProvider } from '../lib/community';
import AchievementCelebration from '../components/AchievementCelebration';
import SyncBridge from '../lib/sync';
import { scheduleDailyVerse } from '../lib/notifications';
import { FONT_FILES } from '../lib/fonts';

// Ecranul de start rămâne până se încarcă fonturile, ca textul să nu sară de la fontul sistemului la Inter.
SplashScreen.preventAutoHideAsync().catch(() => {});


function AppStack() {
  const { colors, settings, loaded } = useTheme();
  const { language } = useLanguage();

  // Reîmprospătează notificările programate (zilele trecute s-au consumat, limba se poate schimba).
  useEffect(() => {
    if (loaded && settings.notify) scheduleDailyVerse(language, settings.notifyHour, false).catch(() => {});
  }, [loaded, settings.notify, settings.notifyHour, language]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <AchievementCelebration />
      <SyncBridge />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Fonturile sunt în aplicație, durează o clipă. Pe telefon se vede ecranul de start; pe web, un ecran în culoarea lui.
  // Dacă fonturile nu se încarcă, mergem mai departe cu cele ale sistemului.
  if (!ready) return <View style={{ flex: 1, backgroundColor: '#1A472A' }} />;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <UserDataProvider>
            <ChurchProvider>
              <AuthProvider>
                <CommunityProvider>
                  <AppStack />
                </CommunityProvider>
              </AuthProvider>
            </ChurchProvider>
          </UserDataProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
