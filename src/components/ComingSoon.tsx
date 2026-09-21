import React, { useState } from 'react';

interface ComingSoonProps {
  children: React.ReactNode;
}

export function ComingSoon({ children }: ComingSoonProps) {
  const [showToast, setShowToast] = useState(false);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div 
      className="relative group cursor-not-allowed"
      onClick={handleClick}
      onTouchEnd={handleClick}
    >
      <div className="absolute top-2 right-2 z-20 bg-yellow-200 border-2 border-black px-2 py-0.5 text-xs font-bold shadow-[2px_2px_0_#111] rotate-2 pointer-events-none">
        Segera Hadir
      </div>
      
      <div className="opacity-60 pointer-events-none">
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