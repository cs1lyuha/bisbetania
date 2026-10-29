import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../lib/theme';
import { FONT } from '../lib/fonts';

interface Props {
  url?: string | null;
  name: string;
  size?: number;
  /** `soft`: inițiale `primary` pe `primary-light` (avatarul mare din profil). */
  tone?: 'solid' | 'soft';
}

/** Poza de profil sau, dacă lipsește, inițialele pe culoarea aplicației. */
export default function Avatar({ url, name, size = 44, tone = 'solid' }: Props) {
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
  const soft = tone === 'soft';
  // Inițialele sunt serif; la avatarele mărunte (de exemplu în șirul celor care se roagă) serif-ul nu se mai citește.
  const serif = size >= 30;
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: soft ? colors.primaryLight : colors.primary }}
      className="items-center justify-center"
    >
      <Text
        style={{
          color: soft ? colors.primary : colors.onPrimary,
          fontFamily: serif ? FONT.serifSemibold : FONT.uiBold,
          fontSize: size * (serif ? 0.38 : 0.36),
          includeFontPadding: false,
        }}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}
