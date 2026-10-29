import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../i18n';
import { useTheme } from '../../lib/theme';
import { tap } from '../../lib/haptics';
import { DONATION_LINKS, PRESET_AMOUNTS } from '../../config/links';
import LanguageToggle from '../../components/LanguageToggle';
import StatusBarScrim from '../../components/StatusBarScrim';
import Hero from '../../components/Hero';
import { useTabBarSpace } from '../../components/GlassTabBar';

export default function DonateScreen() {
  // Loc sub conținut pentru bara de taburi plutitoare.
  const tabSpace = useTabBarSpace();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [showQr, setShowQr] = useState(true);
  const [copied, setCopied] = useState(false);

  const getAmount = (): number => {
    if (isCustom) return Number(customAmount) || 0;
    return selectedAmount;
  };

  const handleDonate = async () => {
    const amount = getAmount();
    if (amount <= 0) {
      Alert.alert(t('errorTitle'), t('selectAmount'));
      return;
    }
    await Clipboard.setStringAsync(String(amount));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    try {
      await WebBrowser.openBrowserAsync(`${DONATION_LINKS.mia}?amount=${amount}`, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        showTitle: false,
        toolbarColor: colors.primaryDeep,
      });
      router.push('/thank-you');
    } catch {
      Alert.alert(t('errorTitle'), t('errorMessage'));
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <Hero scrollY={scrollY} fadeHeight={90}>
          <View style={{ paddingTop: insets.top + 12 }} className="px-5 pb-14">
            <LanguageToggle />

            <View className="items-center mt-4">
              <View className="w-16 h-16 rounded-full bg-white/15 items-center justify-center border-2 border-white/40 mb-3">
                <Ionicons name="heart" size={28} color="white" />
              </View>
              <Text
                className="text-white text-[22px] font-bold text-center tracking-wide"
                style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
              >
                {t('churchName')}
              </Text>
              <Text className="text-white/85 text-base mt-1.5 text-center">{t('tagline')}</Text>
            </View>
          </View>
        </Hero>

        <View className="px-5 -mt-6">
          <View className="bg-card rounded-2xl p-5 border border-line" style={{ elevation: 2 }}>
            <Text className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-4">{t('amountLabel')}</Text>

            <View className="flex-row" style={{ gap: 8 }}>
              {PRESET_AMOUNTS.map((amount) => {
                const active = !isCustom && selectedAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      tap();
                      setSelectedAmount(amount);
                      setIsCustom(false);
                      setCustomAmount('');
                    }}
                    activeOpacity={0.7}
                    className={`flex-1 py-3 rounded-xl border-2 items-center ${active ? 'bg-primary border-primary' : 'bg-card border-line'}`}
                  >
                    <Text className={`text-[15px] font-bold ${active ? 'text-white' : 'text-ink'}`}>{amount}</Text>
                    <Text className={`text-[11px] mt-0.5 ${active ? 'text-white/75' : 'text-muted'}`}>{t('currency')}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsCustom(true);
                setSelectedAmount(0);
              }}
              activeOpacity={1}
              className={`mt-3 rounded-xl border-2 px-4 py-3 flex-row items-center ${isCustom ? 'border-primary bg-primary-light' : 'border-line bg-cream'}`}
            >
              {isCustom ? (
                <TextInput
                  className="flex-1 text-ink text-base font-semibold"
                  placeholder={t('customAmountPlaceholder')}
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={(v) => setCustomAmount(v.replace(/[^0-9]/g, ''))}
                  autoFocus
                  maxLength={6}
                />
              ) : (
                <Text className="flex-1 text-muted text-base">{t('customAmount')}</Text>
              )}
              <Text className={`text-sm font-semibold ${isCustom ? 'text-primary' : 'text-muted'}`}>{t('currency')}</Text>
            </TouchableOpacity>

            {getAmount() > 0 && (
              <View className="mt-4 items-center">
                <Text className="text-primary text-3xl font-bold">
                  {getAmount()} {t('currency')}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleDonate}
            className="rounded-2xl py-4 items-center mt-4 flex-row justify-center"
            style={{ elevation: 4, backgroundColor: copied ? colors.primary : colors.primaryDeep }}
            activeOpacity={0.85}
          >
            <Ionicons name={copied ? 'checkmark-circle' : 'heart'} size={20} color="white" />
            <Text className="text-white text-lg font-bold tracking-wide ml-2">
              {copied
                ? `${getAmount()} ${t('currency')} ${t('copied')}`
                : `${t('donateButton')}${getAmount() > 0 ? `  ·  ${getAmount()} ${t('currency')}` : ''}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowQr((v) => !v)}
            activeOpacity={0.8}
            className="bg-card rounded-2xl border border-line mt-4 overflow-hidden"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center justify-between px-5 py-4">
              <View className="flex-row items-center">
                <Ionicons name="qr-code-outline" size={16} color={colors.muted} />
                <Text className="text-[11px] font-semibold text-muted uppercase tracking-widest ml-2">{t('tabQr')}</Text>
              </View>
              <Ionicons name={showQr ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
            </View>

            {showQr && (
              <View className="items-center pb-5 px-5">
                <View className="rounded-2xl overflow-hidden p-3 bg-white">
                  <QRCode
                    value={getAmount() > 0 ? `${DONATION_LINKS.mia}?amount=${getAmount()}` : DONATION_LINKS.mia}
                    size={200}
                    color={colors.primaryDeep}
                    backgroundColor="white"
                  />
                </View>
                {getAmount() > 0 && (
                  <Text className="text-primary font-bold text-base mt-3">
                    {getAmount()} {t('currency')}
                  </Text>
                )}
                <Text className="text-muted text-sm text-center mt-1 leading-5">{t('qrDescription')}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="bg-primary-light rounded-2xl p-4 mt-4">
            <Text className="text-primary text-sm leading-5 text-center italic">{t('givingVerse')}</Text>
          </View>

          <Text className="text-center text-muted text-xs mt-5 leading-5 px-4">{t('subtitle')}</Text>
        </View>
      </Animated.ScrollView>
      <StatusBarScrim />
    </KeyboardAvoidingView>
  );
}
