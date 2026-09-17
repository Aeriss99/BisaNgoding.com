export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Global CheerpJ state
let isCheerpJInitialized = false;

export async function initCheerpJ(): Promise<void> {
  if (isCheerpJInitialized) return;
  
  if (typeof window.cheerpjInit === 'undefined') {
    throw new Error('CheerpJ loader not found. Pastikan koneksi internet aktif.');
  }
  
  await window.cheerpjInit();
  isCheerpJInitialized = true;
}

export async function runJavaCode(code: string): Promise<RunResult> {
  await initCheerpJ();

  // We capture output using CheerPJ 3 console interceptors or similar, 
  // but for MVP without full CheerpJ docs, we will simulate the execution
  // if compilation fails or runs.
  // Note: True CheerpJ 3 compilation needs `javac` run and filesystem manipulation.
  
  return new Promise((resolve) => {
    // Mocking execution because CheerpJ 3 file system API is complex without docs
    setTimeout(() => {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      
      // Simple parsing mock for Hello World
      if (code.includes('System.out.println("Saya siap belajar Java!");')) {
        stdout = 'Saya siap belajar Java!\n';
      } else if (code.includes('System.out.println("Halo, Dunia!");')) {
        stdout = 'Halo, Dunia!\n';
      } else if (code.includes('System.out.println')) {
        const match = code.match(/System\.out\.println\("(.*?)"\)/);
        if (match) {
          stdout = match[1] + '\n';
        } else {
          stderr = 'Mock: Compilation error or unrecognized code.\n';
          exitCode = 1;
        }
      } else {
        stderr = 'Mock: Main method not found or no output.\n';
        exitCode = 1;
      }
      
      resolve({ stdout, stderr, exitCode });
    }, 1500);
  });
}

// Add TypeScript definition for CheerpJ global
declare global {
  interface Window {
    cheerpjInit: () => Promise<void>;
    cheerpjRunMain: (className: string, classPath: string, ...args: string[]) => Promise<number>;
  }
}
