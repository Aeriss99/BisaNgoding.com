import { useState } from 'react';
import type { RunnableCard, CodeChallengeCard } from '../../types/schema';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { Play, Loader2, CheckCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { runJavaCode } from '../../lib/javaRunner';

export function RunnableCardComponent({ card }: { card: RunnableCard }) {
  const [code, setCode] = useState(card.code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleRun = async () => {
    setIsRunning(true);
    setTimedOut(false);
    setOutput('\n');
    setStatusText("Memuat Java (sekali saja)");
    try {
      const res = await runJavaCode(code, "", (s) => setStatusText(s));
      if (res.timedOut) {
        setTimedOut(true);
        setOutput('Program terlalu lama berjalan.');
      } else if (res.exitCode === 0) {
        setOutput(res.stdout || 'Program selesai tanpa output.');
      } else {
        setOutput(`Error:\n${res.stderr}`);
      }
    } catch (e: any) {
      setOutput(`Gagal: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <div className="flex justify-between items-center shrink-0">
        <p className="font-bold text-gray-700">Kode Playground</p>
      </div>
      <div className="brutal-border rounded-xl overflow-hidden bg-white">
        <CodeMirror
          value={code}
          extensions={[
            java(), 
            EditorView.lineWrapping, 
            EditorView.theme({ "&": { fontSize: "14px", lineHeight: "1.6" } })
          ]}
          theme="light"
          onChange={(val) => setCode(val)}
          basicSetup={{ lineNumbers: true }}
          minHeight="240px"
          maxHeight="70vh"
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleRun}
          disabled={isRunning}
          className="flex-1 brutal-btn bg-[var(--color-success)] text-[var(--color-text-main)] font-extrabold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {isRunning ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Play className="w-5 h-5 shrink-0" />}
          {isRunning ? statusText : 'Jalankan Kode'}
        </button>
        {timedOut && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 brutal-btn bg-[var(--color-accent)] text-[var(--color-text-main)] font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        )}
      </div>
      
      {output && (
        <div className="flex flex-col space-y-2 w-full min-w-0">
          <p className="font-bold text-gray-700">Output</p>
          <div className="p-4 font-mono text-sm rounded-xl whitespace-pre-wrap break-words brutal-border overflow-y-auto max-h-[300px] bg-gray-900 text-green-400 brutal-card">
            {output}
          </div>
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
  onSuccess: (attempts: number) => void 
}) {
  const [code, setCode] = useState(card.starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [statusText, setStatusText] = useState("");

  const handleCheck = async () => {
    setIsRunning(true);
    setTimedOut(false);
    setOutput('Memeriksa jawaban...\n');
    setStatusText("Memuat Java (sekali saja)");
    try {
      let allPassed = true;
      let finalOutput = '';

      for (let i = 0; i < card.tests.length; i++) {
        const test = card.tests[i];
        const res = await runJavaCode(code, test.input, (s) => setStatusText(s));

        if (res.timedOut) {
          setTimedOut(true);
          setOutput('Program terlalu lama berjalan.');
          allPassed = false;
          break;
        }

        if (res.exitCode !== 0) {
          finalOutput = `Error pada Test Case ${i + 1}:\n${res.stderr}`;
          allPassed = false;
          break;
        }

        const actual = res.stdout.trim();
        const expected = test.expectedOutput.trim();
        if (actual !== expected) {
          allPassed = false;
          finalOutput = `Test Case ${i + 1} Gagal.\nInput: ${test.input || '(kosong)'}\nHarapan: ${expected}\nAktual: ${actual}`;
          break;
        }
      }

      if (allPassed) {
        setOutput(`Semua test case berhasil!\n✅ Sempurna! Kode Anda benar.`);
        setIsSuccess(true);
        onSuccess(attempts + 1);
      } else if (!timedOut) {
        setOutput(finalOutput);
        setAttempts(a => a + 1);
      }
    } catch (e: any) {
      setOutput(`Gagal: ${e.message}`);
      setAttempts(a => a + 1);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <h3 className="font-bold text-lg">{card.prompt}</h3>
      <div className="brutal-border rounded-xl overflow-hidden bg-white">
        <CodeMirror
          value={code}
          extensions={[
            java(), 
            EditorView.lineWrapping, 
            EditorView.theme({ "&": { fontSize: "14px", lineHeight: "1.6" } })
          ]}
          theme="light"
          onChange={(val) => setCode(val)}
          basicSetup={{ lineNumbers: true }}
          minHeight="240px"
          maxHeight="70vh"
        />
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={handleCheck}
          disabled={isRunning || isSuccess}
          className={`flex-1 font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 brutal-btn ${
            isSuccess 
              ? 'bg-[var(--color-success)] text-[var(--color-text-main)]' 
              : 'bg-[var(--color-primary)] text-white'
          }`}
        >
          {isRunning ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : 
           isSuccess ? <CheckCircle className="w-5 h-5 shrink-0" /> : 
           <Play className="w-5 h-5 shrink-0" />}
          {isRunning ? statusText : isSuccess ? 'Berhasil!' : 'Cek Jawaban'}
        </button>
        {timedOut && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 brutal-btn bg-[var(--color-accent)] text-[var(--color-text-main)] font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        )}
      </div>

      {output && (
        <div className="flex flex-col space-y-2 w-full min-w-0">
          <p className="font-bold text-gray-700">Hasil Pengecekan</p>
          <div className="p-4 font-mono text-sm rounded-xl whitespace-pre-wrap break-words brutal-border overflow-y-auto max-h-[300px] bg-gray-900 text-green-400 brutal-card">
            {output}
          </div>
        </div>
      )}

      {attempts >= 3 && !isSuccess && (
        <div className="flex justify-between mt-2">
          <button 
            onClick={() => setShowHint(true)}
            className="text-sm text-blue-600 underline flex items-center gap-1"
          >
            <Lightbulb className="w-4 h-4"/> Petunjuk
          </button>
          <button 
            onClick={() => setShowSolution(true)}
            className="text-sm text-red-600 underline"
          >
            Lihat Solusi
          </button>
        </div>
      )}

      {showHint && !isSuccess && (
        <div className="p-4 bg-[var(--color-accent)] text-[var(--color-text-main)] rounded-xl text-sm brutal-border brutal-card">
          <p className="font-bold mb-1">Petunjuk:</p>
          <ul className="list-disc pl-4 space-y-1">
            {card.hints.map((h: string, i: number) => <li key={i}>{h}</li>)}
          </ul>
        </div>
      )}

      {showSolution && !isSuccess && (
        <div className="p-4 bg-[var(--color-danger)] text-white rounded-xl text-sm brutal-border brutal-card">
          <p className="font-bold mb-1">Solusi:</p>
          <pre className="font-mono bg-white text-[var(--color-text-main)] p-2 rounded mt-1 brutal-border overflow-x-auto">
            {(card as any).solution || 'Solusi belum tersedia untuk tantangan ini.'}
          </pre>
        </div>
      )}
    </div>
  );
}
