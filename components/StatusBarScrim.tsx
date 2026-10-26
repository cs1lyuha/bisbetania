import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';

/** Bandă sub bara de stare, ca textul derulat să nu treacă pe sub ceas și baterie. */
export default function StatusBarScrim() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: `${colors.primaryDeep}EB` }}
    />
  );
}
