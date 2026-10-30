import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { Language, TranslationKey } from '../i18n/translations';
import { ACCENTS, Accent, ThemeMode, useTheme } from '../lib/theme';
import { cancelDailyVerse, notificationsSupported, scheduleDailyVerse } from '../lib/notifications';
import { getDailyVerse } from '../lib/daily';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';

const MODES: { mode: ThemeMode; icon: keyof typeof Ionicons.glyphMap; key: TranslationKey }[] = [
  { mode: 'system', icon: 'phone-portrait-outline', key: 'modeSystem' },
  { mode: 'light', icon: 'sunny-outline', key: 'modeLight' },
  { mode: 'dark', icon: 'moon-outline', key: 'modeDark' },
];

const HOURS = [6, 7, 8, 9, 12, 20, 21];

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { colors, settings, updateSettings, serifFont } = useTheme();
  const [notifyError, setNotifyError] = useState(false);
  const sample = getDailyVerse(language);

  const setNotify = async (on: boolean, hour = settings.notifyHour) => {
    setNotifyError(false);
    if (!on) {
      updateSettings({ notify: false });
      await cancelDailyVerse();
      return;
    }
    const ok = await scheduleDailyVerse(language, hour, true).catch(() => false);
    if (ok) success();
    else setNotifyError(true);
    updateSettings({ notify: ok, notifyHour: hour });
  };

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('settingsTitle')} subtitle={t('settingsSubtitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Culoare */}
        <Section title={t('accentColor')}>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {(Object.keys(ACCENTS) as Accent[]).map((accent) => {
              const active = settings.accent === accent;
              return (
                <TouchableOpacity
                  key={accent}
                  onPress={() => {
                    tap();
                    updateSettings({ accent });
                  }}
                  activeOpacity={0.8}
                  className="items-center"
                  style={{ width: '29%' }}
                >
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                    style={{
                      backgroundColor: ACCENTS[accent][colors.isDark ? 'dark' : 'light'],
                      borderWidth: 3,
                      borderColor: active ? colors.ink : 'transparent',
                    }}
                  >
                    {active && <Ionicons name="checkmark" size={24} color="white" />}
                  </View>
                  <Text className={`text-xs mt-1.5 ${active ? 'text-ink font-bold' : 'text-muted'}`}>{t(`accent_${accent}` as TranslationKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Mod luminos / întunecat */}
        <Section title={t('appearance')}>
          <View className="flex-row" style={{ gap: 8 }}>
            {MODES.map((m) => {
              const active = settings.mode === m.mode;
              return (
                <TouchableOpacity
                  key={m.mode}
                  onPress={() => {
                    tap();
                    updateSettings({ mode: m.mode });
                  }}
                  className={`flex-1 items-center py-3 rounded-xl border-2 ${active ? 'border-primary bg-primary-light' : 'border-line'}`}
                >
                  <Ionicons name={m.icon} size={20} color={active ? colors.primary : colors.muted} />
                  <Text className={`text-xs mt-1 ${active ? 'text-primary font-bold' : 'text-muted'}`}>{t(m.key)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Text Biblie */}
        <Section title={t('readingText')}>
          <View className="bg-cream rounded-xl p-4 border border-line">
            <Text className="text-ink" style={{ fontSize: settings.fontSize, lineHeight: Math.round(settings.fontSize * 1.6), fontFamily: serifFont }}>
              {sample.text}
            </Text>
            <Text className="text-primary font-bold text-xs mt-2">{sample.reference}</Text>
          </View>
          <View className="flex-row items-center mt-3" style={{ gap: 10 }}>
            <Stepper label="A−" onPress={() => updateSettings({ fontSize: Math.max(14, settings.fontSize - 1) })} />
            <Text className="text-ink font-bold w-8 text-center">{settings.fontSize}</Text>
            <Stepper label="A+" onPress={() => updateSettings({ fontSize: Math.min(28, settings.fontSize + 1) })} />
            <View className="flex-1" />
            <Text className="text-muted mr-2">{t('serifFont')}</Text>
            <Switch
              value={settings.serif}
              onValueChange={(serif) => updateSettings({ serif })}
              trackColor={{ true: colors.primary, false: colors.line }}
              thumbColor="white"
            />
          </View>
        </Section>

        {/* Notificări */}
        <Section title={t('dailyNotification')}>
          <View className="flex-row items-center">
            <View className="flex-1 pr-3">
              <Text className="text-ink font-semibold">{t('dailyNotificationTitle')}</Text>
              <Text className="text-muted text-xs mt-0.5 leading-4">{t('dailyNotificationText')}</Text>
            </View>
            <Switch
              value={settings.notify}
              onValueChange={(on) => setNotify(on)}
              disabled={!notificationsSupported}
              trackColor={{ true: colors.primary, false: colors.line }}
              thumbColor="white"
            />
          </View>
          {settings.notify && (
            <View className="flex-row flex-wrap mt-3" style={{ gap: 8 }}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  onPress={() => setNotify(true, h)}
                  className={`px-3.5 py-2 rounded-full border-2 ${settings.notifyHour === h ? 'border-primary bg-primary' : 'border-line'}`}
                >
                  <Text className={`font-semibold text-sm ${settings.notifyHour === h ? 'text-white' : 'text-ink'}`}>
                    {String(h).padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {notifyError && <Text className="text-red-500 text-xs mt-2">{t('notifyDenied')}</Text>}
        </Section>

        {/* Limba */}
        <Section title={t('languageLabel')}>
          <View className="flex-row" style={{ gap: 8 }}>
            {(['ro', 'ru'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  tap();
                  setLanguage(lang);
                }}
                className={`flex-1 py-3 rounded-xl border-2 items-center ${language === lang ? 'border-primary bg-primary-light' : 'border-line'}`}
              >
                <Text className={`font-bold ${language === lang ? 'text-primary' : 'text-muted'}`}>
                  {lang === 'ro' ? '🇲🇩  Română' : '🇷🇺  Русский'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-card rounded-2xl border border-line p-4 mb-4">
      <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-3">{title}</Text>
      {children}
    </View>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="w-11 h-10 rounded-xl bg-primary-light items-center justify-center">
      <Text className="text-primary font-bold">{label}</Text>
    </TouchableOpacity>
  );
}
