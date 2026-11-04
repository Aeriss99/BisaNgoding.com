import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  kunciCek,
  kunciQuiz,
  catatSalah,
  catatBenar,
  catatSalahLatihan,
  gabungLatihanUlang,
  ambilSoalLatihan,
  daftarAktif,
} from '../lib/latihanUlang';
import { mergeProgress } from '../lib/cloudProgress';
import { getQuizQuestions, getVisibleLessons } from '../lib/content';
import type {
  EntriLatihanUlang,
  QuizQuestion,
  UnderstandingCheckCard,
  UserProgress,
} from '../types/schema';
import { UnderstandingCheckCardComponent } from '../components/cards/QuizCards';
import LatihanUlang from '../pages/LatihanUlang';

let mockProgressValue: UserProgress;
const mockCatatLatihan = vi.fn();

vi.mock('../context/ProgressContext', () => ({
  useProgress: () => ({
    progress: mockProgressValue,
    catatJawabanLatihan: mockCatatLatihan,
  }),
}));

describe('Kunci Soal Latihan Ulang', () => {
  it('kunciCek sama untuk soal yang sama walaupun urutan pilihannya berbeda; beda kalau teks atau code beda', () => {
    const q1 = {
      question: 'Apa itu Git?',
      options: ['Sistem kontrol versi', 'Bahasa pemrograman'],
      answer: 0,
    };
    const q1Acak = {
      question: 'Apa itu Git?',
      options: ['Bahasa pemrograman', 'Sistem kontrol versi'],
      answer: 1,
    };
    const q2TeksBeda = {
      question: 'Apa itu GitHub?',
      options: ['Sistem kontrol versi', 'Bahasa pemrograman'],
      answer: 0,
    };
    const q3CodeBeda = {
      question: 'Apa itu Git?',
      code: 'git status',
      options: ['A', 'B'],
      answer: 0,
    };

    const k1 = kunciCek('lesson-git-01', q1);
    const k1Acak = kunciCek('lesson-git-01', q1Acak);
    const k2 = kunciCek('lesson-git-01', q2TeksBeda);
    const k3 = kunciCek('lesson-git-01', q3CodeBeda);

    expect(k1).toBe(k1Acak);
    expect(k1).not.toBe(k2);
    expect(k1).not.toBe(k3);
    expect(k1.startsWith('cek:lesson-git-01:')).toBe(true);
  });

  it('kunciQuiz menghasilkan format quiz:<id>', () => {
    const q: QuizQuestion = {
      id: 'git-q1',
      question: 'Apa itu Git?',
      options: ['VCS', 'IDE'],
      answer: 0,
      explanation: 'VCS',
    };
    expect(kunciQuiz(q)).toBe('quiz:git-q1');
  });
});

describe('Siklus Pencatatan Jawaban Latihan Ulang', () => {
  it('catatSalah -> catatBenar -> catatBenar = selesai; catatSalah lagi mengaktifkan kembali dengan benar 0; catatBenar lalu catatSalahLatihan -> benar kembali 0', () => {
    const k = 'cek:lesson-1:abc12345';

    // 1. Catat salah pertama kali di materi
    let d = catatSalah(undefined, k, 'cek', 'lesson-1', '2026-11-04T10:00:00Z');
    expect(d[k]).toEqual({
      jenis: 'cek',
      sumber: 'lesson-1',
      benar: 0,
      selesai: false,
      diubah: '2026-11-04T10:00:00Z',
    });

    // 2. Jawab benar sekali di latihan ulang
    d = catatBenar(d, k, '2026-11-04T10:01:00Z');
    expect(d[k].benar).toBe(1);
    expect(d[k].selesai).toBe(false);

    // 3. Jawab benar kedua kali -> selesai!
    d = catatBenar(d, k, '2026-11-04T10:02:00Z');
    expect(d[k].benar).toBe(2);
    expect(d[k].selesai).toBe(true);

    // 4. Catat salah lagi (misal mengulang materi) -> aktif kembali dengan benar 0
    d = catatSalah(d, k, 'cek', 'lesson-1', '2026-11-04T10:03:00Z');
    expect(d[k].benar).toBe(0);
    expect(d[k].selesai).toBe(false);

    // 5. Jawab benar 1 kali lalu jawab salah di latihan ulang -> kembali ke benar 0
    d = catatBenar(d, k, '2026-11-04T10:04:00Z');
    expect(d[k].benar).toBe(1);

    d = catatSalahLatihan(d, k, '2026-11-04T10:05:00Z');
    expect(d[k].benar).toBe(0);
    expect(d[k].selesai).toBe(false);
  });
});

describe('Penggabungan Progres (gabungLatihanUlang & mergeProgress)', () => {
  it('gabungLatihanUlang: kunci di satu sisi ikut; kunci di kedua sisi memakai yang diubah lebih baru', () => {
    const local: Record<string, EntriLatihanUlang> = {
      k1: {
        jenis: 'cek',
        sumber: 'l1',
        benar: 1,
        selesai: false,
        diubah: '2026-11-04T10:00:00Z',
      },
      k_lokal: {
        jenis: 'quiz',
        sumber: 'm1',
        benar: 0,
        selesai: false,
        diubah: '2026-11-04T10:01:00Z',
      },
    };

    const cloud: Record<string, EntriLatihanUlang> = {
      // k1 di cloud lebih baru dan sudah selesai
      k1: {
        jenis: 'cek',
        sumber: 'l1',
        benar: 2,
        selesai: true,
        diubah: '2026-11-04T10:05:00Z',
      },
      k_cloud: {
        jenis: 'quiz',
        sumber: 'm2',
        benar: 1,
        selesai: false,
        diubah: '2026-11-04T10:02:00Z',
      },
    };

    const merged = gabungLatihanUlang(local, cloud);
    expect(merged.k_lokal).toBeDefined();
    expect(merged.k_cloud).toBeDefined();
    // Entri selesai yang lebih baru mengalahkan entri aktif yang lebih lama
    expect(merged.k1.selesai).toBe(true);
    expect(merged.k1.benar).toBe(2);
    expect(merged.k1.diubah).toBe('2026-11-04T10:05:00Z');
  });

  it('mergeProgress membawa latihanUlang dari keduanya dan tidak mengubah hasil gabungan bidang lain', () => {
    const pLocal: UserProgress = {
      completedLessons: ['l1'],
      passedChecks: [],
      moduleStatus: {},
      quizScores: {},
      xp: 100,
      streak: 2,
      lastActiveDate: '2026-11-04',
      latihanUlang: {
        k1: {
          jenis: 'cek',
          sumber: 'l1',
          benar: 0,
          selesai: false,
          diubah: '2026-11-04T09:00:00Z',
        },
      },
    };

    const pCloud: UserProgress = {
      completedLessons: ['l2'],
      passedChecks: [],
      moduleStatus: {},
      quizScores: {},
      xp: 200,
      streak: 3,
      lastActiveDate: '2026-11-04',
      latihanUlang: {
        k2: {
          jenis: 'quiz',
          sumber: 'm1',
          benar: 1,
          selesai: false,
          diubah: '2026-11-04T09:30:00Z',
        },
      },
    };

    const merged = mergeProgress(pLocal, pCloud);
    expect(merged.completedLessons).toEqual(['l1', 'l2']);
    expect(merged.xp).toBe(200);
    expect(merged.latihanUlang?.k1).toBeDefined();
    expect(merged.latihanUlang?.k2).toBeDefined();
  });
});

describe('ambilSoalLatihan', () => {
  it('kunci quiz dari modul sungguhan ditemukan; kunci cek dari materi sungguhan ditemukan; kunci karangan -> null', () => {
    // 1. Kunci quiz modul sungguhan (git-dasar)
    const quizGit = getQuizQuestions('git-dasar');
    expect(quizGit && quizGit.length > 0).toBe(true);
    const qQuiz0 = quizGit![0];
    const kunciQ = kunciQuiz(qQuiz0);

    const soalQuiz = ambilSoalLatihan(kunciQ, {
      jenis: 'quiz',
      sumber: 'git-dasar',
      benar: 0,
      selesai: false,
      diubah: '2026-11-04T00:00:00Z',
    });
    expect(soalQuiz).not.toBeNull();
    expect(soalQuiz?.question).toBe(qQuiz0.question);
    expect(soalQuiz?.options).toEqual(qQuiz0.options);
    expect(soalQuiz?.namaKelas).toBe('Git & GitHub');

    // 2. Kunci cek pemahaman dari materi sungguhan
    const allVisible = getVisibleLessons('git-dasar');
    const lessonDenganCheck = allVisible.find((l) =>
      l.cards.some((c) => c.type === 'understanding_check')
    );
    expect(lessonDenganCheck).toBeDefined();

    const checkCard = lessonDenganCheck!.cards.find(
      (c) => c.type === 'understanding_check'
    ) as UnderstandingCheckCard;
    const qCek0 = checkCard.questions[0];
    const kunciC = kunciCek(lessonDenganCheck!.id, qCek0);

    const soalCek = ambilSoalLatihan(kunciC, {
      jenis: 'cek',
      sumber: lessonDenganCheck!.id,
      benar: 0,
      selesai: false,
      diubah: '2026-11-04T00:00:00Z',
    });
    expect(soalCek).not.toBeNull();
    expect(soalCek?.question).toBe(qCek0.question);
    expect(soalCek?.remedial).toBe(qCek0.remedial);

    // 3. Kunci karangan / tidak ada
    const ngawurQuiz = ambilSoalLatihan('quiz:id-tidak-ada', {
      jenis: 'quiz',
      sumber: 'git-dasar',
      benar: 0,
      selesai: false,
      diubah: '2026-11-04T00:00:00Z',
    });
    expect(ngawurQuiz).toBeNull();

    const ngawurCek = ambilSoalLatihan('cek:sumber-palsu:12345678', {
      jenis: 'cek',
      sumber: 'sumber-palsu',
      benar: 0,
      selesai: false,
      diubah: '2026-11-04T00:00:00Z',
    });
    expect(ngawurCek).toBeNull();
  });
});

describe('Komponen UnderstandingCheckCardComponent onSalah', () => {
  it('menjawab salah di UnderstandingCheckCardComponent memanggil onSalah dengan soal itu; menjawab benar tidak memanggilnya', () => {
    const onSalahMock = vi.fn();
    const card: UnderstandingCheckCard = {
      type: 'understanding_check',
      minCorrect: 2,
      questions: [
        {
          question: 'Berapa 1 + 1?',
          options: ['2', '3'],
          answer: 0,
          explanation: '1 + 1 = 2',
          remedial: 'Pelajari dasar penjumlahan.',
        },
      ],
    };

    const { rerender } = render(
      React.createElement(UnderstandingCheckCardComponent, {
        card,
        onSuccess: vi.fn(),
        onNavigateToTheory: vi.fn(),
        onSalah: onSalahMock,
      })
    );

    // Klik opsi salah (index 1)
    const tombolSalah = screen.getByRole('button', { name: '3' });
    fireEvent.click(tombolSalah);

    expect(onSalahMock).toHaveBeenCalledTimes(1);
    expect(onSalahMock).toHaveBeenCalledWith(
      expect.objectContaining({ question: card.questions[0].question })
    );

    // Rerender ulang untuk uji jawaban benar
    onSalahMock.mockClear();
    rerender(
      React.createElement(UnderstandingCheckCardComponent, {
        card: { ...card },
        onSuccess: vi.fn(),
        onNavigateToTheory: vi.fn(),
        onSalah: onSalahMock,
      })
    );

    const tombolBenar = screen.getByRole('button', { name: '2' });
    fireEvent.click(tombolBenar);

    expect(onSalahMock).not.toHaveBeenCalled();
  });
});

describe('Halaman Latihan Ulang (/latihan-ulang)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('progres tanpa entri -> teks kosong', () => {
    mockProgressValue = {
      completedLessons: [],
      moduleStatus: {},
      quizScores: {},
      xp: 0,
      streak: 0,
      lastActiveDate: '2026-11-04',
      latihanUlang: {},
    };

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(LatihanUlang, null)
      )
    );

    expect(
      screen.getByText(/Belum ada soal untuk diulang/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Lanjut belajar/i })
    ).toBeInTheDocument();
  });

  it('satu entri quiz -> soal tampil, jawab benar -> "Benar 1 dari 2"', async () => {
    const quizGit = getQuizQuestions('git-dasar')!;
    const q0 = quizGit[0];
    const k = kunciQuiz(q0);

    mockProgressValue = {
      completedLessons: [],
      moduleStatus: {},
      quizScores: {},
      xp: 0,
      streak: 0,
      lastActiveDate: '2026-11-04',
      latihanUlang: {
        [k]: {
          jenis: 'quiz',
          sumber: 'git-dasar',
          benar: 0,
          selesai: false,
          diubah: '2026-11-04T10:00:00Z',
        },
      },
    };

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(LatihanUlang, null)
      )
    );

    // Soal tampil
    expect(screen.getByText(q0.question)).toBeInTheDocument();

    // Jawaban benar dicari berdasarkan teks opsi q0.options[q0.answer]
    const opsiBenarTeks = q0.options[q0.answer];
    const tombolBenar = screen.getByRole('button', { name: opsiBenarTeks });

    fireEvent.click(tombolBenar);

    // Memanggil catatJawabanLatihan dengan benar = true
    expect(mockCatatLatihan).toHaveBeenCalledWith(k, true);

    // Penanda kecil "Benar 1 dari 2" muncul
    expect(await screen.findByText('Benar 1 dari 2')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Benar!')).toBeInTheDocument();
  });
});
