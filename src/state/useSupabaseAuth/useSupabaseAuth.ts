import { useCallback, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const getToken = useCallback(
    async (user_identity: string, room_name: string) => {
      const headers = new window.Headers();

      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
      headers.set('content-type', 'application/json');

      const endpoint = process.env.REACT_APP_TOKEN_ENDPOINT || '/token';

      return fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_identity,
          room_name,
          create_conversation: process.env.REACT_APP_DISABLE_TWILIO_CONVERSATIONS !== 'true',
        }),
      }).then(res => res.json());
    },
    [session]
  );

  const updateRecordingRules = useCallback(
    async (room_sid: string, rules: any) => {
      const headers = new window.Headers();

      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
      headers.set('content-type', 'application/json');

      return fetch('/recordingrules', {
        method: 'POST',
        headers,
        body: JSON.stringify({ room_sid, rules }),
      }).then(async res => {
        const jsonResponse = await res.json();

        if (!res.ok) {
          const recordingError = new Error(
            jsonResponse.error?.message || 'There was an error updating recording rules'
          ) as any;
          recordingError.code = jsonResponse.error?.code;
          return Promise.reject(recordingError);
        }

        return jsonResponse;
      });
    },
    [session]
  );

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthReady(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setSession(null);
  }, []);

  // Convert Supabase user to match Firebase User interface for compatibility
  const compatibleUser = user
    ? {
        ...user,
        displayName: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User',
        photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || user.user_metadata?.photo || undefined,
      }
    : null;

  return { user: compatibleUser, signIn, signOut, isAuthReady, getToken, updateRecordingRules };
}
