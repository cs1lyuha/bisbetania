import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, back = true, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View
      style={{ backgroundColor: colors.primaryDeep, paddingTop: insets.top + 10, paddingBottom: 16 }}
      className="px-4 flex-row items-center"
    >
      {back && (
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={12}
          className="w-9 h-9 rounded-full bg-white/15 items-center justify-center mr-3"
        >
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>
      )}
      <View className="flex-1">
        <Text className="text-white text-[19px] font-bold" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text className="text-white/70 text-xs mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right}
    </View>
  );
}
