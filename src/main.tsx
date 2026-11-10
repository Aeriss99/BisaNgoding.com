import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { runJavaCode } from './lib/javaRunner';
import { runTsCode } from './lib/tsRunner';
import { pasangPembaruanOtomatis } from './lib/pembaruanAplikasi';

// Expose for testing
(window as any).runJavaCode = runJavaCode;
(window as any).runTsCode = runTsCode;

// Muat versi terbaru otomatis (tidak saat sedang mengerjakan materi atau quiz)
pasangPembaruanOtomatis();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
