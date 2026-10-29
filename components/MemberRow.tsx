import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { Profile, fullName } from '../lib/supabase';
import { tap } from '../lib/haptics';
import Avatar from './Avatar';
import Icon from './Icon';

interface Props {
  profile: Profile;
  subtitle?: string;
  streak?: number;
  first?: boolean;
  highlight?: boolean;
  left?: React.ReactNode;
  /** În locul săgeții. */
  right?: React.ReactNode;
  /** Lângă nume (de exemplu eticheta „Tu”). */
  badge?: React.ReactNode;
  /** Înaintea săgeții (de exemplu „Cerere trimisă”). */
  extra?: React.ReactNode;
  avatarSize?: number;
}

/** Un rând din lista de membri: poza, numele, @nickname, seria; atingerea deschide profilul. */
export default function MemberRow({ profile, subtitle, streak, first, highlight, left, right, badge, extra, avatarSize = 44 }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        router.push({ pathname: '/profil', params: { id: profile.id } });
      }}
      activeOpacity={0.75}
      className={`flex-row items-center px-4 py-2.5 ${first ? '' : 'border-t border-line'} ${highlight ? 'bg-primary-light' : ''}`}
    >
      {left}
      <Avatar url={profile.avatar_url} name={fullName(profile)} size={avatarSize} />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-ink font-ui-semibold text-[15px] flex-shrink" numberOfLines={1}>
            {fullName(profile)}
          </Text>
          {badge}
        </View>
        <Text className="text-muted font-ui text-[12px] mt-0.5" numberOfLines={1}>
          {subtitle ?? `@${profile.nickname}`}
        </Text>
      </View>
      {!!streak && (
        <View className="flex-row items-center ml-2">
          <Icon name="flame-filled" size={15} color="#F59E0B" strokeWidth={1.5} />
          <Text className="text-ink font-ui-semibold text-[16px] ml-1.5">{streak}</Text>
        </View>
      )}
      {!!extra && <View className="ml-2">{extra}</View>}
      {right ? (
        <View className="ml-2">{right}</View>
      ) : (
        <View className="ml-3">
          <Icon name="chevron-right" size={18} color={colors.muted} />
        </View>
      )}
    </TouchableOpacity>
  );
}
