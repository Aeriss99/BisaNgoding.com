import { useState } from 'react';
import type { RunnableCard, CodeChallengeCard } from '../../types/schema';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { Play, Loader2, CheckCircle } from 'lucide-react';
import { runJavaCode } from '../../lib/javaRunner';

export function RunnableCardComponent({ card }: { card: RunnableCard }) {
  const [code, setCode] = useState(card.code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Memuat JVM dan menjalankan kode...\n');
    try {
      const res = await runJavaCode(code);
      if (res.exitCode === 0) {
        setOutput(res.stdout || 'Program selesai tanpa output.');
      } else {
        setOutput(`Error:\n${res.stderr}`);
      }
    } catch (e: any) {
      setOutput(`Gagal menjalankan kode: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-bold text-gray-700">Kode Playground</p>
      </div>
      <div className="border rounded-lg overflow-hidden border-gray-300">
        <CodeMirror
          value={code}
          extensions={[java()]}
          theme="light"
          onChange={(val) => setCode(val)}
          basicSetup={{ lineNumbers: true }}
        />
      </div>
      <button 
        onClick={handleRun}
        disabled={isRunning}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
        {isRunning ? 'Menjalankan...' : 'Jalankan Kode'}
      </button>
      
      {output && (
        <div className="mt-4 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-xl whitespace-pre-wrap shadow-inner">
          {output}
        </div>
      )}
    </div>
  );
}

export function CodeChallengeCardComponent({ 
  card, 
  onSuccess 
}: { 
  card: CodeChallengeCard,
  onSuccess: () => void 
}) {
  const [code, setCode] = useState(card.starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleCheck = async () => {
    setIsRunning(true);
    setOutput('Memeriksa jawaban...\n');
    try {
      const res = await runJavaCode(code);
      
      if (res.exitCode !== 0) {
        setOutput(`Error:\n${res.stderr}`);
        setAttempts(a => a + 1);
        return;
      }

      // Check against all tests
      let allPassed = true;
      for (const test of card.tests) {
        // Strip whitespace for forgiving comparison
        const actual = res.stdout.trim();
        const expected = test.expectedOutput.trim();
        if (actual !== expected) {
          allPassed = false;
          setOutput(`Output tidak sesuai.\nHarapan: ${expected}\nAktual: ${actual}`);
          break;
        }
      }

      if (allPassed) {
        setOutput(`Output:\n${res.stdout}\n\n✅ Sempurna! Kode Anda benar.`);
        setIsSuccess(true);
        onSuccess();
      } else {
        setAttempts(a => a + 1);
      }
    } catch (e: any) {
      setOutput(`Gagal menjalankan kode: ${e.message}`);
      setAttempts(a => a + 1);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">{card.prompt}</h3>
      <div className="border rounded-lg overflow-hidden border-blue-200">
        <CodeMirror
          value={code}
          extensions={[java()]}
          theme="light"
          onChange={(val) => setCode(val)}
          basicSetup={{ lineNumbers: true }}
        />
      </div>
      
      <button 
        onClick={handleCheck}
        disabled={isRunning || isSuccess}
        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
          isSuccess 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
        }`}
      >
        {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : 
         isSuccess ? <CheckCircle className="w-5 h-5" /> : 
         <Play className="w-5 h-5" />}
        {isRunning ? 'Memeriksa...' : isSuccess ? 'Berhasil!' : 'Cek Jawaban'}
      </button>

      {attempts >= 3 && !isSuccess && (
        <button 
          onClick={() => setShowHint(true)}
          className="text-sm text-blue-600 underline text-center w-full block mt-2"
        >
          Butuh Bantuan? Lihat Petunjuk
        </button>
      )}

      {showHint && !isSuccess && (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm border border-yellow-200">
          <p className="font-bold mb-1">Petunjuk:</p>
          <ul className="list-disc pl-4 space-y-1">
            {card.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {output && (
        <div className={`mt-4 p-4 font-mono text-sm rounded-xl whitespace-pre-wrap shadow-inner ${
          isSuccess ? 'bg-green-900 text-green-400' : 'bg-gray-900 text-gray-200'
        }`}>
          {output}
        </div>
      )}
    </div>
  );
}
