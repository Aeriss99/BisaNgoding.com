import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Lesson } from '../types/schema';

let srcTerakhir: string | null = null;

class FakeAudio {
  src: string;
  playbackRate = 1;
  defaultPlaybackRate = 1;

  constructor(src?: string) {
    this.src = src ?? '';
    srcTerakhir = this.src;
  }

  play(): Promise<void> {
    return Promise.resolve();
  }

  pause(): void {}
}

describe('Suara siap tanpa jeda unduh', () => {
  let suaraModule: typeof import('../lib/suara');

  beforeEach(async () => {
    vi.resetModules();
    srcTerakhir = null;

    const mockFetch = vi.fn(
      async () => new Response(new Blob(['x'], { type: 'audio/mpeg' }), { status: 200 })
    );
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('Audio', FakeAudio);

    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:siap'),
      writable: true,
      configurable: true,
    });

    suaraModule = await import('../lib/suara');
  });

  it('teksSuaraLatihan mengumpulkan teks yang benar dari berbagai jenis kartu dan newWords', () => {
    const contohLesson: Lesson = {
      id: 'lesson-test',
      title: 'Pelajaran Uji',
      mode: 'latihan',
      cards: [
        {
          type: 'listen_tiles',
          text: 'Good morning.',
          options: ['Good', 'morning'],
        },
        {
          type: 'translate_tiles',
          direction: 'en-id',
          prompt: 'How are you?',
          options: ['Bagaimana', 'kabarmu'],
          answers: [['Bagaimana', 'kabarmu']],
        },
        {
          type: 'translate_tiles',
          direction: 'id-en',
          prompt: 'Selamat pagi',
          options: ['Good', 'morning'],
          answers: [['Good', 'morning']],
        },
        {
          type: 'type_translation',
          direction: 'en-id',
          prompt: 'Thank you',
          answers: ['Terima kasih'],
        },
        {
          type: 'type_translation',
          direction: 'id-en',
          prompt: 'Sama-sama',
          answers: ["You're welcome"],
        },
        {
          type: 'match_pairs',
          pairs: [
            { en: 'yes', id: 'ya' },
            { en: 'no', id: 'tidak' },
          ],
        },
      ],
      newWords: [{ word: 'hello', translation: 'halo' }],
    };

    const hasil = suaraModule.teksSuaraLatihan(contohLesson);
    expect(hasil).toEqual([
      'Good morning.',
      'How are you?',
      'Good morning',
      'Thank you',
      "You're welcome",
      'yes',
      'no',
      'hello',
    ]);
  });

  it('siapkanSuara hanya memanggil fetch tepat 1 kali untuk rekaman yang valid dan tidak dobel', async () => {
    await suaraModule.siapkanSuara([
      'Hi, good morning.',
      'Hi, good morning.',
      'kalimat yang tidak pernah direkam',
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('setelah siapkanSuara, ucapkan memutar Audio dengan blob URL dan hasil rekaman', async () => {
    await suaraModule.siapkanSuara(['Hi, good morning.']);
    const hasil = await suaraModule.ucapkan('Hi, good morning.');
    expect(srcTerakhir).toBe('blob:siap');
    expect(hasil).toBe('rekaman');
  });
});
