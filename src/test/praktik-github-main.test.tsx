import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as path from 'path';
import * as fs from 'fs';
import type { Lesson, PraktikGitHubCard } from '../types/schema';
import { PraktikGitHubCardComponent } from '../components/cards/PraktikGitHubCard';

function kurangiGerak(kurangi: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      matches: kurangi && q.includes('reduce'),
      media: q,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('Simulasi Main Setiap Kartu Praktik GitHub', () => {
  const asliMatchMedia = window.matchMedia;

  beforeEach(() => {
    localStorage.clear();
    kurangiGerak(true);
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: asliMatchMedia });
  });

  const contentDir = path.resolve(__dirname, '../../content/git');
  const dirs = fs.readdirSync(contentDir).filter((f) => fs.statSync(path.join(contentDir, f)).isDirectory());

  const semuaKartu: { lessonTitle: string; file: string; card: PraktikGitHubCard }[] = [];

  for (const dir of dirs) {
    const files = fs.readdirSync(path.join(contentDir, dir)).filter((f) => f.startsWith('lesson-') && f.endsWith('.json'));
    for (const file of files) {
      const p = path.join(contentDir, dir, file);
      const lesson: Lesson = JSON.parse(fs.readFileSync(p, 'utf-8'));
      for (const c of lesson.cards) {
        if (c.type === 'praktik_github') {
          semuaKartu.push({ lessonTitle: lesson.title, file, card: c as PraktikGitHubCard });
        }
      }
    }
  }

  for (const item of semuaKartu) {
    it(`memainkan sampai selesai tanpa salah: ${item.card.judul} (${item.file})`, () => {
      const onSuccess = vi.fn();
      const { container } = render(<PraktikGitHubCardComponent card={item.card} onSuccess={onSuccess} />);

      // Jika ada tombol Lewati untuk langkah otomatis awal
      const btnLewati = screen.queryByRole('button', { name: 'Lewati' });
      if (btnLewati) {
        fireEvent.click(btnLewati);
      }

      // Mainkan setiap langkah non-otomatis
      for (let i = 0; i < item.card.langkah.length; i++) {
        const l = item.card.langkah[i];
        if (l.otomatis) continue;

        // Jika langkah membutuhkan isian, isi kolomnya
        if (l.isian) {
          const inputEl = container.querySelector(`[data-target-id="input-title"], [data-target-id="input-filename"], [data-target-id="input-collaborator"], input[type="text"]`) as HTMLInputElement | null;
          if (inputEl) {
            fireEvent.change(inputEl, { target: { value: item.card.bawaan?.[l.isian] || 'Tes Isian' } });
          }
        }

        // Cari elemen target di DOM
        const targetEl = container.querySelector(`[data-target-id="${l.target}"]`) as HTMLElement | null;
        expect(targetEl, `Elemen [data-target-id="${l.target}"] harus ada di DOM pada langkah ${i + 1}`).not.toBeNull();

        fireEvent.click(targetEl!);
      }

      // Cek bahwa kartu selesai dan onSuccess dipanggil tepat 1 kali dengan nilai 1
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onSuccess).toHaveBeenCalledWith(1);

      // Pastikan tidak ada pesan "Hmm" di percakapan
      const logText = screen.getByRole('log').textContent || '';
      expect(logText).not.toContain('Hmm');
    });
  }
});
