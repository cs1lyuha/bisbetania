import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../lib/theme';
import { Profile, fullName } from '../lib/supabase';
import Avatar from './Avatar';

interface Props {
  people: Pick<Profile, 'id' | 'avatar_url' | 'first_name' | 'last_name' | 'nickname'>[];
  size?: number;
  max?: number;
  /** Culoarea inelului din jurul fiecărei poze: fundalul pe care stă șirul. */
  ring: string;
  /** Câți sunt în total, dacă lista primită e incompletă (de exemplu membri care nu se mai văd). */
  total?: number;
  /** Fără „+N” (când textul de alături spune deja câți sunt). */
  hideExtra?: boolean;
}

/** Poze mici suprapuse, cu „+N” când sunt mai mulți decât încap. */
export default function AvatarStack({ people, size = 20, max = 3, ring, total, hideExtra }: Props) {
  const { colors } = useTheme();
  const shown = people.slice(0, max);
  const extra = hideExtra ? 0 : (total ?? people.length) - shown.length;
  if (!shown.length && extra <= 0) return null;
  const outer = size + 4;
  return (
    <View className="flex-row items-center">
      {shown.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i ? -outer * 0.3 : 0, borderRadius: outer / 2, borderWidth: 2, borderColor: ring }}>
          <Avatar url={p.avatar_url} name={fullName(p)} size={size} />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={{ marginLeft: shown.length ? -outer * 0.3 : 0, height: outer, minWidth: outer, borderRadius: outer / 2, borderWidth: 2, borderColor: ring, backgroundColor: colors.line }}
          className="items-center justify-center px-1.5"
        >
          <Text className="text-ink text-[11px] font-ui-bold">+{extra}</Text>
        </View>
      )}
    </View>
  );
}
