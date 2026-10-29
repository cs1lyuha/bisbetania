import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GameId } from '../lib/memory';

export const GAME_ICONS: Record<GameId, keyof typeof Ionicons.glyphMap> = {
  fill: 'create-outline',
  order: 'swap-vertical-outline',
  recall: 'sparkles-outline',
};

/** 1–3 stele pentru rezultatul unui joc de memorare. */
export default function Stars({ count, size = 14, color }: { count: number; size?: number; color: string }) {
  return (
    <View className="flex-row">
      {[1, 2, 3].map((i) => (
        <Ionicons key={i} name={i <= count ? 'star' : 'star-outline'} size={size} color={color} style={{ marginRight: 1, opacity: i <= count ? 1 : 0.4 }} />
      ))}
    </View>
  );
}
