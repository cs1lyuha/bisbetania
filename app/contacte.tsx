import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useChurch } from '../lib/church';
import { YOUTUBE_LIVE } from '../config/links';
import ScreenHeader from '../components/ScreenHeader';

type IconName = keyof typeof Ionicons.glyphMap;

export default function ContactsScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { contacts } = useChurch();

  const openWeb = (url: string) => WebBrowser.openBrowserAsync(url, { toolbarColor: colors.primaryDeep });
  const address = contacts.address?.[language];
  const mapsQuery = encodeURIComponent(contacts.mapsQuery || address || '');

  const rows: { icon: IconName; label: string; value: string; onPress: () => void }[] = [];
  if (address)
    rows.push({
      icon: 'location-outline',
      label: t('address'),
      value: address,
      onPress: () =>
        Linking.openURL(Platform.OS === 'ios' ? `maps:0,0?q=${mapsQuery}` : `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`),
    });
  if (contacts.phone)
    rows.push({ icon: 'call-outline', label: t('phone'), value: contacts.phone, onPress: () => Linking.openURL(`tel:${contacts.phone.replace(/\s/g, '')}`) });
  if (contacts.email)
    rows.push({ icon: 'mail-outline', label: 'Email', value: contacts.email, onPress: () => Linking.openURL(`mailto:${contacts.email}`) });

  const allSocials: { icon: IconName; label: string; url: string }[] = [
    { icon: 'logo-youtube', label: 'YouTube', url: contacts.youtube },
    { icon: 'logo-facebook', label: 'Facebook', url: contacts.facebook },
    { icon: 'logo-instagram', label: 'Instagram', url: contacts.instagram },
    { icon: 'paper-plane', label: 'Telegram', url: contacts.telegram },
  ];
  const socials = allSocials.filter((s) => !!s.url);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('contactsTitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={() => openWeb(YOUTUBE_LIVE)}
          activeOpacity={0.85}
          className="rounded-3xl p-5 flex-row items-center mb-4"
          style={{ backgroundColor: colors.primaryDeep }}
        >
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-4">
            <Ionicons name="play" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{t('watchLive')}</Text>
            <Text className="text-white/75 text-sm mt-0.5">{t('watchLiveText')}</Text>
          </View>
        </TouchableOpacity>

        {rows.length > 0 ? (
          <View className="bg-card rounded-2xl border border-line overflow-hidden mb-4">
            {rows.map((r, i) => (
              <TouchableOpacity key={r.label} onPress={r.onPress} activeOpacity={0.7} className={`flex-row items-center px-4 py-4 ${i > 0 ? 'border-t border-line' : ''}`}>
                <View className="w-10 h-10 rounded-full bg-primary-light items-center justify-center mr-3">
                  <Ionicons name={r.icon} size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs">{r.label}</Text>
                  <Text className="text-ink font-semibold text-[15px]">{r.value}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text className="text-muted text-sm mb-4 px-1">{t('contactsMissing')}</Text>
        )}

        {socials.length > 0 && (
          <View className="flex-row flex-wrap" style={{ gap: 10 }}>
            {socials.map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => openWeb(s.url)}
                activeOpacity={0.8}
                style={{ width: '48%' }}
                className="bg-card rounded-2xl border border-line py-4 items-center"
              >
                <Ionicons name={s.icon} size={26} color={colors.primary} />
                <Text className="text-ink font-semibold mt-1.5">{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
