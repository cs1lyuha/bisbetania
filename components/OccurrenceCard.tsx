import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import { Occurrence, formatTime } from '../lib/calendar';
import { timeUntil } from '../lib/format';

interface Props {
  item: Occurrence;
  /** Arată și data (în listele care cuprind mai multe zile). */
  dateLabel?: string;
  now?: Date;
  first?: boolean;
}

/** Un rând din calendar: ora, titlul, tema serii; la atingere se deschid detaliile. */
export default function OccurrenceCard({ item, dateLabel, now = new Date(), first = true }: Props) {
  const { t, language } = useLanguage();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const expandable = !!(item.details || item.location);
  const live = !item.allDay && item.start <= now && item.end > now;
  const soon = !live && item.start > now && item.start.getTime() - now.getTime() < 7 * 86_400_000;
  const past = item.end <= now;

  return (
    <TouchableOpacity
      activeOpacity={expandable ? 0.75 : 1}
      onPress={() => {
        if (!expandable) return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpen((v) => !v);
      }}
      className={`flex-row px-4 py-3.5 ${first ? '' : 'border-t border-line'}`}
      style={{ opacity: past ? 0.55 : 1 }}
    >
      <View className="w-14 pt-0.5">
        {item.allDay ? (
          <Ionicons name="sunny-outline" size={18} color={colors.primary} />
        ) : (
          <Text className="text-primary font-bold text-base">{formatTime(item.start)}</Text>
        )}
      </View>
      <View className="w-[3px] rounded-full mr-3" style={{ backgroundColor: item.kind === 'event' ? colors.primary : colors.line }} />
      <View className="flex-1">
        {!!dateLabel && <Text className="text-muted text-[11px] font-semibold uppercase tracking-wide mb-0.5">{dateLabel}</Text>}
        <View className="flex-row items-center">
          <Text className="flex-1 text-ink font-bold text-[15px]">{item.title}</Text>
          {live ? (
            <View className="bg-primary rounded-full px-2.5 py-0.5 flex-row items-center ml-2">
              <View className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1" />
              <Text className="text-white text-[10px] font-bold">{t('happeningNow')}</Text>
            </View>
          ) : soon ? (
            <Text className="text-primary text-[11px] font-bold ml-2">{timeUntil(language, item.start, now)}</Text>
          ) : null}
        </View>
        {!!item.subtitle && <Text className="text-ink/80 text-sm mt-0.5 leading-5">{item.subtitle}</Text>}
        {item.allDay && <Text className="text-muted text-xs mt-0.5">{t('allDay')}</Text>}
        {item.kind === 'service' && <Text className="text-muted text-xs mt-0.5">{t('weeklyService')}</Text>}
        {open && (
          <View className="mt-2">
            {!!item.details && <Text className="text-muted text-sm leading-5">{item.details}</Text>}
            {!!item.location && (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="location-outline" size={14} color={colors.muted} />
                <Text className="text-muted text-xs ml-1">{item.location}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      {expandable && (
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} style={{ marginLeft: 6, marginTop: 3 }} />
      )}
    </TouchableOpacity>
  );
}
