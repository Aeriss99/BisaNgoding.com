import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  sedangPulihkanPassword: boolean;
  sudahVerifikasiEmail: boolean | null;
  masukGoogle: () => Promise<void>;
  masukEmail: (email: string, password: string) => Promise<any>;
  daftarEmail: (email: string, password: string) => Promise<any>;
  verifikasiKodeDaftar: (email: string, kode: string) => Promise<any>;
  kirimUlangKodeDaftar: (email: string) => Promise<any>;
  kirimResetPassword: (email: string) => Promise<any>;
  verifikasiKodeReset: (email: string, kode: string) => Promise<any>;
  tandaiEmailTerverifikasi: () => Promise<void>;
  aturPassword: (password: string) => Promise<any>;
  keluar: () => Promise<void>;
  isSupabaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  sedangPulihkanPassword: false,
  sudahVerifikasiEmail: null,
  masukGoogle: async () => {},
  masukEmail: async () => {},
  daftarEmail: async () => {},
  verifikasiKodeDaftar: async () => {},
  kirimUlangKodeDaftar: async () => {},
  kirimResetPassword: async () => {},
  verifikasiKodeReset: async () => {},
  tandaiEmailTerverifikasi: async () => {},
  aturPassword: async () => {},
  keluar: async () => {},
  isSupabaseConfigured: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sedangPulihkanPassword, setSedangPulihkanPassword] = useState(false);
  const [sudahVerifikasiEmail, setSudahVerifikasiEmail] = useState<boolean | null>(null);

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

  const checkVerifikasiEmail = async (userId: string | undefined) => {
    if (!supabase || !userId) {
      setSudahVerifikasiEmail(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('verifikasi_email')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        setSudahVerifikasiEmail(false);
        return;
      }
      setSudahVerifikasiEmail(!!data);
    } catch (e) {
      setSudahVerifikasiEmail(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        checkVerifikasiEmail(session.user.id);
      }
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdmin(session.user.id);
        checkVerifikasiEmail(session.user.id);
      } else {
        setIsAdmin(false);
        setSudahVerifikasiEmail(null);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setSedangPulihkanPassword(true);
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

  const masukEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const daftarEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (data?.user && data.user.identities?.length === 0) {
      const err: any = new Error('User already registered');
      err.code = 'user_already_exists';
      throw err;
    }
    return data;
  };

  const verifikasiKodeDaftar = async (email: string, kode: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: kode,
      type: 'email',
    });
    if (error) throw error;
    try {
      await supabase.rpc('tandai_email_terverifikasi');
      setSudahVerifikasiEmail(true);
    } catch (e) {
      setSudahVerifikasiEmail(true);
    }
    return data;
  };

  const tandaiEmailTerverifikasi = async () => {
    if (!supabase) return;
    const { error } = await supabase.rpc('tandai_email_terverifikasi');
    if (error) throw error;
    setSudahVerifikasiEmail(true);
  };

  const kirimUlangKodeDaftar = async (email: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
    return data;
  };

  const kirimResetPassword = async (email: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  };

  const verifikasiKodeReset = async (email: string, kode: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    setSedangPulihkanPassword(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: kode,
        type: 'recovery',
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setSedangPulihkanPassword(false);
      throw err;
    }
  };

  const aturPassword = async (password: string) => {
    if (!supabase) throw new Error('Supabase belum dikonfigurasi');
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    if (error) throw error;
    setSedangPulihkanPassword(false);
    return data;
  };

  const keluar = async () => {
    if (!supabase) return;
    setSedangPulihkanPassword(false);
    setSudahVerifikasiEmail(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        sedangPulihkanPassword,
        sudahVerifikasiEmail,
        masukGoogle,
        masukEmail,
        daftarEmail,
        verifikasiKodeDaftar,
        kirimUlangKodeDaftar,
        kirimResetPassword,
        verifikasiKodeReset,
        tandaiEmailTerverifikasi,
        aturPassword,
        keluar,
        isSupabaseConfigured: !!supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
