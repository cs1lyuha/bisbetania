import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config/supabase';

export const supabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Pe telefon reîmprospătăm sesiunea doar cât aplicația e deschisă (recomandarea Supabase pentru React Native).
if (Platform.OS !== 'web' && supabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export interface FavoriteVerse {
  lang: 'ro' | 'ru';
  b: number;
  c: number;
  v: number;
}

export interface Profile {
  id: string;
  nickname: string;
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string | null;
  favorite_verse: FavoriteVerse | null;
  created_at: string;
}

export interface MemberStats {
  user_id: string;
  current_streak: number;
  best_streak: number;
  active_days: number;
  friends: number;
  verses_mastered: number;
  lessons_read: number;
  prayers_posted: number;
  prayers_supported: number;
}

export const fullName = (p: Pick<Profile, 'first_name' | 'last_name' | 'nickname'>) =>
  `${p.first_name} ${p.last_name}`.trim() || p.nickname;
