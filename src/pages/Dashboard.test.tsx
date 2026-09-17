import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { ProgressProvider } from '../context/ProgressContext';

vi.mock('../lib/content', () => ({
  getLessonsForModule: vi.fn(() => [
    { id: 'dasar-01', title: 'Lesson 1', estimatedMinutes: 5 }
  ]),
}));

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
