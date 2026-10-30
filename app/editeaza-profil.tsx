import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useLanguage } from '../i18n';
import { TranslationKey } from '../i18n/translations';
import { useTheme } from '../lib/theme';
import { AuthError, useAuth } from '../lib/auth';
import { fullName } from '../lib/supabase';
import { formatRef } from '../lib/bible';
import { success } from '../lib/haptics';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';

export default function EditProfileScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { profile, updateProfile, uploadAvatar, setFavoriteVerse, signOut, deleteAccount } = useAuth();
  const [form, setForm] = useState({ nickname: '', first_name: '', last_name: '', bio: '' });
  const [busy, setBusy] = useState<'save' | 'photo' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) setForm({ nickname: profile.nickname, first_name: profile.first_name, last_name: profile.last_name, bio: profile.bio });
  }, [profile]);

  if (!profile) return <View className="flex-1 bg-cream" />;

  const fail = (e: unknown) => setError(t(`auth_error_${e instanceof AuthError ? e.code : 'unknown'}` as TranslationKey));

  const pickPhoto = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(t('photoPermission'));
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (result.canceled || !result.assets[0]) return;
    setBusy('photo');
    try {
      await uploadAvatar(result.assets[0].uri, result.assets[0].mimeType ?? 'image/jpeg');
      success();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setError(null);
    setBusy('save');
    try {
      await updateProfile({
        nickname: form.nickname.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        bio: form.bio.trim(),
      });
      success();
      router.back();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () =>
    Alert.alert(t('deleteAccount'), t('deleteAccountConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/');
          } catch (e) {
            fail(e);
          }
        },
      },
    ]);

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('editProfile')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View className="items-center">
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8} disabled={!!busy}>
            <Avatar url={profile.avatar_url} name={fullName(profile)} size={104} />
            <View className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary items-center justify-center border-2 border-cream">
              {busy === 'photo' ? <ActivityIndicator color="white" size="small" /> : <Ionicons name="camera" size={17} color="white" />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickPhoto} disabled={!!busy} className="mt-2">
            <Text className="text-primary font-bold text-sm">{t('changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6" style={{ gap: 12 }}>
          <Input label={t('nickname')} hint={t('nicknameHint')} value={form.nickname} maxLength={20} autoCapitalize="none"
            onChangeText={(v) => setForm((f) => ({ ...f, nickname: v.toLowerCase().replace(/[^a-z0-9_.]/g, '') }))} />
          <View className="flex-row" style={{ gap: 12 }}>
            <View className="flex-1">
              <Input label={t('firstName')} value={form.first_name} maxLength={40} onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))} />
            </View>
            <View className="flex-1">
              <Input label={t('lastName')} value={form.last_name} maxLength={40} onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))} />
            </View>
          </View>
          <Input
            label={t('bio')}
            hint={`${form.bio.length}/160`}
            value={form.bio}
            placeholder={t('bioPlaceholder')}
            maxLength={160}
            multiline
            onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
          />
        </View>

        {/* Versetul preferat se alege din Biblie, cu ⭐ în bara de selecție. */}
        <View className="bg-card rounded-2xl border border-line p-4 mt-4 flex-row items-center">
          <Ionicons name="star" size={18} color={colors.primary} />
          <View className="flex-1 ml-3">
            <Text className="text-muted text-[11px] font-bold uppercase tracking-widest">{t('favoriteVerse')}</Text>
            <Text className="text-ink font-semibold mt-0.5">
              {profile.favorite_verse ? formatRef(profile.favorite_verse.lang, profile.favorite_verse) : t('chooseFavoriteVerse')}
            </Text>
          </View>
          {profile.favorite_verse ? (
            <TouchableOpacity onPress={() => setFavoriteVerse(null).catch(fail)} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push('/biblia')} hitSlop={8}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {!!error && (
          <View className="flex-row items-center mt-4 bg-red-500/10 rounded-xl px-3 py-2.5">
            <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
            <Text className="text-red-500 text-sm ml-2 flex-1">{error}</Text>
          </View>
        )}

        <TouchableOpacity onPress={save} disabled={!!busy} activeOpacity={0.85} className="bg-primary rounded-2xl py-4 items-center mt-5">
          {busy === 'save' ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">{t('save')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            await signOut();
            router.replace('/');
          }}
          className="rounded-2xl py-3.5 items-center mt-3 border-2 border-line flex-row justify-center"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.ink} />
          <Text className="text-ink font-bold ml-2">{t('signOut')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} className="items-center mt-6">
          <Text className="text-red-500 text-sm">{t('deleteAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({ label, hint, ...props }: React.ComponentProps<typeof TextInput> & { label: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text className="text-muted text-[11px] font-bold uppercase tracking-widest mb-1.5 px-1">{label}</Text>
      <TextInput
        className="bg-card border border-line rounded-2xl px-4 py-3.5 text-ink text-base"
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        style={props.multiline ? { minHeight: 90, textAlignVertical: 'top' } : undefined}
        {...props}
      />
      {!!hint && <Text className="text-muted text-[11px] mt-1 px-1">{hint}</Text>}
    </View>
  );
}
