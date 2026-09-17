import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <h2 className="text-2xl font-bold">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-500">Mungkin kamu tersesat di luar batas Java.</p>
      <Link to="/" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium">
        <Home className="w-5 h-5" /> Kembali ke Beranda
      </Link>
    </div>
  );
}
