import { useState, useEffect } from 'react';
import type { FillBlankCard, ReorderCard, PredictOutputCard } from '../../types/schema';
import { Play, CheckCircle, Check, X } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { java } from '@codemirror/lang-java';

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
