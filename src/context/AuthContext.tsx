import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { bersihkanProgresLokal } from '../lib/cloudProgress'; // We'll implement this later

interface AuthContextType {
  user: User | null;
  loading: boolean;
  masukGoogle: () => Promise<void>;
  keluar: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  masukGoogle: async () => {},
  keluar: async () => {},
  isSupabaseConfigured: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Clean ?code= from URL without reloading
      if (window.location.search.includes('code=')) {
        const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    bersihkanProgresLokal();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      masukGoogle,
      keluar,
      isSupabaseConfigured: !!supabase
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
