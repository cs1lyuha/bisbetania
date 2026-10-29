import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useCommunity } from '../lib/community';
import { success, tap } from '../lib/haptics';

/** Butonul de prietenie, după starea legăturii: Adaugă · Cerere trimisă · Acceptă/Refuză · Prieteni. */
export default function FriendButton({ userId, compact }: { userId: string; compact?: boolean }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { relation, sendRequest, accept, remove } = useCommunity();
  const [busy, setBusy] = useState(false);
  const state = relation(userId);
  if (state === 'self') return null;

  const run = async (action: () => Promise<void>, celebrate = false) => {
    tap();
    setBusy(true);
    try {
      await action();
      if (celebrate) success();
    } catch {
      Alert.alert(t('errorTitle'), t('auth_error_unknown'));
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = () =>
    Alert.alert(t('removeFriend'), t('removeFriendConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('removeFriend'), style: 'destructive', onPress: () => run(() => remove(userId)) },
    ]);

  const size = compact ? 'px-3 py-1.5' : 'px-4 py-3 flex-1';
  const text = compact ? 'text-xs' : 'text-[15px]';
  if (busy) {
    return (
      <View className={`${size} items-center justify-center`}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (state === 'received') {
    return (
      <View className={`flex-row ${compact ? '' : 'flex-1'}`} style={{ gap: 8 }}>
        <TouchableOpacity onPress={() => run(() => accept(userId), true)} className={`${size} rounded-xl bg-primary flex-row items-center justify-center`}>
          <Ionicons name="checkmark" size={compact ? 14 : 18} color="white" />
          <Text className={`text-white font-bold ml-1 ${text}`}>{t('acceptRequest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => run(() => remove(userId))} className={`${size} rounded-xl border-2 border-line items-center justify-center`}>
          <Text className={`text-muted font-bold ${text}`}>{t('declineRequest')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = {
    none: { icon: 'person-add-outline', label: t('addFriend'), filled: true, onPress: () => run(() => sendRequest(userId), true) },
    sent: {
      icon: 'time-outline',
      label: t('requestSent'),
      filled: false,
      onPress: () =>
        Alert.alert(t('cancelRequest'), undefined, [
          { text: t('cancel'), style: 'cancel' },
          { text: t('cancelRequest'), style: 'destructive', onPress: () => run(() => remove(userId)) },
        ]),
    },
    friends: { icon: 'people', label: t('friendsLabel'), filled: false, onPress: confirmRemove },
  }[state];

  return (
    <TouchableOpacity
      onPress={config.onPress}
      activeOpacity={0.85}
      className={`${size} rounded-xl flex-row items-center justify-center ${config.filled ? 'bg-primary' : 'border-2 border-primary bg-primary-light'}`}
    >
      <Ionicons name={config.icon as keyof typeof Ionicons.glyphMap} size={compact ? 14 : 18} color={config.filled ? 'white' : colors.primary} />
      <Text className={`font-bold ml-1.5 ${text} ${config.filled ? 'text-white' : 'text-primary'}`}>{config.label}</Text>
    </TouchableOpacity>
  );
}
