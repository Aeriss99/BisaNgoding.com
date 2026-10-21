import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../pages/Landing';
import { coursesData, modulesData, getVisibleLessons } from '../lib/content';

describe('Landing Page "Hujan Stiker"', () => {
  const renderLanding = () => {
    return render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );
  };

  it('angka di pita sama dengan hasil hitung dari data', () => {
    const readyCoursesCount = coursesData.filter((c) => c.status !== 'soon').length;
    const readyModules = modulesData.filter((m) => m.status !== 'draft');
    const readyModulesCount = readyModules.length;
    const totalLessonsCount = readyModules.reduce((acc, m) => {
      const visible = getVisibleLessons(m.id);
      return acc + (visible.length || m.lessonCount || 0);
    }, 0);

    renderLanding();

    const teksPita = `${readyCoursesCount} KELAS ✱ ${readyModulesCount} MODUL ✱ ${totalLessonsCount} MATERI`;
    expect(screen.getByText(new RegExp(teksPita, 'i'))).toBeInTheDocument();
  });

  it('jumlah stiker sama dengan jumlah kelas di coursesData', () => {
    renderLanding();

    const laptopSection = document.getElementById('kelas');
    expect(laptopSection).toBeInTheDocument();

    const laptopBox = laptopSection?.querySelector('.bg-\\[\\#2b2b2b\\]');
    expect(laptopBox).toBeInTheDocument();

    const stikerElements = laptopBox?.children;
    expect(stikerElements?.length).toBe(coursesData.length);
  });

  it('kelas soon tidak berupa link', () => {
    renderLanding();

    const soonCourses = coursesData.filter((c) => c.status === 'soon');
    expect(soonCourses.length).toBeGreaterThan(0);

    const laptopSection = document.getElementById('kelas');
    expect(laptopSection).toBeInTheDocument();

    // Pastikan setiap elemen span di dalam kotak laptop cocok dengan kelas soon
    const spans = laptopSection?.querySelectorAll('.bg-\\[\\#2b2b2b\\] > span');
    expect(spans?.length).toBe(soonCourses.length);

    spans?.forEach((span) => {
      expect(span.tagName.toLowerCase()).toBe('span');
      expect(span.closest('a')).toBeNull();
    });
  });

  it('semua tombol MASUK / MULAI GRATIS / MASUK GRATIS menuju /masuk', () => {
    renderLanding();

    const linkMasuk = screen.getAllByRole('link', { name: /^masuk$/i });
    expect(linkMasuk.length).toBeGreaterThan(0);
    for (const link of linkMasuk) {
      expect(link).toHaveAttribute('href', '/masuk');
    }

    const linkMulaiGratis = screen.getAllByRole('link', { name: /^mulai gratis$/i });
    expect(linkMulaiGratis.length).toBeGreaterThan(0);
    for (const link of linkMulaiGratis) {
      expect(link).toHaveAttribute('href', '/masuk');
    }

    const linkMasukGratis = screen.getAllByRole('link', { name: /^masuk gratis$/i });
    expect(linkMasukGratis.length).toBeGreaterThan(0);
    for (const link of linkMasukGratis) {
      expect(link).toHaveAttribute('href', '/masuk');
    }
  });

  it('menu HP terbuka dan tertutup', () => {
    renderLanding();

    const tombolMenu = screen.getByRole('button', { name: /buka menu/i });
    const panelMenu = document.getElementById('panel-menu');
    expect(panelMenu).toBeInTheDocument();

    expect(tombolMenu).toHaveAttribute('aria-expanded', 'false');
    expect(panelMenu).toHaveClass('hidden');

    // Klik untuk membuka
    fireEvent.click(tombolMenu);
    expect(tombolMenu).toHaveAttribute('aria-expanded', 'true');
    expect(panelMenu).toHaveClass('flex');
    expect(panelMenu).not.toHaveClass('hidden');

    // Klik item di menu untuk menutup
    const linkKelasMenu = within(panelMenu!).getByRole('link', { name: /^kelas$/i });
    fireEvent.click(linkKelasMenu);
    expect(tombolMenu).toHaveAttribute('aria-expanded', 'false');
    expect(panelMenu).toHaveClass('hidden');

    // Klik lagi untuk buka dan tutup via tombol hamburger
    fireEvent.click(tombolMenu);
    expect(tombolMenu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(tombolMenu);
    expect(tombolMenu).toHaveAttribute('aria-expanded', 'false');
  });
});
