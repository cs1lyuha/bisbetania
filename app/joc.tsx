import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { TranslationKey } from '../i18n/translations';
import { useTheme } from '../lib/theme';
import { useUserData } from '../lib/user-data';
import { GAMES, GameId, MemoryVerse, bare, chunks, findVerse, getWeeklyVerse, isMastered, pickBlanks, shuffle, starsFor, words } from '../lib/memory';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Stars from '../components/Stars';

const same = (a: string, b: string) => bare(a).toLowerCase() === bare(b).toLowerCase();

/** „Domnul,” → „______,” (punctuația rămâne la locul ei) */
function masked(word: string) {
  const core = bare(word);
  const start = word.indexOf(core);
  return `${word.slice(0, start)}${'_'.repeat(Math.max(3, core.length))}${word.slice(start + core.length)}`;
}

/** Mică vibrație a unui buton când alegerea e greșită. */
function useShake() {
  const value = useRef(new Animated.Value(0)).current;
  const shake = () => {
    value.setValue(0);
    Animated.sequence(
      [8, -8, 6, -6, 0].map((toValue) => Animated.timing(value, { toValue, duration: 45, useNativeDriver: true })),
    ).start();
  };
  return { shake, style: { transform: [{ translateX: value }] } };
}

export default function GameScreen() {
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ game?: string; id?: string }>();
  const game = (GAMES.includes(params.game as GameId) ? params.game : 'fill') as GameId;
  const verse = (params.id && findVerse(language, params.id)) || getWeeklyVerse(language);
  const [round, setRound] = useState(0);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t(`game_${game}` as TranslationKey)} subtitle={verse.reference} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {game === 'fill' && <FillGame key={round} verse={verse} onAgain={() => setRound((r) => r + 1)} />}
        {game === 'order' && <OrderGame key={round} verse={verse} onAgain={() => setRound((r) => r + 1)} />}
        {game === 'recall' && <RecallGame key={round} verse={verse} onAgain={() => setRound((r) => r + 1)} />}
      </ScrollView>
    </View>
  );
}

interface GameProps {
  verse: MemoryVerse;
  onAgain: () => void;
}

// ---------- Completează ----------

function FillGame({ verse, onAgain }: GameProps) {
  const { t } = useLanguage();
  const { colors, serifFont } = useTheme();
  const tokens = useMemo(() => words(verse.text), [verse.text]);
  const blanks = useMemo(() => pickBlanks(tokens), [tokens]);
  const bank = useMemo(() => shuffle(blanks), [blanks]);
  const [filled, setFilled] = useState(0);
  const [used, setUsed] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const { shake, style: shakeStyle } = useShake();
  const done = filled >= blanks.length;

  const choose = (index: number) => {
    if (same(tokens[index], tokens[blanks[filled]])) {
      tap();
      setUsed((u) => [...u, index]);
      setFilled((f) => f + 1);
      setWrong(null);
    } else {
      setMistakes((m) => m + 1);
      setWrong(index);
      shake();
    }
  };

  return (
    <>
      <View className="bg-card rounded-3xl border border-line p-5">
        <Text className="text-ink text-[19px] leading-[34px]" style={{ fontFamily: serifFont }}>
          {tokens.map((w, i) => {
            const pos = blanks.indexOf(i);
            if (pos < 0 || pos < filled) {
              return (
                <Text key={i} style={pos >= 0 ? { color: colors.primary, fontWeight: '700' } : undefined}>
                  {w}{' '}
                </Text>
              );
            }
            const current = pos === filled;
            return (
              <Text key={i} style={{ color: current ? colors.primary : colors.muted }}>
                {masked(w)}{' '}
              </Text>
            );
          })}
        </Text>
      </View>

      {done ? (
        <Result game="fill" verse={verse} stars={starsFor(mistakes)} detail={`${t('mistakes')}: ${mistakes}`} onAgain={onAgain} />
      ) : (
        <>
          <Text className="text-muted text-sm text-center mt-5 mb-3">{t('tapNextWord')}</Text>
          <View className="flex-row flex-wrap justify-center" style={{ gap: 8 }}>
            {bank.map((index) =>
              used.includes(index) ? null : (
                <Animated.View key={index} style={wrong === index ? shakeStyle : undefined}>
                  <TouchableOpacity
                    onPress={() => choose(index)}
                    activeOpacity={0.8}
                    className={`px-4 py-2.5 rounded-xl border-2 ${wrong === index ? 'border-red-400' : 'border-primary bg-primary-light'}`}
                  >
                    <Text className="text-primary font-bold text-base">{bare(tokens[index])}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ),
            )}
          </View>
        </>
      )}
    </>
  );
}

// ---------- Ordonează ----------

function OrderGame({ verse, onAgain }: GameProps) {
  const { t } = useLanguage();
  const { serifFont } = useTheme();
  const parts = useMemo(() => chunks(words(verse.text)), [verse.text]);
  const order = useMemo(() => shuffle(parts.map((_, i) => i)), [parts]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const { shake, style: shakeStyle } = useShake();
  const done = placed.length === parts.length;

  const choose = (index: number) => {
    if (parts[index] === parts[placed.length]) {
      tap();
      setPlaced((p) => [...p, index]);
      setWrong(null);
    } else {
      setMistakes((m) => m + 1);
      setWrong(index);
      shake();
    }
  };

  return (
    <>
      <View className="bg-card rounded-3xl border border-line p-5" style={{ minHeight: 120 }}>
        <Text className="text-ink text-[19px] leading-[30px]" style={{ fontFamily: serifFont }}>
          {placed.map((i) => parts[i]).join(' ')}
          {!done && <Text className="text-muted"> …</Text>}
        </Text>
      </View>

      {done ? (
        <Result game="order" verse={verse} stars={starsFor(mistakes)} detail={`${t('mistakes')}: ${mistakes}`} onAgain={onAgain} />
      ) : (
        <>
          <Text className="text-muted text-sm text-center mt-5 mb-3">{t('tapNextPart')}</Text>
          <View style={{ gap: 8 }}>
            {order.map((index) =>
              placed.includes(index) ? null : (
                <Animated.View key={index} style={wrong === index ? shakeStyle : undefined}>
                  <TouchableOpacity
                    onPress={() => choose(index)}
                    activeOpacity={0.8}
                    className={`px-4 py-3 rounded-xl border-2 ${wrong === index ? 'border-red-400' : 'border-line bg-card'}`}
                  >
                    <Text className="text-ink text-base" style={{ fontFamily: serifFont }}>
                      {parts[index]}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ),
            )}
          </View>
        </>
      )}
    </>
  );
}

// ---------- Din memorie ----------

function RecallGame({ verse, onAgain }: GameProps) {
  const { t } = useLanguage();
  const { colors, serifFont } = useTheme();
  const tokens = useMemo(() => words(verse.text), [verse.text]);
  const [revealed, setRevealed] = useState(0);
  const [checked, setChecked] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

  // „Pot totul în Hristos,” → „P. t. î. H.,” (punctuația rămâne ca reper)
  const hint = (w: string) => {
    const core = bare(w);
    const start = w.indexOf(core);
    return `${w.slice(0, start)}${core.charAt(0)}${w.slice(start + core.length)}`;
  };

  if (stars !== null) {
    return <Result game="recall" verse={verse} stars={stars} detail={`${t('hintsUsed')}: ${revealed}`} onAgain={onAgain} />;
  }

  return (
    <>
      <View className="bg-card rounded-3xl border border-line p-5">
        <Text className="text-ink text-[20px] leading-[34px]" style={{ fontFamily: serifFont }}>
          {tokens.map((w, i) => (
            <Text key={i} style={i < revealed || checked ? { color: colors.primary } : undefined}>
              {i < revealed || checked ? w : hint(w)}{' '}
            </Text>
          ))}
        </Text>
      </View>
      <Text className="text-muted text-sm text-center mt-4 leading-5 px-4">{checked ? t('didYouKnow') : t('recallHint')}</Text>

      {checked ? (
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <TouchableOpacity onPress={onAgain} activeOpacity={0.85} className="flex-1 rounded-xl py-3.5 items-center border-2 border-line">
            <Text className="text-ink font-bold">{t('notYet')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStars(revealed === 0 ? 3 : revealed <= Math.ceil(tokens.length / 5) ? 2 : 1)}
            activeOpacity={0.85}
            className="flex-1 rounded-xl py-3.5 items-center bg-primary"
          >
            <Text className="text-white font-bold">{t('yesKnew')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row mt-4" style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              tap();
              setRevealed((r) => Math.min(tokens.length, r + 1));
            }}
            activeOpacity={0.85}
            className="flex-1 rounded-xl py-3.5 items-center border-2 border-primary flex-row justify-center"
          >
            <Ionicons name="eye-outline" size={17} color={colors.primary} />
            <Text className="text-primary font-bold ml-1.5">{t('revealWord')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChecked(true)} activeOpacity={0.85} className="flex-1 rounded-xl py-3.5 items-center bg-primary">
            <Text className="text-white font-bold">{t('check')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ---------- Rezultat ----------

function Result({ game, verse, stars, detail, onAgain }: { game: GameId; verse: MemoryVerse; stars: number; detail: string; onAgain: () => void }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { memory, saveGameResult } = useUserData();
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    saveGameResult(verse.id, game, stars);
    success();
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    // Rezultatul se salvează o singură dată, când apare.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = { ...memory[verse.id], [game]: Math.max(memory[verse.id]?.[game] ?? 0, stars) };
  const next = GAMES.find((g) => !(score[g] ?? 0));
  const mastered = isMastered(score);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View className="bg-card rounded-3xl border border-line p-6 mt-4 items-center">
        <Ionicons name={mastered ? 'trophy' : 'ribbon-outline'} size={40} color={colors.primary} />
        <Text className="text-ink text-xl font-bold mt-2">{mastered && !next ? t('allGamesDone') : t('wellDone')}</Text>
        <View className="mt-3">
          <Stars count={stars} size={30} color={colors.primary} />
        </View>
        <Text className="text-muted text-sm mt-2">{detail}</Text>

        <View className="flex-row mt-5 self-stretch" style={{ gap: 10 }}>
          <TouchableOpacity onPress={onAgain} activeOpacity={0.85} className="flex-1 rounded-xl py-3 items-center border-2 border-line">
            <Text className="text-ink font-bold">{t('playAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (next ? router.replace({ pathname: '/joc', params: { game: next, id: verse.id } }) : router.back())}
            activeOpacity={0.85}
            className="flex-1 rounded-xl py-3 items-center bg-primary"
          >
            <Text className="text-white font-bold">{next ? t('nextGame') : t('backToMemory')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
