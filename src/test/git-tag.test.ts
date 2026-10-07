import { describe, it, expect } from 'vitest';
import { ringkasanKelas } from '../lib/kelas';
import { modulesData, getVisibleLessons, getQuizQuestions, checkModuleUnlocked } from '../lib/content';
import type { UserProgress } from '../types/schema';

const materi = (id: string) => getVisibleLessons(id).map((l) => l.id);
const modul = (id: string) => modulesData.find((m) => m.id === id)!;
const lulus = { score: 100, passed: true };
function progres(isi: Partial<UserProgress> = {}): UserProgress {
  return { completedLessons: [], passedChecks: [], moduleStatus: {}, quizScores: {}, xp: 0, streak: 0, lastActiveDate: '', ...isi };
}
const selesaiBranching = () => progres({
  completedLessons: [...materi('git-dasar'), ...materi('git-branching')],
  quizScores: { 'git-dasar': lulus, 'git-branching': lulus },
});

describe('Modul Git Tag', () => {
  it('8 materi dan 20 soal quiz, tampil tepat setelah Git Branching', () => {
    expect(modul('git-tag')).toMatchObject({ courseId: 'git', title: 'Git Tag', lessonCount: 8, requires: 'git-branching', status: 'ready' });
    expect(materi('git-tag')).toHaveLength(8);
    expect(getQuizQuestions('git-tag')).toHaveLength(20);
    const urut = modulesData.filter((m) => m.courseId === 'git').sort((a, b) => a.order - b.order).map((m) => m.id);
    expect(urut.slice(0, 4)).toEqual(['git-dasar', 'git-branching', 'git-tag', 'git-remote']);
  });

  it('Git Remote tetap hanya butuh Git Branching, jadi tidak terkunci oleh Git Tag', () => {
    expect(modul('git-remote').requires).toBe('git-branching');
    const p = selesaiBranching();
    expect(checkModuleUnlocked(modul('git-tag'), p)).toBe(true);
    expect(checkModuleUnlocked(modul('git-remote'), p)).toBe(true);
    expect(checkModuleUnlocked(modul('gh-dasar'), p)).toBe(false);
  });

  it('pengguna yang sedang mengerjakan Git Remote tetap diarahkan ke Git Remote', () => {
    const remote = materi('git-remote');
    const p = selesaiBranching();
    p.completedLessons = [...p.completedLessons, ...remote.slice(0, remote.length - 1)];
    const r = ringkasanKelas('git', p)!;
    const status = Object.fromEntries(r.modul.map((m) => [m.mod.id, m.status]));
    expect(status['git-remote']).toBe('sedang');
    expect(status['git-tag']).toBe('terbuka');
    expect(r.modul.filter((m) => m.status === 'sedang')).toHaveLength(1);
    expect(r.lanjut?.url).toBe(`/lesson/${remote[remote.length - 1]}`);
  });

  it('baru selesai Git Branching: Git Tag yang disarankan lebih dulu', () => {
    const r = ringkasanKelas('git', selesaiBranching())!;
    expect(r.modul.find((m) => m.mod.id === 'git-tag')!.status).toBe('sedang');
    expect(r.lanjut?.url).toBe('/lesson/git-tag-01');
  });
});
