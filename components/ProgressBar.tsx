import React from 'react';
import { View } from 'react-native';

interface Props {
  ratio: number;
  color: string;
  track: string;
  height?: number;
}

/** Bară de progres subțire, rotunjită. */
export default function ProgressBar({ ratio, color, track, height = 6 }: Props) {
  const width = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` as const;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}
