import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { PraktikJavaCard } from '../../types/schema';

// Editor CodeMirror diganti textarea biasa, dan Java dijalankan tiruan (CheerpJ tidak ada di tes).
vi.mock('./CodeEditor', () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="kode" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
const { runJavaCode } = vi.hoisted(() => ({ runJavaCode: vi.fn() }));
vi.mock('../../lib/javaRunner', () => ({ runJavaCode }));
const { runJsCode } = vi.hoisted(() => ({ runJsCode: vi.fn() }));
vi.mock('../../lib/jsRunner', () => ({ runJsCode, pratinjauHtml: vi.fn() }));
const { runPhpCode } = vi.hoisted(() => ({ runPhpCode: vi.fn() }));
const { runPythonCode } = vi.hoisted(() => ({ runPythonCode: vi.fn() }));
vi.mock('../../lib/pythonRunner', async (asli) => ({ ...(await asli<typeof import('../../lib/pythonRunner')>()), runPythonCode }));
vi.mock('../../lib/phpRunner', async (asli) => ({ ...(await asli<typeof import('../../lib/phpRunner')>()), runPhpCode }));

import { PraktikJavaCardComponent } from './PraktikJavaCard';

const kelas = (isi: string) => `public class Main {\n    public static void main(String[] args) {\n${isi}\n    }\n}\n`;
const KODE1 = kelas('        System.out.println("Warung Kita");');
const KODE2 = kelas('        System.out.println("Warung Kita");\n        System.out.println("Buka setiap hari");');
const KODE3 = kelas('        int total = 25000;\n        System.out.println("Sisa: " + (total % 3));');

const kartu: PraktikJavaCard = {
  type: 'praktik_java',
  judul: 'Kasir Warung 1: tes',
  pembuka: 'Kita bikin kasir warung.',
  langkah: [
    { arahan: 'Lihat aku dulu ya.', jawaban: KODE1, keluaran: 'Warung Kita', otomatis: true, benar: 'Sekarang giliranmu.', petunjuk: '' },
    { arahan: 'Tambahkan `Buka setiap hari`.', jawaban: KODE2, keluaran: 'Warung Kita\nBuka setiap hari', petunjuk: 'Tulis println lagi.', benar: 'Mantap.' },
    {
      arahan: 'Cetak sisa bagi.',
      kodeAwal: kelas('        int total = 25000;'),
      jawaban: KODE3,
      keluaran: 'Sisa: 1',
      petunjuk: 'Pakai %.',
      tantangan: true,
      wajib: [{ pola: '%\\s*3', pesan: 'pakai operator `%` ya.' }],
    },
  ],
  penutup: 'Kasir pertama selesai.',
};

function tanpaAnimasi() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
  });
}

async function jalankan(kode: string, hasil: { stdout?: string; stderr?: string; exitCode?: number }) {
  runJavaCode.mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0, ...hasil });
  fireEvent.change(screen.getByLabelText('kode'), { target: { value: kode } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
  });
}

describe('Kartu praktik Java bersama Lingga', () => {
  beforeEach(() => {
    runJavaCode.mockReset();
    tanpaAnimasi();
  });

  it('contoh Lingga langsung tampil dengan kode dan hasilnya, lalu editor berisi kode contoh', () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    expect(screen.getByText('Contoh dari Lingga')).toBeInTheDocument();
    expect(screen.getAllByText('Main.java').length).toBe(1);
    expect(screen.getByText('Tugas 1 dari 2')).toBeInTheDocument();
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(KODE1);
  });

  it('setiap tugas menampilkan "Hasil yang harus muncul" sebelum dijalankan', async () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    expect(screen.getAllByText('Hasil yang harus muncul').length).toBe(1);
    await jalankan(KODE2, { stdout: 'Warung Kita\nBuka setiap hari\n' });
    expect(screen.getAllByText('Hasil yang harus muncul').length).toBe(2);
    expect(screen.getAllByText('Sisa: 1').length).toBeGreaterThan(0);
  });

  it('menjalankan kode pengguna, menerima keluaran yang sama, lalu lanjut ke tantangan dengan kode awalnya', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartu} onSuccess={onSuccess} />);
    await jalankan(KODE2, { stdout: 'Warung Kita\nBuka setiap hari\n' });
    expect(runJavaCode).toHaveBeenCalledWith(KODE2, '', expect.any(Function));
    expect(screen.getByText('Mantap.')).toBeInTheDocument();
    expect(screen.getByText('Tantangan · Tugas 2 dari 2')).toBeInTheDocument();
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(kelas('        int total = 25000;'));

    await jalankan(KODE3, { stdout: 'Sisa: 1' });
    expect(screen.getByText('Kasir pertama selesai.')).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('keluaran yang belum sama menampilkan hasil pengguna dan yang diharapkan', async () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    await jalankan(KODE1, { stdout: 'Warung Kita\n' });
    expect(screen.getByText(/hasilnya belum sama/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lihat jawabannya' })).toBeNull();
    await jalankan(KODE1, { stdout: 'Warung Kita\n' });
    fireEvent.click(screen.getByRole('button', { name: 'Lihat jawabannya' }));
    expect((screen.getByLabelText('kode') as HTMLTextAreaElement).value).toBe(KODE2);
  });

  it('error compile ditampilkan rapi dengan saran', async () => {
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    await jalankan(KODE1, { stderr: "/str/Main.java:3: error: ';' expected", exitCode: 1 });
    expect(screen.getByText(/Main\.java:3: error/)).toBeInTheDocument();
    expect(screen.getByText(/belum diakhiri titik koma/)).toBeInTheDocument();
  });

  it('hasil benar tapi pola wajib tidak dipakai tetap ditolak', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartu} onSuccess={onSuccess} />);
    await jalankan(KODE2, { stdout: 'Warung Kita\nBuka setiap hari' });
    await jalankan(kelas('        System.out.println("Sisa: 1");'), { stdout: 'Sisa: 1' });
    expect(screen.getByText(/pakai operator/)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('dengan animasi, Lingga mengetik dulu dan tombol Lewati langsung menampilkan hasil', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
    });
    render(<PraktikJavaCardComponent card={kartu} onSuccess={() => {}} />);
    expect(screen.getByText(/Lingga sedang mengetik/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lewati'));
    expect(screen.getByText('Sekarang giliranmu.')).toBeInTheDocument();
    expect(screen.queryByText(/Lingga sedang mengetik/)).toBeNull();
  });
});

describe('Kartu praktik bahasa JavaScript', () => {
  const kartuJs: PraktikJavaCard = {
    type: 'praktik_java',
    bahasa: 'javascript',
    html: '<ul id="daftar"></ul>',
    judul: 'Todolist JS 1: tes',
    pembuka: 'Kita bikin todolist.',
    langkah: [
      { arahan: 'Lihat aku dulu ya.', jawaban: "console.log('Todo');", keluaran: 'Todo', otomatis: true, benar: 'Giliranmu.', petunjuk: '' },
      { arahan: 'Cetak dua baris.', jawaban: "console.log('Todo');\nconsole.log('Belajar JS');", keluaran: 'Todo\nBelajar JS', petunjuk: 'Tambah console.log.', tantangan: true },
    ],
    penutup: 'Selesai.',
  };

  beforeEach(() => {
    runJsCode.mockReset();
    runJavaCode.mockReset();
    tanpaAnimasi();
  });

  it('memakai script.js, menampilkan halaman, dan menjalankan kode dengan runJsCode beserta html-nya', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartuJs} onSuccess={onSuccess} />);
    expect(screen.getAllByText('script.js').length).toBe(1);
    expect(screen.getByLabelText('Hasil tampilan halaman')).toBeInTheDocument();
    runJsCode.mockResolvedValueOnce({ stdout: 'Todo\nBelajar JS\n', stderr: '', exitCode: 0 });
    const kode = "console.log('Todo');\nconsole.log('Belajar JS');";
    fireEvent.change(screen.getByLabelText('kode'), { target: { value: kode } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(runJsCode).toHaveBeenCalledWith(kode, '<ul id="daftar"></ul>', expect.any(Function));
    expect(runJavaCode).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('error JavaScript ditampilkan tanpa saran khusus Java', async () => {
    render(<PraktikJavaCardComponent card={kartuJs} onSuccess={() => {}} />);
    runJsCode.mockResolvedValueOnce({ stdout: '', stderr: 'ReferenceError: todo is not defined', exitCode: 1 });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(screen.getByText('ReferenceError: todo is not defined')).toBeInTheDocument();
  });
});

describe('Kartu praktik bahasa PHP', () => {
  const kartuPhp: PraktikJavaCard = {
    type: 'praktik_java',
    bahasa: 'php',
    judul: 'Todolist PHP 1: tes',
    pembuka: 'Kita bikin todolist dengan PHP.',
    langkah: [
      { arahan: 'Lihat aku dulu ya.', jawaban: '<?php\necho "Todo\\n";', keluaran: 'Todo', otomatis: true, benar: 'Giliranmu.', petunjuk: '' },
      { arahan: 'Cetak dua baris.', jawaban: '<?php\necho "Todo\\n";\necho "Belajar PHP\\n";', keluaran: 'Todo\nBelajar PHP', petunjuk: 'Tambah echo.', tantangan: true },
    ],
    penutup: 'Selesai.',
  };

  beforeEach(() => {
    runPhpCode.mockReset();
    runJavaCode.mockReset();
    tanpaAnimasi();
  });

  it('memakai main.php dan menjalankan kode dengan runPhpCode', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartuPhp} onSuccess={onSuccess} />);
    expect(screen.getAllByText('main.php').length).toBe(1);
    runPhpCode.mockResolvedValueOnce({ stdout: 'Todo\nBelajar PHP\n', stderr: '', exitCode: 0 });
    const kode = kartuPhp.langkah[1].jawaban;
    fireEvent.change(screen.getByLabelText('kode'), { target: { value: kode } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(runPhpCode).toHaveBeenCalledWith(kode, expect.any(Function));
    expect(runJavaCode).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('error PHP ditampilkan dengan penjelasan singkat', async () => {
    render(<PraktikJavaCardComponent card={kartuPhp} onSuccess={() => {}} />);
    runPhpCode.mockResolvedValueOnce({ stdout: '', stderr: 'Parse error: syntax error, unexpected token "echo" in main.php on line 3', exitCode: 255 });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(screen.getByText(/unexpected token "echo"/)).toBeInTheDocument();
    expect(screen.getByText(/titik koma/)).toBeInTheDocument();
  });
});

describe('Kartu praktik bahasa Python', () => {
  const kartuPy: PraktikJavaCard = {
    type: 'praktik_java',
    bahasa: 'python',
    judul: 'Todolist Python 1: tes',
    pembuka: 'Kita bikin todolist dengan Python.',
    langkah: [
      { arahan: 'Lihat aku dulu ya.', jawaban: 'print("Todo")', keluaran: 'Todo', otomatis: true, benar: 'Giliranmu.', petunjuk: '' },
      { arahan: 'Baca judul.', jawaban: 'print("Todo")\njudul = input()\nprint(judul)', input: 'Masak\n', keluaran: 'Todo\nMasak', petunjuk: 'Pakai input().', tantangan: true },
    ],
    penutup: 'Selesai.',
  };

  beforeEach(() => {
    runPythonCode.mockReset();
    runJavaCode.mockReset();
    tanpaAnimasi();
  });

  it('memakai main.py dan mengirim input langkah ke runPythonCode', async () => {
    const onSuccess = vi.fn();
    render(<PraktikJavaCardComponent card={kartuPy} onSuccess={onSuccess} />);
    expect(screen.getAllByText('main.py').length).toBe(1);
    runPythonCode.mockResolvedValueOnce({ stdout: 'Todo\nMasak\n', stderr: '', exitCode: 0 });
    const kode = kartuPy.langkah[1].jawaban;
    fireEvent.change(screen.getByLabelText('kode'), { target: { value: kode } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(runPythonCode).toHaveBeenCalledWith(kode, 'Masak\n', expect.any(Function));
    expect(runJavaCode).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith(1);
  });

  it('error Python ditampilkan dengan penjelasan singkat', async () => {
    render(<PraktikJavaCardComponent card={kartuPy} onSuccess={() => {}} />);
    runPythonCode.mockResolvedValueOnce({ stdout: '', stderr: 'Traceback (most recent call last):\n  File "main.py", line 2\nNameError: name \'judl\' is not defined', exitCode: 1 });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Jalankan/ }));
    });
    expect(screen.getByText(/NameError artinya/)).toBeInTheDocument();
  });
});
