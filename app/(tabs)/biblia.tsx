import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { useUserData } from '../../lib/user-data';
import { NEW_TESTAMENT, OLD_TESTAMENT, TRANSLATION_NAME, formatRef } from '../../lib/bible';
import { tap } from '../../lib/haptics';
import ScreenHeader from '../../components/ScreenHeader';

export default function BibleScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { lastRead } = useUserData();
  const [testament, setTestament] = useState<'old' | 'new'>('new');
  const [openBook, setOpenBook] = useState<number | null>(null);

  const books = testament === 'old' ? OLD_TESTAMENT : NEW_TESTAMENT;

  const toggleBook = (id: number) => {
    tap();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenBook((cur) => (cur === id ? null : id));
  };

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title={t('tabBible')}
        subtitle={TRANSLATION_NAME[language]}
        back={false}
        right={
          <View className="flex-row" style={{ gap: 8 }}>
            <HeaderIcon icon="bookmark-outline" onPress={() => router.push('/favorite')} />
            <HeaderIcon icon="search" onPress={() => router.push('/cautare')} />
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {lastRead && (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/citire', params: { b: lastRead.b, c: lastRead.c } })}
            activeOpacity={0.85}
            className="bg-primary rounded-2xl px-5 py-4 flex-row items-center mb-4"
          >
            <Ionicons name="book" size={22} color="white" />
            <View className="flex-1 ml-3">
              <Text className="text-white/75 text-xs">{t('continueReading')}</Text>
              <Text className="text-white font-bold text-base">{formatRef(language, lastRead)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        )}

        <View className="flex-row bg-card border border-line rounded-2xl p-1 mb-4">
          {(['old', 'new'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                tap();
                setTestament(key);
                setOpenBook(null);
              }}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl items-center ${testament === key ? 'bg-primary' : ''}`}
            >
              <Text className={`font-bold text-sm ${testament === key ? 'text-white' : 'text-muted'}`}>
                {key === 'old' ? t('oldTestament') : t('newTestament')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="bg-card rounded-2xl border border-line overflow-hidden">
          {books.map((book, i) => {
            const open = openBook === book.id;
            return (
              <View key={book.id} className={i > 0 ? 'border-t border-line' : ''}>
                <TouchableOpacity onPress={() => toggleBook(book.id)} activeOpacity={0.7} className="flex-row items-center px-4 py-3.5">
                  <View className={`w-8 h-8 rounded-lg items-center justify-center mr-3 ${open ? 'bg-primary' : 'bg-primary-light'}`}>
                    <Text className={`text-xs font-bold ${open ? 'text-white' : 'text-primary'}`}>{book.id}</Text>
                  </View>
                  <Text className={`flex-1 text-[15px] ${open ? 'text-primary font-bold' : 'text-ink font-medium'}`}>{book[language]}</Text>
                  <Text className="text-muted text-xs mr-2">{book.chapters}</Text>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
                </TouchableOpacity>
                {open && (
                  <View className="flex-row flex-wrap px-3 pb-4" style={{ gap: 8 }}>
                    {Array.from({ length: book.chapters }, (_, c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => router.push({ pathname: '/citire', params: { b: book.id, c: c + 1 } })}
                        activeOpacity={0.7}
                        className="w-12 h-11 rounded-xl bg-primary-light items-center justify-center"
                      >
                        <Text className="text-primary font-bold">{c + 1}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function HeaderIcon({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8} activeOpacity={0.7} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
      <Ionicons name={icon} size={19} color="white" />
    </TouchableOpacity>
  );
}
