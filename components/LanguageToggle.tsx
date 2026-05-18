import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useLanguage } from '../i18n';
import { Language } from '../i18n/translations';

const LANGS: Language[] = ['ro', 'ru'];

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <View className="flex-row justify-end">
      <View className="flex-row bg-white/20 rounded-lg p-0.5">
        {LANGS.map((lang) => (
          <TouchableOpacity
            key={lang}
            onPress={() => setLanguage(lang)}
            className={`px-3 py-1.5 rounded-md ${
              language === lang ? 'bg-white' : ''
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-bold uppercase ${
                language === lang ? 'text-primary' : 'text-white/70'
              }`}
            >
              {lang}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
