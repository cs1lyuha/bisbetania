import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../lib/theme';

interface Props {
  url?: string | null;
  name: string;
  size?: number;
}

/** Poza de profil sau, dacă lipsește, inițialele pe culoarea aplicației. */
export default function Avatar({ url, name, size = 44 }: Props) {
  const { colors } = useTheme();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.line }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primary }} className="items-center justify-center">
      <Text style={{ color: 'white', fontWeight: '700', fontSize: size * 0.38 }}>{initials || '?'}</Text>
    </View>
  );
}
