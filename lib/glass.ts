import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

/**
 * Sticla adevărată de la Apple (Liquid Glass): iOS 26+. Unele versiuni beta de iOS 26 n-au API-ul și s-ar
 * închide aplicația, de aceea și a doua verificare. Pe Android, web și iOS mai vechi rămâne imitația.
 */
export const LIQUID_GLASS = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
