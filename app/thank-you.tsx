import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';

export default function ThankYouScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="h-1.5 bg-primary" />

      <View className="flex-1 items-center justify-center px-8">
        <Animated.View style={{ transform: [{ scale }], opacity }}>
          <View className="items-center">
            <View className="w-28 h-28 rounded-full bg-primary-light items-center justify-center mb-6">
              <Text style={{ fontSize: 56 }}>❤️</Text>
            </View>

            <Text className="text-gray-800 text-[28px] font-bold text-center mb-3">
              {t('thankYouTitle')}
            </Text>

            <Text className="text-gray-500 text-base text-center leading-6 mb-10">
              {t('thankYouMessage')}
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-primary rounded-2xl px-10 py-4"
              style={{ elevation: 3 }}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-base tracking-wide">
                {t('backButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
