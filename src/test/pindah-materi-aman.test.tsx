import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

function Meledak(): React.ReactElement {
  throw new Error('Boom!');
}

describe('ErrorBoundary resetKey', () => {
  it('layar error hilang saat resetKey berubah', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Meledak />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups, ada yang salah!')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="/b">
        <p>aman</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('aman')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('layar error tetap tampil jika resetKey tidak berubah', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Meledak />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups, ada yang salah!')).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="/a">
        <p>aman</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups, ada yang salah!')).toBeInTheDocument();
    expect(screen.queryByText('aman')).not.toBeInTheDocument();

    spy.mockRestore();
  });
});
