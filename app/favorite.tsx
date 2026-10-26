import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { HIGHLIGHTS, useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { formatRef } from '../lib/bible';
import { formatDate } from '../lib/format';
import ScreenHeader from '../components/ScreenHeader';

export default function FavoritesScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { favorites, removeFavorite } = useUserData();

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('favoritesTitle')} subtitle={`${favorites.length}`} />
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.key}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center mt-20 px-10">
            <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center">
              <Ionicons name="bookmark-outline" size={36} color={colors.primary} />
            </View>
            <Text className="text-ink font-bold text-lg mt-4">{t('noFavorites')}</Text>
            <Text className="text-muted text-center mt-2 leading-5">{t('noFavoritesHint')}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const reference = formatRef(item.lang, item);
          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/citire', params: { b: item.b, c: item.c, v: item.v } })}
              activeOpacity={0.8}
              className="bg-card border border-line rounded-2xl mb-3 overflow-hidden flex-row"
            >
              <View style={{ width: 6, backgroundColor: HIGHLIGHTS[item.color][colors.isDark ? 'dark' : 'light'] }} />
              <View className="flex-1 p-4">
                <View className="flex-row items-center">
                  <Text className="text-primary font-bold flex-1">{reference}</Text>
                  <TouchableOpacity
                    onPress={() => Share.share({ message: `„${item.text}”\n— ${reference}` })}
                    hitSlop={8}
                    className="mr-4"
                  >
                    <Ionicons name="share-social-outline" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeFavorite(item.key)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <Text className="text-ink mt-1.5 leading-6 text-[15px]">{item.text}</Text>
                <Text className="text-muted text-[11px] mt-2">
                  {formatDate(language, item.at)}
                  {item.lang !== language ? ` · ${item.lang.toUpperCase()}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
