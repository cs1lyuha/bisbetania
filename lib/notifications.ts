import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Language, translations } from '../i18n/translations';
import { getDailyVerse } from './daily';

const CHANNEL = 'daily-verse';
const DAYS_AHEAD = 30;

// În Expo Go pe Android modulul aruncă eroare la import, deci îl încărcăm doar în build-ul real (APK).
export const notificationsSupported =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let loadedModule: typeof NotificationsModule | null = null;

function getNotifications() {
  if (!notificationsSupported) return null;
  if (!loadedModule) {
    loadedModule = require('expo-notifications') as typeof NotificationsModule;
    loadedModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return loadedModule;
}

/**
 * Programează versetul zilei pentru următoarele 30 de zile (fiecare zi cu textul ei).
 * `ask` = cere permisiunea dacă lipsește; la pornirea aplicației doar reîmprospătăm fără să întrebăm.
 */
export async function scheduleDailyVerse(lang: Language, hour: number, ask: boolean): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted && ask) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: translations[lang].verseOfDay,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hour, 0, 0);
    if (date <= now) continue;
    const verse = getDailyVerse(lang, date);
    await Notifications.scheduleNotificationAsync({
      content: { title: `${translations[lang].verseOfDay} · ${verse.reference}`, body: verse.text },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
  return true;
}

export async function cancelDailyVerse() {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
