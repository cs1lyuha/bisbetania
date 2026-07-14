import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';

const VIDEOS = [
  { id: '6FCaOdwi1rA', titleKey: 'video1Title' as const },
  { id: '5CYWn0CrRw8', titleKey: 'video2Title' as const },
  { id: 'DlbZKmTy3go', titleKey: 'video3Title' as const },
  { id: '8NrPBR3Sxgw', titleKey: 'video4Title' as const },
];

export default function IstoriaScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const playerHeight = Math.round((width - 40) * 9 / 16);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A472A" />

      <View
        style={{ backgroundColor: '#1A472A', paddingTop: 54, paddingBottom: 20 }}
        className="px-5 flex-row items-center"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: 12, padding: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 22 }}>‹</Text>
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-[18px] font-bold" numberOfLines={1}>
            {t('historyTitle')}
          </Text>
        </View>
      </View>

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
          <Text className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
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
                    : 'bg-white border-stone-100'
                }`}
                style={{ elevation: isActive ? 3 : 1 }}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                    isActive ? 'bg-white/20' : 'bg-primary/10'
                  }`}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      color: isActive ? 'white' : '#1A472A',
                    }}
                  >
                    {isActive ? '▶' : `${index + 1}`}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-[15px] font-bold ${
                      isActive ? 'text-white' : 'text-gray-800'
                    }`}
                  >
                    {t(video.titleKey)}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${
                      isActive ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    YouTube Live
                  </Text>
                </View>
                {isActive && (
                  <Text style={{ color: 'white', fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
