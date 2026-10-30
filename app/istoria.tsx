import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../i18n';
import { useTheme } from '../lib/theme';
import ScreenHeader from '../components/ScreenHeader';

const VIDEOS = [
  { id: '6FCaOdwi1rA', titleKey: 'video1Title' as const },
  { id: '5CYWn0CrRw8', titleKey: 'video2Title' as const },
  { id: 'DlbZKmTy3go', titleKey: 'video3Title' as const },
  { id: '8NrPBR3Sxgw', titleKey: 'video4Title' as const },
];

export default function IstoriaScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const playerHeight = Math.round((width - 40) * 9 / 16);

  return (
    <View className="flex-1 bg-cream">
      <ScreenHeader title={t('historyTitle')} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="px-5 mt-5">
          <View
            className="rounded-2xl overflow-hidden bg-black"
            style={{ elevation: 4 }}
          >
            <YoutubeIframe
              height={playerHeight}
              width={width - 40}
              videoId={VIDEOS[selectedIndex].id}
              play={playing}
              onChangeState={(state: string) => {
                if (state === 'ended') setPlaying(false);
              }}
            />
          </View>

          <Text className="text-primary text-base font-bold mt-3 text-center">
            {t(VIDEOS[selectedIndex].titleKey)}
          </Text>
        </View>

        <View className="px-5 mt-5">
          <Text className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3">
            {t('historyTitle')}
          </Text>

          {VIDEOS.map((video, index) => {
            const isActive = index === selectedIndex;
            return (
              <TouchableOpacity
                key={video.id}
                onPress={() => {
                  setSelectedIndex(index);
                  setPlaying(true);
                }}
                activeOpacity={0.75}
                className={`flex-row items-center rounded-2xl mb-3 border-2 p-4 ${
                  isActive
                    ? 'bg-primary border-primary'
                    : 'bg-card border-line'
                }`}
                style={{ elevation: isActive ? 3 : 1 }}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                    isActive ? 'bg-white/20' : 'bg-primary-light'
                  }`}
                >
                  {isActive ? (
                    <Ionicons name="play" size={18} color="white" />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{index + 1}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-[15px] font-bold ${
                      isActive ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {t(video.titleKey)}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${
                      isActive ? 'text-white/70' : 'text-muted'
                    }`}
                  >
                    YouTube Live
                  </Text>
                </View>
                {isActive && <Ionicons name="checkmark" size={20} color="white" />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
