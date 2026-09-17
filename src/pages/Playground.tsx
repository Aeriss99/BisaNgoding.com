import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { Play, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { runJavaCode } from '../lib/javaRunner';

const STORAGE_KEY = 'bisangoding_playground';

const KODE_AWAL = `public class Main {
    public static void main(String[] args) {
        System.out.println("Halo, Dunia!");
    }
}`;

export default function Playground() {
  const [code, setCode] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || KODE_AWAL;
    } catch {
      return KODE_AWAL;
    }
  });
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* abaikan */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [code]);

  const handleRun = async () => {
    setIsRunning(true);
    setTimedOut(false);
    setIsError(false);
    setOutput('Memuat Java... (pertama kali agak lama)');
    try {
      const res = await runJavaCode(code, stdin);
      if (res.timedOut) {
        setTimedOut(true);
        setIsError(true);
        setOutput('Program terlalu lama berjalan. Periksa apakah ada perulangan tanpa henti.');
      } else if (res.exitCode === 0) {
        setIsError(false);
        setOutput(res.stdout || 'Program selesai tanpa output.');
      } else {
        setIsError(true);
        setOutput(res.stderr || 'Terjadi error saat menjalankan program.');
      }
    } catch (e: any) {
      setIsError(true);
      setOutput(`Gagal menjalankan: ${e?.message ?? e}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold mb-1">Code Playground</h1>
        <p className="text-gray-600 text-sm">
          Tulis kode Java apa pun di sini. Kode tersimpan otomatis di browser kamu.
        </p>
      </header>

      <div className="border rounded-lg overflow-hidden border-gray-300">
        <CodeMirror
          value={code}
          extensions={[java()]}
          theme="light"
          onChange={(val) => setCode(val)}
          basicSetup={{ lineNumbers: true }}
          height="320px"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Input (untuk Scanner, satu nilai per baris)
        </label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={3}
          placeholder={'contoh:\n10\n25'}
          className="w-full border border-gray-300 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {isRunning ? 'Menjalankan...' : 'Jalankan Kode'}
        </button>

        {timedOut && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Muat Ulang
          </button>
        )}

        <button
          onClick={() => {
            setCode(KODE_AWAL);
            setStdin('');
            setOutput('');
          }}
          title="Kembalikan ke kode awal"
          className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {output && (
        <div
          className={`p-4 font-mono text-sm rounded-xl whitespace-pre-wrap shadow-inner overflow-x-auto ${
            isError ? 'bg-gray-900 text-red-300' : 'bg-gray-900 text-green-400'
          }`}
        >
          {output}
        </div>
      )}
    </div>
  );
}
