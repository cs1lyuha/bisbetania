import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { FavoriteVerse, Profile, supabase, supabaseConfigured } from './supabase';

export const NICKNAME_RE = /^[a-z0-9_.]{3,20}$/;

export interface SignUpData {
  invite: string;
  nickname: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Erorile pe care le arătăm în formular; textul vine din traduceri (auth_error_<cod>). */
export type AuthErrorCode = 'email_not_confirmed' | 'invalid_login' | 'email_taken' | 'nickname_taken' | 'nickname_format' | 'invite' | 'weak_password' | 'network' | 'unknown';

export class AuthError extends Error {
  constructor(public code: AuthErrorCode) {
    super(code);
  }
}

function mapError(message: string): AuthErrorCode {
  const m = message.toLowerCase();
  if (m.includes('not confirmed')) return 'email_not_confirmed';
  if (m.includes('invalid login')) return 'invalid_login';
  if (m.includes('already registered') || m.includes('already been registered')) return 'email_taken';
  if (m.includes('password')) return 'weak_password';
  // Trigger-ul care verifică codul de invitație apare ca „Database error saving new user”.
  if (m.includes('database error')) return 'invite';
  if (m.includes('network') || m.includes('fetch')) return 'network';
  return 'unknown';
}

interface Auth {
  enabled: boolean;
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Crește după fiecare check-in reușit, ca seria să fie reîncărcată. */
  checkIns: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<Profile, 'nickname' | 'first_name' | 'last_name' | 'bio' | 'favorite_verse' | 'avatar_url'>>) => Promise<void>;
  setFavoriteVerse: (verse: FavoriteVerse | null) => Promise<void>;
  uploadAvatar: (uri: string, mimeType?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const checkedInDay = useRef<string | null>(null);
  const [checkIns, setCheckIns] = useState(0);
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return setProfile(null);
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) setProfile(data as Profile);
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Ziua activă pentru serie: o dată pe zi, la deschiderea aplicației (serverul socotește ziua după ora Moldovei).
  useEffect(() => {
    if (!userId) return;
    const checkIn = () => {
      const today = new Date().toDateString();
      if (checkedInDay.current === today) return;
      checkedInDay.current = today;
      supabase.rpc('check_in').then(({ error }) => {
        if (error) checkedInDay.current = null;
        else setCheckIns((n) => n + 1);
      });
    };
    checkIn();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && checkIn());
    return () => sub.remove();
  }, [userId]);

  const value = useMemo<Auth>(() => {
    const requireUser = () => {
      if (!userId) throw new AuthError('unknown');
      return userId;
    };

    const updateProfile: Auth['updateProfile'] = async (patch) => {
      const id = requireUser();
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single();
      if (error) throw new AuthError(error.code === '23505' ? 'nickname_taken' : error.code === '23514' ? 'nickname_format' : mapError(error.message));
      setProfile(data as Profile);
    };

    return {
      enabled: supabaseConfigured,
      ready,
      session,
      profile,
      checkIns,
      refreshProfile,
      updateProfile,

      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw new AuthError(mapError(error.message));
      },

      signUp: async ({ invite, nickname, firstName, lastName, email, password }) => {
        const nick = nickname.trim().toLowerCase();
        if (!NICKNAME_RE.test(nick)) throw new AuthError('nickname_format');
        const { data: free, error: checkError } = await supabase.rpc('nickname_available', { p_nickname: nick });
        if (checkError) throw new AuthError(mapError(checkError.message));
        if (!free) throw new AuthError('nickname_taken');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { invite: invite.trim(), nickname: nick, first_name: firstName.trim(), last_name: lastName.trim() } },
        });
        if (error) throw new AuthError(mapError(error.message));
        // Fără sesiune înseamnă că în Supabase e încă pornit „Confirm email”.
        if (!data.session) throw new AuthError('email_not_confirmed');
      },

      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },

      setFavoriteVerse: (verse) => updateProfile({ favorite_verse: verse }),

      uploadAvatar: async (uri, mimeType = 'image/jpeg') => {
        const id = requireUser();
        const ext = mimeType.includes('png') ? 'png' : 'jpg';
        const path = `${id}/avatar-${Date.now()}.${ext}`;
        const body = await (await fetch(uri)).arrayBuffer();
        const { error } = await supabase.storage.from('avatars').upload(path, body, { contentType: mimeType, upsert: true });
        if (error) throw new AuthError(mapError(error.message));
        const old = profile?.avatar_url?.split('/avatars/')[1];
        await updateProfile({ avatar_url: supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl });
        if (old) supabase.storage.from('avatars').remove([old]).catch(() => {});
      },

      deleteAccount: async () => {
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw new AuthError(mapError(error.message));
        await supabase.auth.signOut();
        setProfile(null);
      },
    };
  }, [ready, session, profile, checkIns, userId, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
