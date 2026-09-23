import { useState } from 'react';
import type { RunnableCard, CodeChallengeCard } from '../../types/schema';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { Play, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { getErrorHint } from '../../lib/errorHints';
import { runJavaCode } from '../../lib/javaRunner';
import { runJsCode } from '../../lib/jsRunner';

export function RunnableCardComponent({ card, mini = false, language = 'java', lessonRunnable = true }: { card: RunnableCard, mini?: boolean, language?: string, lessonRunnable?: boolean }) {
  const [code, setCode] = useState(card.code);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const [predictSelected, setPredictSelected] = useState<number | null>(null);
  const [hasRun, setHasRun] = useState(false);
  
  const handlePredict = (idx: number) => {
    if (!hasRun) setPredictSelected(idx);
  };

  const resetCode = () => {
    setCode(card.code);
  };

  const formatOutput = (outputStr: string) => {
    // If it's a compiler error, we should limit to 5 errors.
    // Javac outputs errors starting with file name, e.g. "Main.java:..."
    const lines = outputStr.split('\n');
    let errorCount = 0;
    const resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('at Runner') || line.includes('at java.base/jdk.internal') || line.includes('at java.base/java.lang.reflect') || line.includes('at java.base/sun.reflect')) {
        continue;
      }
      
      // Match compiler error start line: e.g., "/str/Main.java:5: error:"
      if (line.match(/\.java:\d+: error:/)) {
        errorCount++;
        if (errorCount > 5) {
          // If we hit the 6th error, stop parsing
          resultLines.push(`<div class="text-[#E0B25B] mt-2 font-bold">...dan beberapa error lainnya. Perbaiki error pertama dulu, biasanya sisanya ikut hilang.</div>`);
          break;
        }
      }
      
      let formattedLine = line.replace(/\/str\/Main\.java/g, 'Main.java').replace(/\/files\/Main\.java/g, 'Main.java');
      formattedLine = formattedLine.replace(/(Main\.java:\d+(:\d+)?)/g, '<span class="text-[#548AF7] underline cursor-pointer hover:text-blue-400">$1</span>');
      resultLines.push(`<div key="${i}">${formattedLine}</div>`);
    }

    return <div dangerouslySetInnerHTML={{ __html: resultLines.join('') }} />;
  };

  const getFirstErrorHint = (out: string) => {
    if (!out.includes('Error') && !out.includes('Exception')) return null;
    return getErrorHint(out);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setTimedOut(false);
    setOutput('\n');
    setStatusText(language === 'javascript' ? "Menjalankan JavaScript" : "Memuat Java (sekali saja)");
    try {
      const res = language === 'javascript' 
        ? await runJsCode(code, card.html, (s) => setStatusText(s))
        : await runJavaCode(code, "", (s) => setStatusText(s));
        
      if (res.timedOut) {
        setTimedOut(true);
        setOutput('Program terlalu lama berjalan.');
      } else if (res.exitCode === 0) {
        setOutput(res.stdout || 'Program selesai tanpa output.');
      } else {
        setOutput(`Error:\n${res.stderr}`);
      }
      setHasRun(true);
    } catch (e: any) {
      setOutput(`Gagal: ${e.message}`);
      setHasRun(true);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-6 w-full ${mini ? 'my-4' : ''}`}>
      {!mini && (
        <div className="flex justify-between items-center shrink-0">
          <p className="font-bold text-gray-700 font-space text-xl">Kode Playground</p>
          {code !== card.code && (
            <button onClick={resetCode} className="text-sm font-bold text-[var(--color-primary)] underline">
              Kembalikan Kode Awal
            </button>
          )}
        </div>
      )}
      
      {mini && code !== card.code && (
        <div className="flex justify-end">
          <button onClick={resetCode} className="text-xs font-bold text-[var(--color-primary)] underline">
            Kembalikan Kode
          </button>
        </div>
      )}

      <div className="brutal-border rounded-xl overflow-hidden bg-white">
        <CodeMirror
          value={code}
          extensions={[
            language === 'javascript' ? javascript() : java(), 
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

      {card.html && language === 'javascript' && (
        <div id="js-dom-output-container" className="mt-4 brutal-border bg-white rounded-xl overflow-hidden min-h-[200px]" style={{ width: '100%', height: '300px' }}>
        </div>
      )}

      {/* Tampilkan anotasinya di bawah (khususnya untuk HP) jika belum sempat bikin gutter */}
      {card.annotations && card.annotations.length > 0 && (
        <div className="bg-gray-50 border-2 border-[var(--color-text-main)] rounded-xl p-4 shadow-[2px_2px_0_var(--color-text-main)]">
          <h4 className="font-bold font-space mb-2">Penjelasan Kode:</h4>
          <ul className="space-y-2 text-sm">
            {card.annotations.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono bg-[var(--color-accent)] text-white px-1.5 py-0.5 rounded text-xs mt-0.5">Baris {a.line}</span>
                <span>{a.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.predict && !hasRun && (
        <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-text-main)] p-5 rounded-xl shadow-[4px_4px_0_var(--color-text-main)]">
          <h4 className="font-bold font-space text-lg mb-3">{card.predict.question}</h4>
          <div className="space-y-2">
            {card.predict.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handlePredict(i)}
                className={`w-full text-left p-3 rounded-lg border-2 brutal-border font-sans font-medium transition-colors ${
                  predictSelected === i ? 'bg-[var(--color-primary)] shadow-[2px_2px_0_var(--color-text-main)] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-yellow-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {lessonRunnable && (
        <div className="flex gap-2">
          <button 
            onClick={handleRun}
            disabled={isRunning || (card.predict && !hasRun && predictSelected === null)}
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
      )}
      
      {lessonRunnable && output && (
        <div className="flex flex-col space-y-4 w-full min-w-0 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#1E1F22] rounded-xl border-2 border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] overflow-hidden flex flex-col">
              <div className="bg-[#2B2D30] px-4 py-2 flex items-center gap-2 text-[#DFE1E5] text-xs font-mono border-b border-[#111]">
                <Play className="w-3 h-3 text-[var(--color-success)]" /> Run: {language === 'javascript' ? 'Script' : 'Main'}
              </div>
              <div className="p-4 font-mono text-[14px] leading-[1.6] whitespace-pre-wrap break-words overflow-y-auto max-h-[300px] text-[#DFE1E5]">
                <div className="text-[#6F737A] mb-2">{language === 'javascript' ? 'node script.js' : 'java Main'}</div>
                {formatOutput(output)}
                <div className="text-[#6F737A] mt-2 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${output.includes('Error:') || output.includes('Gagal:') || output.includes('Exception') ? 'bg-[#F75464]' : 'bg-[#6F737A]'}`} />
                  Process finished with exit code {output.includes('Error:') || output.includes('Gagal:') || output.includes('Exception') ? '1' : '0'}
                </div>
              </div>
            </div>

            {getFirstErrorHint(output) && (
              <div className="bg-[#2B2D30] rounded-xl border-2 border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] p-4 w-full md:w-1/3 shrink-0 h-fit text-[#DFE1E5]">
                <p className="font-bold text-[#E0B25B] mb-1">Artinya:</p>
                <p className="text-sm">{getFirstErrorHint(output)}</p>
              </div>
            )}

            {card.predict && hasRun && (
              <div className="md:w-1/3 bg-white border-2 border-[var(--color-text-main)] p-4 rounded-xl shadow-[4px_4px_0_var(--color-text-main)] shrink-0 h-fit">
                {predictSelected === card.predict.answer ? (
                  <>
                    <h4 className="font-bold text-[var(--color-success)] flex items-center gap-2 mb-2"><CheckCircle className="w-5 h-5"/> Tebakanmu benar!</h4>
                    <p className="text-sm font-medium text-gray-700">Kamu menebak dengan tepat apa yang akan terjadi.</p>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-[var(--color-danger)] flex items-center gap-2 mb-2">Ternyata berbeda</h4>
                    <p className="text-sm font-medium text-gray-700">Tebakanmu: <strong>{card.predict.options[predictSelected!]}</strong></p>
                    <p className="text-sm font-medium text-gray-700 mt-2">Coba perhatikan baris kode yang menghasilkan output ini.</p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {hasRun && card.explanation && (
            <div className="bg-[var(--color-accent-light)] border-2 border-[var(--color-text-main)] p-5 rounded-xl shadow-[4px_4px_0_var(--color-text-main)]">
              <h4 className="font-space text-lg font-bold mb-2">Apa yang barusan terjadi?</h4>
              <div className="prose prose-sm prose-black max-w-none font-sans font-medium">
                {card.explanation}
              </div>
            </div>
          )}

          {hasRun && card.tryThis && card.tryThis.length > 0 && (
            <div className="bg-yellow-50 border-2 border-[var(--color-text-main)] p-5 rounded-xl shadow-[4px_4px_0_var(--color-text-main)]">
              <h4 className="font-space text-lg font-bold mb-3">Coba Ubah Sendiri</h4>
              <ul className="space-y-3">
                {card.tryThis.map((task, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex gap-2 font-medium">
                      <span className="font-bold bg-[var(--color-primary)] px-1.5 rounded">{i+1}</span> 
                      {task.task}
                    </div>
                    {task.hint && <div className="ml-7 mt-1 text-gray-500 italic">💡 {task.hint}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CodeChallengeCardComponent({ 
  card, 
  onSuccess,
  onNavigateToTheory,
  onRequireRecheck,
  language = 'java'
}: { 
  card: CodeChallengeCard,
  onSuccess: (attempts: number) => void,
  onNavigateToTheory?: () => void,
  onRequireRecheck?: () => void,
  language?: string
}) {
  const [code, setCode] = useState(card.starterCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastAttemptCode, setLastAttemptCode] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [statusText, setStatusText] = useState("");
  
  const [showSteps, setShowSteps] = useState(true);
  const [reflectionText, setReflectionText] = useState('');
  const [showReflectionError, setShowReflectionError] = useState(false);
  
  const [currentHintLevel, setCurrentHintLevel] = useState(0); // 1 = hint1, 2 = hint2, 3 = skeleton, 4 = solution
  
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };
  
  const formatOutput = (outputStr: string) => {
    // If it's a compiler error, we should limit to 5 errors.
    // Javac outputs errors starting with file name, e.g. "Main.java:..."
    const lines = outputStr.split('\n');
    let errorCount = 0;
    const resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('at Runner') || line.includes('at java.base/jdk.internal') || line.includes('at java.base/java.lang.reflect') || line.includes('at java.base/sun.reflect')) {
        continue;
      }
      
      // Match compiler error start line: e.g., "/str/Main.java:5: error:"
      if (line.match(/\.java:\d+: error:/)) {
        errorCount++;
        if (errorCount > 5) {
          // If we hit the 6th error, stop parsing
          resultLines.push(`<div class="text-[#E0B25B] mt-2 font-bold">...dan beberapa error lainnya. Perbaiki error pertama dulu, biasanya sisanya ikut hilang.</div>`);
          break;
        }
      }
      
      let formattedLine = line.replace(/\/str\/Main\.java/g, 'Main.java').replace(/\/files\/Main\.java/g, 'Main.java');
      formattedLine = formattedLine.replace(/(Main\.java:\d+(:\d+)?)/g, '<span class="text-[#548AF7] underline cursor-pointer hover:text-blue-400">$1</span>');
      resultLines.push(`<div key="${i}">${formattedLine}</div>`);
    }

    return <div dangerouslySetInnerHTML={{ __html: resultLines.join('') }} />;
  };

  const getFirstErrorHint = (out: string) => {
    if (!out.includes('Error') && !out.includes('Exception')) return null;
    return getErrorHint(out);
  };

  const [encouragement, setEncouragement] = useState("");
  const encouragements = [
    "Gagal itu bagian dari belajar. Yang bikin masa depan suram bukan gagal, tapi berhenti.",
    "Programmer senior pun lebih sering melihat error daripada kode yang langsung jalan.",
    "Kamu sudah sampai sini. Sayang kalau berhenti sekarang.",
    "Setiap error yang kamu pecahkan sendiri, nempel lebih lama daripada seratus jawaban dari AI.",
    "Pelan-pelan tidak apa-apa. Yang penting paham, bukan cepat.",
    "Jangan berhenti di tengah jalan. Yang setengah-setengah hasilnya madesu, yang tuntas hasilnya jadi."
  ];

  const handleCheck = async () => {
    if (code === lastAttemptCode || code === card.starterCode) {
      setOutput('Kodenya belum berubah dari percobaan tadi. Coba ubah sesuatu dulu.');
      return;
    }

    if (attempts === 2 && reflectionText.trim().length < 20) {
      setShowReflectionError(true);
      return;
    }

    setIsRunning(true);
    setTimedOut(false);
    setOutput('Memeriksa jawaban...\n');
    setStatusText(language === 'javascript' ? "Menjalankan JavaScript" : "Memuat Java (sekali saja)");
    try {
      let allPassed = true;
      let finalOutput = '';

      for (let i = 0; i < card.tests.length; i++) {
        const test = card.tests[i];
        const res = language === 'javascript'
          ? await runJsCode(code, card.html, (s) => setStatusText(s))
          : await runJavaCode(code, test.input, (s) => setStatusText(s));

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
        // If they saw solution or used significant hints, they get no bonus. Let's just pass the real attempt count.
        onSuccess(currentHintLevel >= 4 ? 99 : attempts + 1);
      } else if (!timedOut) {
        setOutput(finalOutput);
        setLastAttemptCode(code);
        setAttempts(a => a + 1);
        
        let newEnc = encouragements[Math.floor(Math.random() * encouragements.length)];
        while (newEnc === encouragement) {
          newEnc = encouragements[Math.floor(Math.random() * encouragements.length)];
        }
        setEncouragement(newEnc);
      }
    } catch (e: any) {
      setOutput(`Gagal: ${e.message}`);
      setLastAttemptCode(code);
      setAttempts(a => a + 1);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      <h3 className="font-bold text-lg">{card.prompt}</h3>
      
      {card.steps && showSteps && (
        <div className="brutal-card bg-[var(--color-primary-light)] p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold">Rencana Pengerjaan</h4>
            <button onClick={() => setShowSteps(false)} className="text-sm underline">Sembunyikan</button>
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-sm font-medium">
            {card.steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      )}
      {card.steps && !showSteps && (
        <button onClick={() => setShowSteps(true)} className="text-sm font-bold text-left text-[var(--color-primary)] underline">
          Tampilkan Rencana Pengerjaan
        </button>
      )}

      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-5 shadow-[4px_4px_0_var(--color-primary)]">
          {toastMessage}
        </div>
      )}

      <div 
        className="brutal-border rounded-xl overflow-hidden bg-white"
        onPaste={(e) => {
          e.preventDefault();
          showToast("Ketik sendiri ya. Jari yang mengetik, otak yang ingat.");
        }}
        onDrop={(e) => {
          e.preventDefault();
          showToast("Ketik sendiri ya. Jari yang mengetik, otak yang ingat.");
        }}
      >
        <CodeMirror
          value={code}
          extensions={[
            language === 'javascript' ? javascript() : java(), 
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

      {card.html && language === 'javascript' && (
        <div id="js-dom-output-container" className="mt-4 brutal-border bg-white rounded-xl overflow-hidden min-h-[200px]" style={{ width: '100%', height: '300px' }}>
        </div>
      )}
      
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
          
          {!isSuccess && attempts > 0 && encouragement && (
            <div className="bg-[#FFE838] border-2 border-[var(--color-text-main)] p-3 rounded-lg text-sm font-bold shadow-[2px_2px_0_var(--color-text-main)] mb-2">
              💡 {encouragement}
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-[#1E1F22] rounded-xl border-2 border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] overflow-hidden flex flex-col">
              <div className="bg-[#2B2D30] px-4 py-2 flex items-center gap-2 text-[#DFE1E5] text-xs font-mono border-b border-[#111]">
                <Play className="w-3 h-3 text-[var(--color-success)]" /> Run: {language === 'javascript' ? 'Script' : 'Main'}
              </div>
              <div className="p-4 font-mono text-[14px] leading-[1.6] whitespace-pre-wrap break-words overflow-y-auto max-h-[300px] text-[#DFE1E5]">
                <div className="text-[#6F737A] mb-2">{language === 'javascript' ? 'node script.js' : 'java Main'}</div>
                {formatOutput(output)}
                <div className="text-[#6F737A] mt-2 flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${output.includes('Error:') || output.includes('Gagal:') || output.includes('Exception') ? 'bg-[#F75464]' : 'bg-[#6F737A]'}`} />
                  Process finished with exit code {output.includes('Error:') || output.includes('Gagal:') || output.includes('Exception') ? '1' : '0'}
                </div>
              </div>
            </div>

            {getFirstErrorHint(output) && (
              <div className="bg-[#2B2D30] rounded-xl border-2 border-[var(--color-text-main)] shadow-[4px_4px_0_var(--color-text-main)] p-4 w-full md:w-1/3 shrink-0 h-fit text-[#DFE1E5]">
                <p className="font-bold text-[#E0B25B] mb-1">Artinya:</p>
                <p className="text-sm">{getFirstErrorHint(output)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logic for failures */}
      {!isSuccess && attempts === 1 && (
        <div className="brutal-card bg-[var(--color-danger-light)] p-5 border-2 border-[var(--color-text-main)] space-y-3">
          <h4 className="font-space text-lg font-bold">Berhenti sebentar</h4>
          <p className="text-sm font-medium">Baca lagi pesan errornya pelan-pelan. Baris berapa yang disebut?</p>
          {onNavigateToTheory && (
            <button onClick={onNavigateToTheory} className="brutal-btn bg-white px-4 py-2 text-sm font-bold w-full rounded-lg">
              Baca Lagi Materinya
            </button>
          )}
        </div>
      )}

      {!isSuccess && attempts === 2 && (
        <div className="brutal-card bg-[var(--color-primary-light)] p-5 border-2 border-[var(--color-text-main)] space-y-3">
          <h4 className="font-space text-lg font-bold">Jelaskan dengan kata-katamu</h4>
          <p className="text-sm font-medium">Apa yang menurutmu bikin kodenya belum jalan?</p>
          <textarea
            value={reflectionText}
            onChange={e => {
              setReflectionText(e.target.value);
              setShowReflectionError(false);
            }}
            className={`w-full p-3 rounded-lg border-2 brutal-border font-sans text-sm min-h-[80px] ${showReflectionError ? 'border-red-500 bg-red-50' : 'bg-white'}`}
            placeholder="Ketik minimal 20 karakter..."
          />
          {showReflectionError && <p className="text-red-500 text-xs font-bold">Isi minimal 20 karakter sebelum lanjut ngecek.</p>}
        </div>
      )}

      {!isSuccess && attempts >= 3 && (
        <div className="flex flex-col gap-2 mt-2">
          {attempts >= 3 && currentHintLevel < 1 && card.hints?.[0] && (
            <button onClick={() => setCurrentHintLevel(1)} className="text-sm text-[var(--color-primary)] font-bold text-left underline">
              Lihat Petunjuk 1
            </button>
          )}
          {currentHintLevel >= 1 && card.hints?.[0] && (
            <div className="p-4 bg-[var(--color-bg-base)] text-[var(--color-text-main)] rounded-xl text-sm brutal-border">
              <p className="font-bold mb-1">Petunjuk 1:</p>
              <p>{card.hints[0]}</p>
            </div>
          )}

          {attempts >= 4 && currentHintLevel < 2 && card.hints?.[1] && (
            <button onClick={() => setCurrentHintLevel(2)} className="text-sm text-[var(--color-primary)] font-bold text-left underline">
              Lihat Petunjuk 2
            </button>
          )}
          {currentHintLevel >= 2 && card.hints?.[1] && (
            <div className="p-4 bg-[var(--color-bg-base)] text-[var(--color-text-main)] rounded-xl text-sm brutal-border">
              <p className="font-bold mb-1">Petunjuk 2:</p>
              <p>{card.hints[1]}</p>
            </div>
          )}

          {attempts >= 5 && currentHintLevel < 3 && card.skeleton && (
            <button onClick={() => setCurrentHintLevel(3)} className="text-sm text-[var(--color-primary)] font-bold text-left underline">
              Lihat Kerangka Kode
            </button>
          )}
          {currentHintLevel >= 3 && card.skeleton && (
            <div className="p-4 bg-gray-100 rounded-xl text-sm brutal-border">
              <p className="font-bold mb-1">Kerangka Kode (baca saja):</p>
              <pre className="font-mono text-xs overflow-x-auto p-2 bg-[#1E1F22] text-[#DFE1E5] rounded">{card.skeleton}</pre>
            </div>
          )}

          {attempts >= 7 && currentHintLevel < 4 && card.solution && (
            <div className="brutal-card bg-[var(--color-danger-light)] p-4 border-2 border-[var(--color-text-main)] space-y-3 mt-4">
              <p className="text-sm font-bold">Kamu sudah mencoba 7 kali. Sebelum melihat solusi, kamu harus membuktikan pemahamanmu lagi.</p>
              {onRequireRecheck && (
                <button onClick={onRequireRecheck} className="brutal-btn bg-white text-[var(--color-danger)] px-4 py-2 text-sm font-bold w-full rounded-lg">
                  Ambil Ulang Cek Pemahaman
                </button>
              )}
              {/* Wait, the challenge component itself doesn't know if the user passed the recheck. The parent LessonPage manages the recheck. */}
              {/* If onRequireRecheck is called, the parent should navigate back to the understanding_check and reset its passed status. */}
              {/* We also need a way to know if they came back from a successful recheck. */}
              {/* Actually, if they are here, and attempts >= 7, we could just show "Lihat Solusi" after they pass the recheck. */}
              {/* If they pass the recheck, how does the CodeChallenge know? */}
            </div>
          )}
          
          {currentHintLevel >= 4 && card.solution && (
            <div className="p-4 bg-[var(--color-danger-light)] text-[var(--color-text-main)] rounded-xl text-sm brutal-border">
              <p className="font-bold mb-1">Solusi:</p>
              <p className="text-xs mb-2 italic">Pelajari alurnya, tutup, lalu ketik ulang dari ingatanmu.</p>
              <pre className="font-mono bg-white text-[var(--color-text-main)] p-3 rounded mt-1 brutal-border overflow-x-auto select-none">
                {card.solution}
              </pre>
            </div>
          )}
        </div>
      )}

      {onNavigateToTheory && (
        <div className="pt-4 flex justify-center">
          <button onClick={onNavigateToTheory} className="text-sm font-bold text-gray-500 underline hover:text-[var(--color-text-main)]">
            Saya Belum Paham (Kembali ke Teori)
          </button>
        </div>
      )}
    </div>
  );
}
