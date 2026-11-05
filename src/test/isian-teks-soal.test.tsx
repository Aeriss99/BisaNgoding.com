import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FillBlankCardComponent } from '../components/cards/QuizCards';

describe('FillBlankCardComponent teks soal', () => {
  it('menampilkan teks soal khusus jika question ditentukan', () => {
    const onSuccess = vi.fn();
    render(
      <FillBlankCardComponent
        card={{
          type: 'fill_blank',
          question: 'Tampilkan isi folder sekarang.',
          code: '___',
          answers: ['ls'],
        }}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Tampilkan isi folder sekarang.')).toBeInTheDocument();
    expect(screen.queryByText('Lengkapi kode berikut:')).not.toBeInTheDocument();
  });

  it('menampilkan teks default jika question tidak ditentukan', () => {
    const onSuccess = vi.fn();
    render(
      <FillBlankCardComponent
        card={{
          type: 'fill_blank',
          code: '___',
          answers: ['ls'],
        }}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Lengkapi kode berikut:')).toBeInTheDocument();
  });
});
