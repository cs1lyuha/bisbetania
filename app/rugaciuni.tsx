import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Share, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { formatDate } from '../lib/format';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';

export default function PrayersScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { prayers, addPrayer, toggleAnswered, removePrayer } = useUserData();
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<'open' | 'answered'>('open');

  const shown = prayers.filter((p) => (filter === 'open' ? !p.answeredAt : !!p.answeredAt));
  const answeredCount = prayers.filter((p) => p.answeredAt).length;

  const submit = () => {
    if (!draft.trim()) return;
    success();
    addPrayer(draft);
    setDraft('');
    setFilter('open');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('prayersTitle')} subtitle={t('prayersSubtitle')} />

      <View className="px-4 pt-4">
        <TouchableOpacity
          onPress={() => router.push('/perete')}
          activeOpacity={0.85}
          className="flex-row items-center rounded-2xl px-4 py-3 mb-3"
          style={{ backgroundColor: colors.primaryDeep }}
        >
          <Ionicons name="hand-left-outline" size={18} color="white" />
          <Text className="flex-1 text-white font-semibold ml-2">{t('openWall')}</Text>
          <Ionicons name="chevron-forward" size={18} color="white" />
        </TouchableOpacity>
        <View className="bg-card border border-line rounded-2xl p-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('prayerPlaceholder')}
            placeholderTextColor={colors.muted}
            multiline
            className="text-ink text-base min-h-[64px] px-1"
            style={{ textAlignVertical: 'top' }}
          />
          <View className="flex-row items-center justify-end mt-2" style={{ gap: 8 }}>
            <TouchableOpacity
              disabled={!draft.trim()}
              onPress={() => Share.share({ message: `${t('prayerShareIntro')}\n\n${draft.trim()}` })}
              className="px-4 py-2.5 rounded-xl border-2 border-line flex-row items-center"
              style={{ opacity: draft.trim() ? 1 : 0.4 }}
            >
              <Ionicons name="paper-plane-outline" size={16} color={colors.primary} />
              <Text className="text-primary font-semibold ml-1.5">{t('sendToChurch')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!draft.trim()}
              onPress={submit}
              className="px-4 py-2.5 rounded-xl bg-primary flex-row items-center"
              style={{ opacity: draft.trim() ? 1 : 0.4 }}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-bold ml-1">{t('save')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row mt-4 bg-card border border-line rounded-2xl p-1">
          {(['open', 'answered'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                tap();
                setFilter(key);
              }}
              className={`flex-1 py-2 rounded-xl items-center ${filter === key ? 'bg-primary' : ''}`}
            >
              <Text className={`font-bold text-sm ${filter === key ? 'text-white' : 'text-muted'}`}>
                {key === 'open' ? `${t('prayerOpen')} (${prayers.length - answeredCount})` : `${t('prayerAnswered')} (${answeredCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="items-center mt-12 px-10">
            <Text style={{ fontSize: 40 }}>{filter === 'open' ? '🙏' : '✨'}</Text>
            <Text className="text-muted text-center mt-3 leading-5">
              {filter === 'open' ? t('noPrayers') : t('noAnswered')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-card border border-line rounded-2xl p-4 mb-3">
            <Text className="text-ink text-[15px] leading-6">{item.text}</Text>
            <View className="flex-row items-center mt-3">
              <Text className="text-muted text-xs flex-1">
                {formatDate(language, item.at)}
                {item.answeredAt ? ` → ✓ ${formatDate(language, item.answeredAt)}` : ''}
              </Text>
              <TouchableOpacity onPress={() => removePrayer(item.id)} hitSlop={8} className="mr-4">
                <Ionicons name="trash-outline" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  success();
                  toggleAnswered(item.id);
                }}
                className={`flex-row items-center px-3 py-1.5 rounded-full ${item.answeredAt ? 'bg-primary' : 'bg-primary-light'}`}
              >
                <Ionicons name={item.answeredAt ? 'checkmark-done' : 'checkmark'} size={15} color={item.answeredAt ? 'white' : colors.primary} />
                <Text className={`text-xs font-bold ml-1 ${item.answeredAt ? 'text-white' : 'text-primary'}`}>
                  {item.answeredAt ? t('answered') : t('markAnswered')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}
