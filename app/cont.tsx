import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { TranslationKey } from '../i18n/translations';
import { useTheme } from '../lib/theme';
import { AuthError, useAuth } from '../lib/auth';
import { success, tap } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';

type Mode = 'signIn' | 'signUp';

export default function AccountScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { enabled, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ invite: '', nickname: '', firstName: '', lastName: '', email: '', password: '' });
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError(null);
    const required = mode === 'signIn' ? [form.email, form.password] : Object.values(form);
    if (required.some((v) => !v.trim())) return setError(t('fillAllFields'));
    setBusy(true);
    try {
      if (mode === 'signIn') await signIn(form.email, form.password);
      else await signUp(form);
      success();
      router.replace('/profil');
    } catch (e) {
      setError(t(`auth_error_${e instanceof AuthError ? e.code : 'unknown'}` as TranslationKey));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('accountTitle')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {!enabled ? (
          <View className="bg-card rounded-3xl border border-line p-6 items-center">
            <Ionicons name="time-outline" size={32} color={colors.muted} />
            <Text className="text-muted text-center mt-2">{t('accountsSoon')}</Text>
          </View>
        ) : (
          <>
            <View className="flex-row bg-card rounded-2xl border border-line p-1">
              {(['signIn', 'signUp'] as Mode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    tap();
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl items-center ${mode === m ? 'bg-primary' : ''}`}
                >
                  <Text className={`font-bold ${mode === m ? 'text-white' : 'text-muted'}`}>{t(m)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-ink text-2xl font-bold mt-6">{mode === 'signIn' ? t('signInTitle') : t('signUpTitle')}</Text>
            {mode === 'signUp' && <Text className="text-muted text-sm mt-1 leading-5">{t('signUpHint')}</Text>}

            <View className="mt-5" style={{ gap: 12 }}>
              {mode === 'signUp' && (
                <>
                  <Field icon="key-outline" label={t('inviteCode')} value={form.invite} onChangeText={set('invite')} autoCapitalize="characters" />
                  <Field
                    icon="at-outline"
                    label={t('nickname')}
                    hint={t('nicknameHint')}
                    value={form.nickname}
                    onChangeText={(v) => set('nickname')(v.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    autoCapitalize="none"
                    maxLength={20}
                  />
                  <View className="flex-row" style={{ gap: 12 }}>
                    <View className="flex-1">
                      <Field label={t('firstName')} value={form.firstName} onChangeText={set('firstName')} autoComplete="given-name" maxLength={40} />
                    </View>
                    <View className="flex-1">
                      <Field label={t('lastName')} value={form.lastName} onChangeText={set('lastName')} autoComplete="family-name" maxLength={40} />
                    </View>
                  </View>
                </>
              )}
              <Field icon="mail-outline" label={t('email')} value={form.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
              <Field
                icon="lock-closed-outline"
                label={t('password')}
                hint={mode === 'signUp' ? t('passwordHint') : undefined}
                value={form.password}
                onChangeText={set('password')}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                onSubmitEditing={submit}
              />
            </View>

            {!!error && (
              <View className="flex-row items-center mt-4 bg-red-500/10 rounded-xl px-3 py-2.5">
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text className="text-red-500 text-sm ml-2 flex-1">{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={submit} disabled={busy} activeOpacity={0.85} className="bg-primary rounded-2xl py-4 items-center mt-5" style={{ opacity: busy ? 0.7 : 1 }}>
              {busy ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">{mode === 'signIn' ? t('signIn') : t('createAccount')}</Text>}
            </TouchableOpacity>

            {mode === 'signIn' && <Text className="text-muted text-xs text-center mt-4 leading-5">{t('forgotPassword')}</Text>}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, hint, icon, ...input }: TextInputProps & { label: string; hint?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-1.5 px-1">{label}</Text>
      <View className="flex-row items-center bg-card border border-line rounded-2xl px-4">
        {icon && <Ionicons name={icon} size={17} color={colors.muted} style={{ marginRight: 8 }} />}
        <TextInput className="flex-1 text-ink text-base py-3.5" placeholderTextColor={colors.muted} autoCorrect={false} {...input} />
      </View>
      {!!hint && <Text className="text-muted text-[11px] mt-1 px-1">{hint}</Text>}
    </View>
  );
}
