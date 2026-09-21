import React, { useState } from 'react';

interface ComingSoonProps {
  children: React.ReactNode;
  inline?: boolean;
  text?: string;
}

export function ComingSoon({ children, inline = false, text = "SEGERA" }: ComingSoonProps) {
  const [showToast, setShowToast] = useState(false);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  if (inline) {
    return (
      <div 
        className="inline-flex items-center gap-2 cursor-not-allowed group relative"
        onClick={handleClick}
        onTouchEnd={handleClick}
      >
        <div className="opacity-60 pointer-events-none flex items-center">
          {children}
        </div>
        <div className="bg-[var(--color-primary-light)] border border-[var(--color-text-main)] px-1.5 py-0.5 text-[10px] font-mono font-bold shadow-[2px_2px_0_var(--color-text-main)] pointer-events-none whitespace-nowrap">
          {text}
        </div>
        {showToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-5">
            Fitur ini segera hadir
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className="relative group cursor-not-allowed h-full"
      onClick={handleClick}
      onTouchEnd={handleClick}
    >
      <div className="absolute top-2 right-2 z-20 bg-[var(--color-primary-light)] border-2 border-[var(--color-text-main)] px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0_var(--color-text-main)] rotate-2 pointer-events-none">
        Segera Hadir
      </div>
      
      <div className="opacity-60 pointer-events-none h-full">
        {children}
      </div>

      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-4 py-2 rounded-lg font-medium text-sm animate-in fade-in slide-in-from-bottom-5">
          Fitur ini segera hadir
        </div>
      )}
    </div>
  );
}