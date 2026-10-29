import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { Profile, fullName } from '../lib/supabase';
import { tap } from '../lib/haptics';
import Avatar from './Avatar';

interface Props {
  profile: Profile;
  subtitle?: string;
  streak?: number;
  first?: boolean;
  highlight?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

/** Un rând din lista de membri: poza, numele, @nickname, seria; atingerea deschide profilul. */
export default function MemberRow({ profile, subtitle, streak, first, highlight, left, right }: Props) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        tap();
        router.push({ pathname: '/profil', params: { id: profile.id } });
      }}
      activeOpacity={0.75}
      className={`flex-row items-center px-4 py-3 ${first ? '' : 'border-t border-line'} ${highlight ? 'bg-primary-light' : ''}`}
    >
      {left}
      <Avatar url={profile.avatar_url} name={fullName(profile)} size={44} />
      <View className="flex-1 ml-3">
        <Text className="text-ink font-semibold text-[15px]" numberOfLines={1}>
          {fullName(profile)}
        </Text>
        <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
          {subtitle ?? `@${profile.nickname}`}
        </Text>
      </View>
      {!!streak && (
        <View className="flex-row items-center mr-2">
          <Ionicons name="flame" size={15} color="#F59E0B" />
          <Text className="text-ink font-bold text-sm ml-0.5">{streak}</Text>
        </View>
      )}
      {right ?? <Ionicons name="chevron-forward" size={16} color={colors.muted} />}
    </TouchableOpacity>
  );
}
