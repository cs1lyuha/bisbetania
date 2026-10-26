import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { useChurch } from '../lib/church';
import { Occurrence, buildOccurrences, dayKey, sameDay, startOfDay } from '../lib/calendar';
import { MONTH_NAMES, WEEKDAY_SHORT, formatDate, formatDayTitle } from '../lib/format';
import { tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import OccurrenceCard from '../components/OccurrenceCard';

/** Prima zi afișată în grilă: lunea dinaintea (sau din) prima zi a lunii. */
function gridStart(year: number, month: number) {
  const first = new Date(year, month, 1);
  return new Date(year, month, 1 - ((first.getDay() + 6) % 7));
}

export default function CalendarScreen() {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const { services, events, calendars, eventsUpdated } = useChurch();
  const params = useLocalSearchParams<{ date?: string }>();
  const now = new Date();
  const today = startOfDay(now);

  const initial = params.date ? startOfDay(new Date(params.date)) : today;
  const [month, setMonth] = useState({ y: initial.getFullYear(), m: initial.getMonth() });
  const [selected, setSelected] = useState(initial);

  const start = gridStart(month.y, month.m);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 42);

  const byDay = useMemo(() => {
    const map = new Map<string, Occurrence[]>();
    for (const o of buildOccurrences(services, events, language, start, end)) {
      // Evenimentele de mai multe zile (tabere) apar în fiecare zi a lor.
      for (let d = startOfDay(o.start); d < o.end || sameDay(d, o.start); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const key = dayKey(d);
        map.set(key, [...(map.get(key) ?? []), o]);
      }
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, events, language, start.getTime()]);

  const upcoming = useMemo(
    () =>
      buildOccurrences([], events, language, now, new Date(now.getTime() + 60 * 86_400_000))
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, language, today.getTime()],
  );

  const shiftMonth = (delta: number) => {
    tap();
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const goToday = () => {
    tap();
    setMonth({ y: today.getFullYear(), m: today.getMonth() });
    setSelected(today);
  };

  const selectedItems = byDay.get(dayKey(selected)) ?? [];
  const isCurrentMonth = month.y === today.getFullYear() && month.m === today.getMonth();

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader
        title={t('calendarTitle')}
        subtitle={t('calendarSubtitle')}
        right={
          !isCurrentMonth || !sameDay(selected, today) ? (
            <TouchableOpacity onPress={goToday} activeOpacity={0.8} className="bg-white/15 rounded-full px-3.5 py-1.5">
              <Text className="text-white font-bold text-xs">{t('todayButton')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        {/* Luna */}
        <View className="bg-card rounded-3xl border border-line p-3">
          <View className="flex-row items-center justify-between px-1 mb-2">
            <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={10} className="w-9 h-9 rounded-full bg-primary-light items-center justify-center">
              <Ionicons name="chevron-back" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text className="text-ink font-bold text-[17px]">
              {MONTH_NAMES[language][month.m]} {month.y}
            </Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={10} className="w-9 h-9 rounded-full bg-primary-light items-center justify-center">
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View className="flex-row">
            {WEEKDAY_SHORT[language].map((d, i) => (
              <Text key={d} className={`text-center text-[11px] font-bold py-1.5 ${i >= 5 ? 'text-primary' : 'text-muted'}`} style={{ width: `${100 / 7}%` }}>
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {Array.from({ length: 42 }, (_, i) => {
              const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
              const inMonth = day.getMonth() === month.m;
              const isToday = sameDay(day, today);
              const isSelected = sameDay(day, selected);
              const items = byDay.get(dayKey(day)) ?? [];
              const hasEvent = items.some((o) => o.kind === 'event');
              const hasService = items.some((o) => o.kind === 'service');
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    tap();
                    setSelected(day);
                    if (!inMonth) setMonth({ y: day.getFullYear(), m: day.getMonth() });
                  }}
                  activeOpacity={0.7}
                  style={{ width: `${100 / 7}%` }}
                  className="items-center py-1"
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${isSelected ? 'bg-primary' : isToday ? 'bg-primary-light' : ''}`}
                  >
                    <Text
                      className={`text-[15px] ${isSelected ? 'text-white font-bold' : isToday ? 'text-primary font-bold' : inMonth ? 'text-ink' : 'text-muted/50'}`}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  <View className="flex-row h-1.5 mt-0.5" style={{ gap: 3 }}>
                    {hasEvent && <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.primary, opacity: inMonth ? 1 : 0.4 }} />}
                    {hasService && <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.muted, opacity: inMonth ? 0.7 : 0.3 }} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row items-center justify-center mt-2 mb-1" style={{ gap: 16 }}>
            <Legend color={colors.primary} label={calendars?.[0]?.name[language] ?? t('upcomingEvents')} />
            <Legend color={colors.muted} label={t('weeklyService')} />
          </View>
        </View>

        {/* Ziua aleasă */}
        <Text className="text-ink font-bold text-base mt-5 mb-2 px-1">{formatDayTitle(language, selected)}</Text>
        <View className="bg-card rounded-2xl border border-line overflow-hidden">
          {selectedItems.length ? (
            selectedItems.map((o, i) => <OccurrenceCard key={o.key} item={o} first={i === 0} now={now} />)
          ) : (
            <View className="items-center py-6">
              <Ionicons name="cafe-outline" size={26} color={colors.muted} />
              <Text className="text-muted text-sm mt-2">{t('nothingPlanned')}</Text>
            </View>
          )}
        </View>

        {/* În curând */}
        {upcoming.length > 0 && (
          <>
            <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mt-6 mb-2 px-1">{t('upcomingEvents')}</Text>
            <View className="bg-card rounded-2xl border border-line overflow-hidden">
              {upcoming.map((o, i) => (
                <OccurrenceCard key={o.key} item={o} first={i === 0} now={now} dateLabel={formatDayTitle(language, o.start)} />
              ))}
            </View>
          </>
        )}

        {/* Abonare */}
        {calendars?.filter((c) => c.subscribe).map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => WebBrowser.openBrowserAsync(c.subscribe!, { toolbarColor: colors.primaryDeep })}
            activeOpacity={0.85}
            className="mt-5 rounded-2xl border-2 border-primary flex-row items-center justify-center py-3.5"
          >
            <Ionicons name="logo-google" size={17} color={colors.primary} />
            <Text className="text-primary font-bold ml-2">{t('subscribeCalendar')}</Text>
          </TouchableOpacity>
        ))}
        {!!eventsUpdated && (
          <Text className="text-muted text-[11px] text-center mt-3">
            {t('calendarUpdated')}: {formatDate(language, new Date(eventsUpdated))}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
      <Text className="text-muted text-[11px]">{label}</Text>
    </View>
  );
}
