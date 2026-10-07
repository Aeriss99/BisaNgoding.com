import React, { useState, useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import {
  Download,
  Upload,
  Trash2,
  Award,
  LogIn,
  LogOut,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bersihkanProgresLokal } from '../lib/cloudProgress';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { progress, importProgress, toggleUnlockAll, syncStatus, flushKeCloud, streakHariIni } =
    useProgress();
  const { user, isAdmin, masukGoogle, keluar, isSupabaseConfigured } =
    useAuth();
  const [message, setMessage] = useState('');
  const [sedangKeluar, setSedangKeluar] = useState(false);
  const [tampilDialogBelumTersimpan, setTampilDialogBelumTersimpan] = useState(false);
  const [sedangMasuk, setSedangMasuk] = useState(false);
  const navigate = useNavigate();
  const [notifPengingat, setNotifPengingat] = useState(true);
  const [notifModul, setNotifModul] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured && user && supabase) {
      supabase.from("pengaturan_notifikasi").select("streak, modul_baru").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setNotifPengingat(data.streak);
          setNotifModul(data.modul_baru);
        }
      });
    }
  }, [isSupabaseConfigured, user]);

  const handleNotifChange = async (jenis: "streak" | "modul_baru", value: boolean) => {
    if (!isSupabaseConfigured || !user || !supabase) return;
    if (jenis === "streak") setNotifPengingat(value);
    if (jenis === "modul_baru") setNotifModul(value);
    setSavingNotif(true);
    const { error } = await supabase.from("pengaturan_notifikasi").update({ [jenis]: value }).eq("user_id", user.id);
    if (error) {
      tampilkanPesan("Gagal menyimpan pengaturan notifikasi");
      if (jenis === "streak") setNotifPengingat(!value);
      if (jenis === "modul_baru") setNotifModul(!value);
    } else {
      tampilkanPesan("Pengaturan notifikasi disimpan");
    }
    setSavingNotif(false);
  };

  const tampilkanPesan = (teks: string, ms = 3000) => {
    setMessage(teks);
    setTimeout(() => setMessage(''), ms);
  };

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(progress, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute(
      'download',
      `bisangoding-progress-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
    tampilkanPesan('Progres berhasil di-export!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm('Mengimpor data akan menimpa progres Anda saat ini. Lanjutkan?')
    ) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const ok = importProgress(data);
        tampilkanPesan(
          ok
            ? 'Progres berhasil di-import!'
            : 'Import ditolak: data tidak valid atau sudah kedaluwarsa.',
          4000
        );
      } catch {
        tampilkanPesan('Gagal membaca file JSON!', 4000);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirm('Hapus semua progres? Tindakan ini tidak bisa dibatalkan.'))
      return;
    const today = new Date().toISOString().split('T')[0];
    importProgress({
      completedLessons: [],
      moduleStatus: {},
      quizScores: {},
      xp: 0,
      streak: 0,
      lastActiveDate: today,
      maxSeenDate: today,
      unlockAll: false,
    });
    tampilkanPesan('Progres berhasil direset!');
  };

  const handleMasuk = async () => {
    setSedangMasuk(true);
    try {
      await masukGoogle();
    } catch (e) {
      tampilkanPesan('Gagal masuk. Silakan coba lagi.');
      setSedangMasuk(false);
    }
  };

  const handleKeluar = async () => {
    setSedangKeluar(true);
    const tersimpan = await flushKeCloud();
    if (!tersimpan) {
      setTampilDialogBelumTersimpan(true);
      setSedangKeluar(false);
      return;
    }
    bersihkanProgresLokal(user?.id);
    await keluar();
    navigate('/', { replace: true });
  };

  const handleKeluarSaja = async () => {
    setTampilDialogBelumTersimpan(false);
    setSedangKeluar(true);
    await keluar();
    navigate('/', { replace: true });
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto px-4 md:px-6 py-6">
      <header>
        <h1 className="text-2xl font-bold mb-2">Profil & Pengaturan</h1>
        <p className="text-gray-600">Kelola progres belajar Anda.</p>
      </header>

      {message && (
        <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      {isSupabaseConfigured && (
        <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4 brutal-card">
          <h2 className="font-bold border-b pb-2">Akun</h2>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="w-12 h-12 rounded-full brutal-border"
                />
                <div>
                  <div className="font-bold text-lg">
                    {user.user_metadata.full_name}
                  </div>
                  <div className="text-gray-500 text-sm">{user.email}</div>
                  <div className="text-xs font-medium text-[var(--color-primary)] mt-1">
                    {syncStatus}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Masuk untuk menyinkronkan progres di semua perangkat secara
                otomatis.
              </p>
              <button
                onClick={handleMasuk}
                disabled={sedangMasuk}
                className="w-full flex items-center justify-center gap-2 brutal-btn !bg-[var(--color-primary)] !text-white !p-3 disabled:opacity-75 disabled:cursor-wait"
              >
                {sedangMasuk ? 'Membuka Google...' : (
                  <>
                    <LogIn className="w-5 h-5" /> Masuk dengan Google
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <h2 className="font-bold flex items-center gap-2 border-b pb-2">
          <Award className="text-yellow-500" /> Statistik
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-500">Total XP</div>
            <div className="text-2xl font-bold text-blue-600">
              {progress.xp}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-500">Streak Harian</div>
            <div className="text-2xl font-bold text-orange-500">
              {streakHariIni} ⚡
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
      {isSupabaseConfigured && user && (
        <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
          <h2 className="font-bold border-b pb-2">Notifikasi email</h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Terhubung ke: <b>{user.email}</b></p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-700">Pengingat streak harian</span>
              <input type="checkbox" className="w-5 h-5 accent-[var(--color-primary)]" checked={notifPengingat} onChange={e => handleNotifChange("streak", e.target.checked)} disabled={savingNotif} />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-700">Info modul baru</span>
              <input type="checkbox" className="w-5 h-5 accent-[var(--color-primary)]" checked={notifModul} onChange={e => handleNotifChange("modul_baru", e.target.checked)} disabled={savingNotif} />
            </label>
          </div>
        </section>
      )}

        <h2 className="font-bold border-b pb-2">Manajemen Progres</h2>
        <div className="space-y-3">
          {isAdmin && (
            <label className="w-full flex items-center justify-between bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-200 cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <Unlock className="w-5 h-5" /> Buka Semua Modul
              </div>
              <input
                type="checkbox"
                checked={progress.unlockAll}
                onChange={(e) => toggleUnlockAll(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-primary)]"
              />
            </label>
          )}

          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Download className="w-5 h-5" /> Export Progres (JSON)
          </button>

          <label className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-lg hover:bg-green-100 transition-colors font-medium cursor-pointer">
            <Upload className="w-5 h-5" /> Import Progres
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 transition-colors font-medium mt-8 border border-red-200"
          >
            <Trash2 className="w-5 h-5" /> Reset Semua Progres
          </button>
        </div>
      </section>

      {isSupabaseConfigured && user && (
        <button
          onClick={handleKeluar}
          disabled={sedangKeluar}
          className="w-full flex items-center justify-center gap-2 brutal-btn !bg-red-400 !text-white !p-3 mt-6 disabled:opacity-75 disabled:cursor-wait"
        >
          {sedangKeluar ? 'Menyimpan...' : (
            <>
              <LogOut className="w-5 h-5" /> Keluar
            </>
          )}
        </button>
      )}

      {/* Dialog belum tersimpan */}
      {tampilDialogBelumTersimpan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="brutal-card-big p-6 max-w-sm w-full bg-white flex flex-col gap-4">
            <h3 className="text-xl font-bold font-space">Progres terbaru belum tersimpan ke akun</h3>
            <p className="text-gray-700 text-sm">
              Sepertinya koneksi internet sedang bermasalah. Progres tetap aman di perangkat ini dan akan dikirim otomatis saat kamu masuk lagi di perangkat yang sama.
            </p>
            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleKeluar}
                disabled={sedangKeluar}
                className="brutal-btn bg-[var(--color-primary)] text-white p-3 font-bold disabled:opacity-75 disabled:cursor-wait"
              >
                Coba simpan lagi
              </button>
              <button
                onClick={handleKeluarSaja}
                disabled={sedangKeluar}
                className="brutal-btn bg-white border-2 border-gray-300 text-gray-700 p-3 font-bold hover:bg-gray-50 disabled:opacity-75 disabled:cursor-wait"
              >
                Keluar saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
