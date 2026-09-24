import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { bersihkanProgresLokal } from '../lib/cloudProgress'; // We'll implement this later

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  masukGoogle: () => Promise<void>;
  keluar: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  masukGoogle: async () => {},
  keluar: async () => {},
  isSupabaseConfigured: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = async (userId: string | undefined) => {
    if (!supabase || !userId) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(!!data);
    } catch (e) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      setLoading(false);

      // Clean ?code= from URL without reloading
      if (window.location.search.includes('code=')) {
        const newUrl =
          window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname +
          window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const masukGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });
  };

  const keluar = async () => {
    if (!supabase) return;
    bersihkanProgresLokal(user?.id);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        masukGoogle,
        keluar,
        isSupabaseConfigured: !!supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
