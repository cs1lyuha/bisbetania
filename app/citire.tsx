import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n';
import { HIGHLIGHTS, HighlightColor, useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { useAuth } from '../lib/auth';
import { BOOKS, TRANSLATION_NAME, bookName, formatRef, useBible, verseKey } from '../lib/bible';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';

const FONT_MIN = 14;
const FONT_MAX = 28;

export default function ReaderScreen() {
  const params = useLocalSearchParams<{ b?: string; c?: string; v?: string }>();
  const { t, language } = useLanguage();
  const { colors, settings, updateSettings, serifFont } = useTheme();
  const { highlightOf, setHighlight, setLastRead } = useUserData();
  const insets = useSafeAreaInsets();
  const { data, error } = useBible(language);

  const [pos, setPos] = useState(() => ({
    b: Math.min(Math.max(Number(params.b) || 43, 1), 66),
    c: Math.max(Number(params.c) || 1, 1),
  }));
  const [target, setTarget] = useState<number | null>(Number(params.v) || null);
  const [selected, setSelected] = useState<number[]>([]);
  const [showFont, setShowFont] = useState(false);

  const scrollRef = useRef<ScrollViewInstance>(null);

  const book = BOOKS[pos.b - 1];
  const verses = data?.[pos.b - 1]?.[pos.c - 1] ?? [];

  useEffect(() => {
    setLastRead(pos);
    setSelected([]);
    if (!target) scrollRef.current?.scrollTo({ y: 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos.b, pos.c]);

  const goTo = (delta: 1 | -1) => {
    tap();
    setTarget(null);
    let { b, c } = pos;
    c += delta;
    if (c < 1) {
      if (b === 1) return;
      b -= 1;
      c = BOOKS[b - 1].chapters;
    } else if (c > BOOKS[b - 1].chapters) {
      if (b === 66) return;
      b += 1;
      c = 1;
    }
    setPos({ b, c });
  };

  const toggleVerse = (v: number) => {
    tap();
    setSelected((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v].sort((a, b) => a - b)));
  };

  const selection = useMemo(() => {
    if (!selected.length) return null;
    const contiguous = selected.every((v, i) => i === 0 || v === selected[i - 1] + 1);
    const reference = contiguous
      ? formatRef(language, { b: pos.b, c: pos.c, v: selected[0], ve: selected[selected.length - 1] })
      : `${bookName(pos.b, language)} ${pos.c}:${selected.join(', ')}`;
    const text =
      selected.length === 1
        ? verses[selected[0] - 1]
        : selected.map((v) => `${v} ${verses[v - 1]}`).join('\n');
    return { reference, text };
  }, [selected, verses, pos, language]);

  const applyHighlight = (color: HighlightColor | null) => {
    tap();
    setHighlight(
      selected.map((v) => ({ key: verseKey(language, pos.b, pos.c, v), lang: language, b: pos.b, c: pos.c, v, text: verses[v - 1] })),
      color,
    );
    setSelected([]);
  };

  const copySelection = async () => {
    if (!selection) return;
    await Clipboard.setStringAsync(`${selection.text}\n— ${selection.reference}`);
    success();
    setSelected([]);
  };

  const { session, setFavoriteVerse } = useAuth();
  const [favSaved, setFavSaved] = useState(false);
  const makeFavorite = async () => {
    if (selected.length !== 1) return;
    try {
      await setFavoriteVerse({ lang: language, b: pos.b, c: pos.c, v: selected[0] });
      success();
      setFavSaved(true);
      setTimeout(() => setFavSaved(false), 2000);
    } catch {}
  };

  const shareSelection = () => {
    if (!selection) return;
    Share.share({ message: `„${selection.text}”\n— ${selection.reference} (${TRANSLATION_NAME[language]})` });
  };

  const fontSize = settings.fontSize;

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title={`${book[language]} ${pos.c}`}
        subtitle={TRANSLATION_NAME[language]}
        right={
          <TouchableOpacity
            onPress={() => setShowFont((s) => !s)}
            hitSlop={8}
            className={`w-9 h-9 rounded-full items-center justify-center ${showFont ? 'bg-white' : 'bg-white/15'}`}
          >
            <Text style={{ color: showFont ? colors.primaryDeep : 'white', fontWeight: '700', fontSize: 15 }}>Aa</Text>
          </TouchableOpacity>
        }
      />

      {showFont && (
        <View className="bg-card border-b border-line px-4 py-3 flex-row items-center" style={{ gap: 10 }}>
          <FontButton label="A−" small onPress={() => updateSettings({ fontSize: Math.max(FONT_MIN, fontSize - 1) })} />
          <Text className="text-ink font-bold w-8 text-center">{fontSize}</Text>
          <FontButton label="A+" onPress={() => updateSettings({ fontSize: Math.min(FONT_MAX, fontSize + 1) })} />
          <TouchableOpacity
            onPress={() => updateSettings({ serif: !settings.serif })}
            className={`ml-auto px-4 py-2 rounded-xl border-2 ${settings.serif ? 'border-primary bg-primary-light' : 'border-line'}`}
          >
            <Text className="text-primary font-semibold" style={{ fontFamily: settings.serif ? serifFont : undefined }}>
              {settings.serif ? 'Serif' : 'Sans'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!data ? (
        <View className="flex-1 items-center justify-center px-10">
          {error ? (
            <Text className="text-muted text-center">{t('bibleLoadError')}</Text>
          ) : (
            <>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="text-muted mt-3">{t('loadingBible')}</Text>
            </>
          )}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}>
          <Text className="text-muted text-xs font-bold uppercase tracking-widest text-center">{book[language]}</Text>
          <Text className="text-primary text-5xl font-bold text-center mb-5" style={{ fontFamily: serifFont }}>
            {pos.c}
          </Text>

          {verses.map((text, i) => {
            const v = i + 1;
            const hl = highlightOf(verseKey(language, pos.b, pos.c, v));
            const isSelected = selected.includes(v);
            const isTarget = target === v;
            return (
              <TouchableOpacity
                key={v}
                activeOpacity={0.7}
                onPress={() => toggleVerse(v)}
                onLayout={(e) => {
                  if (isTarget) scrollRef.current?.scrollTo({ y: Math.max(e.nativeEvent.layout.y - 80, 0), animated: true });
                }}
                style={{
                  backgroundColor: hl ? HIGHLIGHTS[hl][colors.isDark ? 'dark' : 'light'] : isTarget ? colors.primaryLight : 'transparent',
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 3,
                  marginHorizontal: -6,
                  marginBottom: 2,
                  borderBottomWidth: isSelected ? 2 : 0,
                  borderStyle: 'dashed',
                  borderColor: colors.primary,
                }}
              >
                <Text className="text-ink" style={{ fontSize, lineHeight: Math.round(fontSize * 1.6), fontFamily: serifFont }}>
                  <Text style={{ fontSize: fontSize * 0.62, color: colors.primary, fontWeight: '700' }}>{v} </Text>
                  {text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Bara de jos: navigare sau acțiuni pentru versetele selectate */}
      <View
        className="absolute left-0 right-0 bottom-0 bg-card border-t border-line px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12, elevation: 12 }}
      >
        {selection ? (
          <>
            <Text className="text-muted text-xs mb-2" numberOfLines={1}>
              {favSaved ? `⭐ ${t('favoriteVerseSaved')}` : selection.reference}
            </Text>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              {(Object.keys(HIGHLIGHTS) as HighlightColor[]).map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => applyHighlight(color)}
                  className="w-9 h-9 rounded-full border border-line"
                  style={{ backgroundColor: HIGHLIGHTS[color][colors.isDark ? 'dark' : 'light'] }}
                />
              ))}
              <TouchableOpacity onPress={() => applyHighlight(null)} className="w-9 h-9 rounded-full border border-line items-center justify-center">
                <Ionicons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>
              <View className="flex-1" />
              <BarIcon icon="copy-outline" onPress={copySelection} color={colors.primary} />
              <BarIcon icon="share-social-outline" onPress={shareSelection} color={colors.primary} />
              {!!session && selected.length === 1 && (
                <BarIcon icon={favSaved ? 'star' : 'star-outline'} onPress={makeFavorite} color={colors.primary} />
              )}
            </View>
          </>
        ) : (
          <View className="flex-row items-center">
            <NavButton icon="chevron-back" disabled={pos.b === 1 && pos.c === 1} onPress={() => goTo(-1)} color={colors.primary} />
            <Text className="flex-1 text-center text-muted text-xs">{t('tapVerseHint')}</Text>
            <NavButton icon="chevron-forward" disabled={pos.b === 66 && pos.c === 22} onPress={() => goTo(1)} color={colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

function FontButton({ label, onPress, small }: { label: string; onPress: () => void; small?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} className="w-11 h-10 rounded-xl bg-primary-light items-center justify-center">
      <Text className="text-primary font-bold" style={{ fontSize: small ? 13 : 17 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function NavButton({ icon, onPress, disabled, color }: { icon: 'chevron-back' | 'chevron-forward'; onPress: () => void; disabled?: boolean; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className="w-12 h-12 rounded-full bg-primary-light items-center justify-center"
      style={{ opacity: disabled ? 0.35 : 1 }}
    >
      <Ionicons name={icon} size={24} color={color} />
    </TouchableOpacity>
  );
}

function BarIcon({ icon, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity onPress={onPress} className="w-10 h-10 rounded-full bg-primary-light items-center justify-center">
      <Ionicons name={icon} size={19} color={color} />
    </TouchableOpacity>
  );
}
