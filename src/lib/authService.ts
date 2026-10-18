import { supabase, isSupabaseConfigured } from './supabase';
import { User, Session } from '@supabase/supabase-js';

const LEGACY_DEMO_AUTH_KEY = 'scrapbook_demo_authenticated';
const DEV_LOCAL_AUTH_KEY = 'scrapbook_dev_owner_session';
export const OWNER_USER_ID = '5d237790-3b23-46b0-8941-3f3a41a5cd62';

function isDesignatedOwner(user: User): boolean {
  return user.id === OWNER_USER_ID && user.app_metadata.role === 'owner';
}

export interface AuthState {
  isAuthenticated: boolean;
  isOwner: boolean;
  userEmail: string | null;
  isDemoMode: boolean;
}

export async function checkAuthState(): Promise<AuthState> {
  localStorage.removeItem(LEGACY_DEMO_AUTH_KEY);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        const isOwner = isDesignatedOwner(session.user);
        return {
          isAuthenticated: isOwner,
          isOwner,
          userEmail: isOwner ? session.user.email || null : null,
          isDemoMode: false,
        };
      }
    } catch (e) {
      console.warn('Supabase session check error:', e);
    }
    return {
      isAuthenticated: false,
      isOwner: false,
      userEmail: null,
      isDemoMode: false,
    };
  }

  if (import.meta.env.DEV) {
    const isDevAuthenticated = localStorage.getItem(DEV_LOCAL_AUTH_KEY) === 'true';
    if (isDevAuthenticated) {
      return {
        isAuthenticated: true,
        isOwner: true,
        userEmail: 'local-dev-owner@bday.test',
        isDemoMode: true,
      };
    }
  }

  return {
    isAuthenticated: false,
    isOwner: false,
    userEmail: null,
    isDemoMode: !isSupabaseConfigured,
  };
}

export async function loginOwner(email: string, password: string): Promise<{ success: boolean; error?: string; isDemo?: boolean }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session && isDesignatedOwner(data.session.user)) {
        return { success: true, isDemo: false };
      }
      await supabase.auth.signOut();
      return { success: false, error: 'This account is not authorized as the memory-book owner.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: message };
    }
  }

  if (import.meta.env.DEV) {
    localStorage.setItem(DEV_LOCAL_AUTH_KEY, 'true');
    return { success: true, isDemo: true };
  }

  return { success: false, error: 'Owner sign-in is unavailable until Supabase is configured.' };
}

export async function logoutOwner(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error:', e);
    }
  }
  localStorage.removeItem(LEGACY_DEMO_AUTH_KEY);
  localStorage.removeItem(DEV_LOCAL_AUTH_KEY);
}

export function subscribeToAuthChanges(callback: (user: User | null, session: Session | null) => void) {
  if (isSupabaseConfigured && supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null, session);
    });
    return () => subscription.unsubscribe();
  }
  return () => {};
}
