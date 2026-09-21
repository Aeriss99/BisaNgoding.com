import { useState, useEffect } from 'react';
import type { FillBlankCard, ReorderCard, PredictOutputCard, UnderstandingCheckCard } from '../../types/schema';
import { Play, CheckCircle, Check, X, AlertTriangle } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function UnderstandingCheckCardComponent({ 
  card, 
  onSuccess,
  onNavigateToTheory
}: { 
  card: UnderstandingCheckCard; 
  onSuccess: (attempts: number) => void;
  onNavigateToTheory: () => void;
}) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isPassed, setIsPassed] = useState(false);

  // Shuffle logic
  const shuffleQuestions = () => {
    const arr = [...card.questions];
    arr.sort(() => Math.random() - 0.5);
    setQuestions(arr);
    setCurrentIdx(0);
  };

  useEffect(() => {
    shuffleQuestions();
  }, [card]);

  const q = questions[currentIdx];

  const handleSelect = (idx: number) => {
    setSelected(idx);
    setShowResult(true);
    if (idx === q.answer) {
      const newCount = correctCount + 1;
      if (newCount >= card.minCorrect) {
        setIsPassed(true);
        onSuccess(1);
      } else {
        setCorrectCount(newCount);
      }
    } else {
      setCorrectCount(0);
    }
  };

  const nextQuestion = () => {
    setSelected(null);
    setShowResult(false);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      shuffleQuestions();
    }
  };

  if (!q) return null;

  return (
    <div className="space-y-6">
      <div className="border-b-2 border-[var(--color-text-main)] pb-4">
        <h2 className="font-space text-2xl flex items-center gap-2">
          Cek Pemahaman
        </h2>
        <p className="text-gray-600 font-medium">Jawab dulu pertanyaan ini sebelum lanjut ke tantangan.</p>
        
        <div className="mt-4 flex gap-1 items-center">
          {Array.from({ length: card.minCorrect }).map((_, i) => (
            <div key={i} className={`w-8 h-2 rounded-full border border-[var(--color-text-main)] ${i < correctCount ? 'bg-[var(--color-success)]' : 'bg-gray-200'}`} />
          ))}
          <span className="text-xs font-mono font-bold text-gray-500 ml-2">{correctCount} dari {card.minCorrect} benar</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">{q.question}</h3>
        {q.code && (
          <div className="border-2 border-[var(--color-text-main)] rounded-xl overflow-hidden">
            <CodeMirror
              value={q.code}
              extensions={[java()]}
              theme="light"
              readOnly={true}
              basicSetup={{ lineNumbers: true }}
            />
          </div>
        )}

        <div className="space-y-2 mt-4">
          {q.options.map((opt: string, i: number) => {
            const isSelected = selected === i;
            const isCorrectOption = i === q.answer;
            let btnClass = 'border-gray-200 hover:border-blue-300';
            
            if (showResult) {
              if (isCorrectOption) btnClass = 'border-green-500 bg-green-50 shadow-[2px_2px_0_#111] translate-y-[-2px]';
              else if (isSelected) btnClass = 'border-red-500 bg-red-50 opacity-50 shadow-[0_0_0_#111] translate-y-0';
              else btnClass = 'border-gray-200 opacity-50 shadow-[0_0_0_#111] translate-y-0';
            }

            return (
              <button
                key={i}
                disabled={showResult}
                onClick={() => handleSelect(i)}
                className={`w-full text-left p-4 rounded-xl transition-all font-sans font-medium text-base brutal-btn bg-white ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="animate-in fade-in slide-in-from-bottom-4 mt-6">
            {selected === q.answer ? (
              <div className="brutal-card bg-[var(--color-success)] text-white p-5 space-y-4">
                <div className="font-space text-lg flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" /> Benar!
                </div>
                <p className="font-medium">{q.explanation}</p>
                {!isPassed && (
                  <button onClick={nextQuestion} className="w-full bg-white text-[var(--color-text-main)] font-bold py-3 rounded-xl brutal-btn">
                    Soal Berikutnya
                  </button>
                )}
              </div>
            ) : (
              <div className="brutal-card bg-[#FFE838] text-[var(--color-text-main)] p-5 space-y-4">
                <div className="font-space text-lg flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" /> Coba kita lihat dari sisi lain
                </div>
                <div className="prose prose-sm prose-black max-w-none font-medium">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.remedial}</ReactMarkdown>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button onClick={onNavigateToTheory} className="flex-1 bg-white border-2 border-[var(--color-text-main)] font-bold py-3 rounded-xl brutal-btn">
                    Baca Lagi Teorinya
                  </button>
                  <button onClick={nextQuestion} className="flex-1 bg-[var(--color-text-main)] text-white font-bold py-3 rounded-xl brutal-btn shadow-[3px_3px_0_var(--color-primary)]">
                    Coba Soal Lain
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FillBlankCardComponent({ card, onSuccess }: { card: FillBlankCard, onSuccess: (attempts: number) => void }) {
  const parts = card.code.split('___');
  const [inputs, setInputs] = useState<string[]>(Array(card.answers.length).fill(''));
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleCheck = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    let allCorrect = true;
    for (let i = 0; i < card.answers.length; i++) {
      const validAnswers = card.answers[i].split('|').map(a => a.trim());
      if (!validAnswers.includes(inputs[i].trim())) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) {
      setIsSuccess(true);
      setErrorMsg('');
      onSuccess(newAttempts);
    } else {
      setErrorMsg('Masih ada yang salah. Coba periksa lagi!');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Lengkapi kode berikut:</h3>
      <div className="p-4 bg-gray-50 border rounded-lg font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                type="text"
                value={inputs[i]}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[i] = e.target.value;
                  setInputs(newInputs);
                }}
                disabled={isSuccess}
                className={`mx-1 px-1 border-b-2 bg-transparent outline-none w-20 text-center ${
                  isSuccess ? 'border-green-500 text-green-700' : 'border-blue-500 focus:border-blue-700'
                }`}
              />
            )}
          </span>
        ))}
      </div>
      
      {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

      <button 
        onClick={handleCheck}
        disabled={isSuccess}
        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
          isSuccess 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
        }`}
      >
        {isSuccess ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {isSuccess ? 'Benar!' : 'Cek Jawaban'}
      </button>
    </div>
  );
}

export function PredictOutputCardComponent({ card, onSuccess }: { card: PredictOutputCard, onSuccess: (attempts: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSelect = (idx: number) => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setSelected(idx);
    setShowExplanation(true);
    if (idx === card.answer) {
      setIsSuccess(true);
      onSuccess(newAttempts);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Apa output dari program ini?</h3>
      <div className="border rounded-lg overflow-hidden border-gray-300">
        <CodeMirror
          value={card.code}
          extensions={[java()]}
          theme="light"
          readOnly={true}
          basicSetup={{ lineNumbers: true }}
        />
      </div>

      <div className="space-y-2 mt-4">
        {card.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrectOption = i === card.answer;
          let btnClass = 'border-gray-200 hover:border-blue-300';
          
          if (showExplanation) {
            if (isCorrectOption) btnClass = 'border-green-500 bg-green-50';
            else if (isSelected) btnClass = 'border-red-500 bg-red-50 opacity-50';
            else btnClass = 'border-gray-200 opacity-50';
          }

          return (
            <button
              key={i}
              disabled={showExplanation && isSuccess}
              onClick={() => handleSelect(i)}
              className={`w-full text-left p-4 rounded-xl transition-colors font-mono text-sm brutal-btn bg-white ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className={`p-4 rounded-xl mt-4 brutal-border ${isSuccess ? 'bg-[var(--color-success)] text-[var(--color-text-main)]' : 'bg-[var(--color-danger)] text-white'}`}>
          <div className="font-bold flex items-center gap-2 mb-1">
            {isSuccess ? <Check className="w-5 h-5"/> : <X className="w-5 h-5" />}
            {isSuccess ? 'Benar!' : 'Kurang Tepat!'}
          </div>
          <p>{card.explanation}</p>
          {!isSuccess && (
            <button onClick={() => { setSelected(null); setShowExplanation(false); }} className="mt-3 bg-white px-4 py-2 rounded-xl text-[var(--color-text-main)] text-sm font-extrabold w-full brutal-btn">
              Coba Lagi
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ReorderCardComponent({ card, onSuccess }: { card: ReorderCard, onSuccess: (attempts: number) => void }) {
  const [items, setItems] = useState<{id: number, text: string}[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);

  // Initialize shuffled
  useEffect(() => {
    const arr = card.lines.map((text, i) => ({ id: i, text }));
    // Simple shuffle
    arr.sort(() => Math.random() - 0.5);
    setItems(arr);
  }, [card]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
  };

  const handleCheck = () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    let allCorrect = true;
    for (let i = 0; i < card.correctOrder.length; i++) {
      if (items[i].id !== card.correctOrder[i]) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) {
      setIsSuccess(true);
      setErrorMsg('');
      onSuccess(newAttempts);
    } else {
      setErrorMsg('Urutannya masih ada yang salah. Coba lagi!');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">{card.prompt}</h3>
      <p className="text-sm text-gray-500 mb-2">Gunakan tombol ⬆️ dan ⬇️ untuk menyusun baris kode yang benar.</p>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className={`flex items-center gap-2 p-3 bg-gray-50 border rounded-lg ${isSuccess ? 'border-green-300' : 'border-gray-200'}`}>
            <div className="flex flex-col gap-1">
              <button disabled={isSuccess || index === 0} onClick={() => moveUp(index)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▲</button>
              <button disabled={isSuccess || index === items.length - 1} onClick={() => moveDown(index)} className="text-gray-400 hover:text-gray-700 disabled:opacity-30">▼</button>
            </div>
            <div className="flex-1 font-mono text-sm overflow-x-auto whitespace-pre">{item.text}</div>
          </div>
        ))}
      </div>

      {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}

      <button 
        onClick={handleCheck}
        disabled={isSuccess}
        className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm ${
          isSuccess 
            ? 'bg-green-100 text-green-700' 
            : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white'
        }`}
      >
        {isSuccess ? <CheckCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        {isSuccess ? 'Benar!' : 'Cek Jawaban'}
      </button>
    </div>
  );
}
