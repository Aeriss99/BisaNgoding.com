import { useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { Download, Upload, Trash2, Award } from 'lucide-react';

export default function Profile() {
  const { progress, importProgress, toggleUnlockAll } = useProgress();
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toISOString().split('T')[0];
    downloadAnchorNode.setAttribute("download", `bisangoding-progress-${date}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage('Progres berhasil di-export!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Peringatan: Mengimpor data akan menimpa progres Anda saat ini. Lanjutkan?')) {
      e.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData && typeof importedData === 'object' && 'completedLessons' in importedData) {
          const success = importProgress(importedData);
          if (success) {
            setMessage('Progres berhasil di-import!');
          } else {
            setMessage('Import ditolak: data tidak valid atau sudah kedaluwarsa (terlalu lama tidak aktif).');
          }
        } else {
          setMessage('Format file tidak valid!');
        }
      } catch (err) {
        setMessage('Gagal membaca file JSON!');
      }
      setTimeout(() => setMessage(''), 4000);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua progres? Ini tidak bisa dibatalkan.')) {
      const today = new Date().toISOString().split('T')[0];
      importProgress({
        completedLessons: [],
        moduleStatus: { 'dasar': 'unlocked' },
        quizScores: {},
        xp: 0,
        streak: 0,
        lastActiveDate: today,
        maxSeenDate: today
      });
      setMessage('Progres berhasil direset!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <header>
        <h1 className="text-2xl font-bold mb-2">Profil & Pengaturan</h1>
        <p className="text-gray-600">Atur akun dan kelola progres belajar Anda.</p>
      </header>

      {message && (
        <div className="p-3 bg-blue-100 text-blue-800 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <h2 className="font-bold flex items-center gap-2 border-b pb-2">
          <Award className="text-yellow-500" /> Statistik
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-500">Total XP</div>
            <div className="text-2xl font-bold text-blue-600">{progress.xp}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-500">Streak Harian</div>
            <div className="text-2xl font-bold text-orange-500">{progress.streak} ⚡</div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <h2 className="font-bold border-b pb-2">Pengaturan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900">Buka Semua Modul</div>
            <div className="text-sm text-gray-500">Membuka kunci seluruh modul dan pelajaran tanpa harus berurutan.</div>
          </div>
          <button 
            onClick={() => toggleUnlockAll(!progress.unlockAll)}
            className={`w-12 h-6 rounded-full transition-colors relative ${progress.unlockAll ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${progress.unlockAll ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border p-4 shadow-sm space-y-4">
        <h2 className="font-bold border-b pb-2">Manajemen Progres</h2>
        <div className="space-y-3">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-3 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Download className="w-5 h-5" /> Export Progres (JSON)
          </button>
          
          <label className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-lg hover:bg-green-100 transition-colors font-medium cursor-pointer">
            <Upload className="w-5 h-5" /> Import Progres
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>

          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 py-3 rounded-lg hover:bg-red-100 transition-colors font-medium mt-8 border border-red-200"
          >
            <Trash2 className="w-5 h-5" /> Reset Semua Progres
          </button>
        </div>
      </section>
    </div>
  );
}
