import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { ProgressProvider } from '../context/ProgressContext';

vi.mock('../lib/content', () => ({
  modulesData: [
    { id: 'dasar', title: 'Java Dasar', order: 1, lessonCount: 32, status: 'ready' }
  ],
  getVisibleLessons: vi.fn(() => [
    { id: 'dasar-01', title: 'Lesson 1', estimatedMinutes: 5 }
  ]),
  getQuizQuestions: vi.fn(() => [ { id: 'q1' } ]),
  getLessonsForModule: vi.fn(() => [
    { id: 'dasar-01', title: 'Lesson 1', estimatedMinutes: 5 }
  ]),
}));

// Remove the old modules.json mock since we export modulesData from lib/content now
vi.mock('../../content/modules.json', () => ({
  default: [
    { id: 'dasar', title: 'Java Dasar', order: 1, lessonCount: 32, status: 'ready' }
  ]
}));

describe('Dashboard', () => {
  it('calculates module progress correctly', () => {
    render(
      <ProgressProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </ProgressProvider>
    );
    expect(screen.getByText(/Java Dasar/)).toBeDefined();
    expect(screen.getByText(/0\/1 pelajaran/)).toBeDefined();
    expect(screen.getByText(/Quiz: 0%/)).toBeDefined();
  });
});
