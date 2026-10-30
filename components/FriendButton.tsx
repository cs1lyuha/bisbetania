import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useCommunity } from '../lib/community';
import { success, tap } from '../lib/haptics';
import Icon, { IconName } from './Icon';

interface Props {
  userId: string;
  /** În liste: mai mic. */
  compact?: boolean;
  /** Ocupă toată lățimea (cardul unei sugestii). */
  stretch?: boolean;
}

/** Butonul de prietenie, după starea legăturii: Adaugă · Cerere trimisă · Acceptă/Refuză · Prieteni. */
export default function FriendButton({ userId, compact, stretch }: Props) {
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

  const height = compact ? 40 : 44;
  const text = compact ? 'text-[14px]' : 'text-[15px]';
  const icon = compact ? 16 : 18;
  if (busy) {
    return (
      <View style={{ height, minWidth: height }} className={`items-center justify-center ${stretch ? 'self-stretch' : ''}`}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (state === 'received') {
    return (
      <View className="flex-row items-center" style={{ gap: compact ? 4 : 8 }}>
        <TouchableOpacity
          onPress={() => run(() => accept(userId), true)}
          activeOpacity={0.85}
          style={{ height }}
          className={`rounded-xl bg-primary flex-row items-center justify-center ${compact ? 'px-3.5' : 'px-5'}`}
        >
          <Icon name="check" size={icon} color={colors.onPrimary} strokeWidth={2.5} />
          <Text className={`text-on-primary font-ui-semibold ml-1.5 ${text}`}>{t('acceptRequest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => run(() => remove(userId))} activeOpacity={0.6} style={{ height }} className="px-3 items-center justify-center">
          <Text className={`text-ink font-ui-semibold ${text}`}>{t('declineRequest')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state === 'sent') {
    // Pastilă discretă: cererea e trimisă, atingerea întreabă dacă vrei s-o retragi.
    return (
      <TouchableOpacity
        onPress={() =>
          Alert.alert(t('cancelRequest'), undefined, [
            { text: t('cancel'), style: 'cancel' },
            { text: t('cancelRequest'), style: 'destructive', onPress: () => run(() => remove(userId)) },
          ])
        }
        activeOpacity={0.7}
        hitSlop={compact ? 6 : 0}
        style={{ height: compact ? 30 : height }}
        className={`rounded-full border border-line flex-row items-center justify-center flex-shrink ${compact ? 'px-3' : 'px-5'} ${stretch ? 'self-stretch' : ''}`}
      >
        <Icon name="clock" size={compact ? 12 : 15} color={colors.muted} />
        <Text className={`text-muted font-ui-medium ml-1.5 flex-shrink ${compact ? 'text-[12px]' : 'text-[14px]'}`} numberOfLines={1}>
          {t('requestSent')}
        </Text>
      </TouchableOpacity>
    );
  }

  const config: { icon: IconName; label: string; filled: boolean; onPress: () => void } =
    state === 'none'
      ? { icon: 'user-plus', label: t('addFriend'), filled: true, onPress: () => run(() => sendRequest(userId), true) }
      : { icon: 'users', label: t('friendsLabel'), filled: false, onPress: confirmRemove };

  return (
    <TouchableOpacity
      onPress={config.onPress}
      activeOpacity={0.85}
      style={{ height }}
      className={`rounded-xl flex-row items-center justify-center ${compact ? 'px-3.5' : 'px-5'} ${stretch ? 'self-stretch' : ''} ${
        config.filled ? 'bg-primary' : 'bg-primary-light'
      }`}
    >
      <Icon name={config.icon} size={icon} color={config.filled ? colors.onPrimary : colors.primary} />
      <Text className={`font-ui-semibold ml-1.5 ${text} ${config.filled ? 'text-on-primary' : 'text-primary'}`}>{config.label}</Text>
    </TouchableOpacity>
  );
}
