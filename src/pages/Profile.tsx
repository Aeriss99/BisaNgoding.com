import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { Download, Upload, Trash2, Award } from 'lucide-react';

export default function Profile() {
  const { progress, saveProgress } = useStorage();
  const [message, setMessage] = useState('');

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "bisangoding-progress.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setMessage('Progres berhasil di-export!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (importedData && typeof importedData === 'object' && 'completedLessons' in importedData) {
          saveProgress(importedData);
          setMessage('Progres berhasil di-import!');
        } else {
          setMessage('Format file tidak valid!');
        }
      } catch (err) {
        setMessage('Gagal membaca file JSON!');
      }
      setTimeout(() => setMessage(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua progres? Ini tidak bisa dibatalkan.')) {
      saveProgress({
        completedLessons: [],
        moduleStatus: { 'java-dasar': 'unlocked' },
        xp: 0,
        streak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]
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
