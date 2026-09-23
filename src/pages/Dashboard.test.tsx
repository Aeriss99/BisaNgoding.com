import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { ProgressProvider } from '../context/ProgressContext';
import { AuthProvider } from '../context/AuthContext';

vi.mock('../lib/content', () => ({
  coursesData: [
    { id: 'java', title: 'Java', language: 'java', order: 1 }
  ],
  modulesData: [
    {
      id: 'dasar',
      title: 'Java Dasar',
      order: 1,
      lessonCount: 32,
      status: 'ready',
    },
  ],
  getVisibleLessons: vi.fn(() => [
    { id: 'dasar-01', title: 'Lesson 1', estimatedMinutes: 5 },
  ]),
  getQuizQuestions: vi.fn(() => [{ id: 'q1' }]),
  getLessonsForModule: vi.fn(() => [
    { id: 'dasar-01', title: 'Lesson 1', estimatedMinutes: 5 },
  ]),
}));

// Remove the old modules.json mock since we export modulesData from lib/content now
vi.mock('../../content/modules.json', () => ({
  default: [
    {
      id: 'dasar',
      title: 'Java Dasar',
      order: 1,
      lessonCount: 32,
      status: 'ready',
    },
  ],
}));

// Mock supabase rpc for testing
vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi
        .fn()
        .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('Dashboard', () => {
  it('calculates module progress correctly', () => {
    render(
      <AuthProvider>
        <ProgressProvider>
          <MemoryRouter>
            <Dashboard />
          </MemoryRouter>
        </ProgressProvider>
      </AuthProvider>
    );
    expect(screen.getAllByText(/Daftar Kelas/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/0\/1/).length).toBeGreaterThan(0);
  });
});
