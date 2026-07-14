import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ImageBackground,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { DONATION_LINKS, PRESET_AMOUNTS } from '../config/links';
import LanguageToggle from '../components/LanguageToggle';

export default function HomeScreen() {
  const { t } = useLanguage();
  const router = useRouter();

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
        toolbarColor: '#1A472A',
      });
      router.push('/thank-you');
    } catch {
      Alert.alert(t('errorTitle'), t('errorMessage'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A472A" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <ImageBackground
          source={require('../assets/images/church.png')}
          style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36, overflow: 'hidden', marginTop: -50 }}
          resizeMode="cover"
        >
          <View
            style={{
              backgroundColor: 'rgba(15, 40, 20, 0.58)',
              borderBottomLeftRadius: 36,
              borderBottomRightRadius: 36,
              paddingTop: 120,
            }}
            className="px-5 pb-10"
          >
            <LanguageToggle />

            <View className="items-center mt-8">
              <View
                className="w-16 h-16 rounded-full bg-white/15 items-center justify-center border-2 border-white/40"
                style={{ marginBottom: 12 }}
              >
                <Text style={{ fontSize: 32, lineHeight: 40 }}>✝</Text>
              </View>

              <Text
                className="text-white text-[22px] font-bold text-center tracking-wide"
                style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}
              >
                {t('churchName')}
              </Text>
              <Text
                className="text-white/85 text-base mt-1.5 text-center"
                style={{ textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
              >
                {t('tagline')}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View className="px-5 mt-5">
          <View
            className="bg-white rounded-2xl p-5 border border-stone-100"
            style={{ elevation: 2 }}
          >
            <Text className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              {t('amountLabel')}
            </Text>

            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {PRESET_AMOUNTS.map((amount) => {
                const active = !isCustom && selectedAmount === amount;
                return (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => {
                      setSelectedAmount(amount);
                      setIsCustom(false);
                      setCustomAmount('');
                    }}
                    activeOpacity={0.7}
                    style={{ width: '30%' }}
                    className={`py-3 rounded-xl border-2 items-center ${
                      active ? 'bg-primary border-primary' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-[15px] font-bold ${
                        active ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {amount}
                    </Text>
                    <Text
                      className={`text-[11px] mt-0.5 ${
                        active ? 'text-white/75' : 'text-gray-400'
                      }`}
                    >
                      {t('currency')}
                    </Text>
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
              className={`mt-3 rounded-xl border-2 px-4 py-3 flex-row items-center ${
                isCustom ? 'border-primary bg-primary-light' : 'border-gray-200 bg-gray-50'
              }`}
            >
              {isCustom ? (
                <TextInput
                  className="flex-1 text-gray-800 text-base font-semibold"
                  placeholder={t('customAmountPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  autoFocus
                  maxLength={6}
                />
              ) : (
                <Text className="flex-1 text-gray-400 text-base">
                  {t('customAmount')}
                </Text>
              )}
              <Text
                className={`text-sm font-semibold ${
                  isCustom ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {t('currency')}
              </Text>
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
            className="rounded-2xl py-4 items-center mt-4"
            style={{ elevation: 4, backgroundColor: copied ? '#2d6a4f' : '#1A472A' }}
            activeOpacity={0.85}
          >
            <Text className="text-white text-lg font-bold tracking-wide">
              {copied
                ? `✓  ${getAmount()} ${t('currency')} скопировано`
                : `${t('donateButton')}${getAmount() > 0 ? `  ·  ${getAmount()} ${t('currency')}` : ''}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowQr(v => !v)}
            activeOpacity={0.8}
            className="bg-white rounded-2xl border border-stone-100 mt-4 overflow-hidden"
            style={{ elevation: 2 }}
          >
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                {t('tabQr')}
              </Text>
              <Text className="text-primary font-bold text-base">
                {showQr ? '▲' : '▼'}
              </Text>
            </View>

            {showQr && (
              <View className="items-center pb-5 px-5">
                <View className="rounded-2xl overflow-hidden border border-stone-100 p-3 bg-white" style={{ elevation: 1 }}>
                  <QRCode
                    value={
                      getAmount() > 0
                        ? `${DONATION_LINKS.mia}?amount=${getAmount()}`
                        : DONATION_LINKS.mia
                    }
                    size={200}
                    color="#1A472A"
                    backgroundColor="white"
                  />
                </View>
                {getAmount() > 0 && (
                  <Text className="text-primary font-bold text-base mt-3">
                    {getAmount()} {t('currency')}
                  </Text>
                )}
                <Text className="text-gray-500 text-sm text-center mt-1 leading-5">
                  {t('qrDescription')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/istoria')}
            activeOpacity={0.85}
            className="bg-white rounded-2xl border border-stone-100 mt-4 flex-row items-center px-5 py-4"
            style={{ elevation: 2 }}
          >
            <View
              className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-4"
            >
              <Text style={{ fontSize: 18 }}>🎬</Text>
            </View>
            <Text className="flex-1 text-gray-800 font-semibold text-base">
              {t('historyButton')}
            </Text>
            <Text className="text-primary text-lg font-bold">›</Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-xs mt-5 leading-5 px-4">
            {t('subtitle')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
