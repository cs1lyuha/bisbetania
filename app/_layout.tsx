import '../global.css';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../i18n';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
