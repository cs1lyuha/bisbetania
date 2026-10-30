import React from 'react';
import { Text } from 'react-native';

/** Eticheta de deasupra unei secțiuni: mică, majuscule, spațiere largă. */
export default function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-muted text-[11px] font-ui-bold uppercase tracking-widest ${className}`}>{children}</Text>;
}
