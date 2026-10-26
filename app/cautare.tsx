import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { SearchHit, fold, formatRef, searchBible, useBible } from '../lib/bible';
import ScreenHeader from '../components/ScreenHeader';

export default function SearchScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useBible(language);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ hits: SearchHit[]; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || query.trim().length < 3) {
      setResult(null);
      return;
    }
    setBusy(true);
    const id = setTimeout(() => {
      setResult(searchBible(data, language, query));
      setBusy(false);
    }, 350);
    return () => clearTimeout(id);
  }, [query, data, language]);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('searchTitle')} />
      <View className="px-4 pt-4">
        <View className="flex-row items-center bg-card border border-line rounded-2xl px-4">
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.muted}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            className="flex-1 text-ink text-base py-3.5 ml-2"
          />
          {busy || (!data && query.length >= 3) ? (
            <ActivityIndicator color={colors.primary} />
          ) : query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
        {result && (
          <Text className="text-muted text-xs mt-3 mb-1">
            {result.total > result.hits.length
              ? `${t('resultsShown')} ${result.hits.length} / ${result.total}`
              : `${t('results')}: ${result.total}`}
          </Text>
        )}
      </View>

      <FlatList
        data={result?.hits ?? []}
        keyExtractor={(h) => `${h.b}:${h.c}:${h.v}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-8">
            <Ionicons name={result ? 'sad-outline' : 'book-outline'} size={44} color={colors.muted} />
            <Text className="text-muted text-center mt-3 leading-5">{result ? t('noResults') : t('searchHint')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/citire', params: { b: item.b, c: item.c, v: item.v } })}
            activeOpacity={0.75}
            className="bg-card border border-line rounded-2xl p-4 mb-2.5"
          >
            <Text className="text-primary font-bold text-sm mb-1">{formatRef(language, item)}</Text>
            <Highlighted text={item.text} query={query} color={colors.primary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

/** Evidențiază prima potrivire; fold() păstrează lungimea textului, deci indicii se potrivesc și fără diacritice. */
function Highlighted({ text, query, color }: { text: string; query: string; color: string }) {
  const q = query.trim();
  const i = fold(text).indexOf(fold(q));
  if (!q || i < 0) return <Text className="text-ink leading-5">{text}</Text>;
  return (
    <Text className="text-ink leading-5">
      {text.slice(0, i)}
      <Text style={{ color, fontWeight: '700' }}>{text.slice(i, i + q.length)}</Text>
      {text.slice(i + q.length)}
    </Text>
  );
}
