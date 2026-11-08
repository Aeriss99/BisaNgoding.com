import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { adalahCtrlEnter, useCtrlEnter } from '../lib/ctrlEnter';

describe('adalahCtrlEnter', () => {
  it('Ctrl+Enter -> true', () => {
    const e = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true });
    expect(adalahCtrlEnter(e)).toBe(true);
  });

  it('Cmd(meta)+Enter -> true', () => {
    const e = new KeyboardEvent('keydown', { key: 'Enter', metaKey: true });
    expect(adalahCtrlEnter(e)).toBe(true);
  });

  it('Enter biasa -> false', () => {
    const e = new KeyboardEvent('keydown', { key: 'Enter' });
    expect(adalahCtrlEnter(e)).toBe(false);
  });

  it('Shift+Ctrl+Enter -> false', () => {
    const e = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, shiftKey: true });
    expect(adalahCtrlEnter(e)).toBe(false);
  });

  it('Ctrl+Enter dengan isComposing true -> false', () => {
    const e = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, isComposing: true });
    expect(adalahCtrlEnter(e)).toBe(false);
  });
});

describe('useCtrlEnter', () => {
  function Komponen({ aksi }: { aksi: () => void }) {
    useCtrlEnter(aksi);
    return <div>test</div>;
  }

  it('Ctrl+Enter memanggil aksi 1 kali', () => {
    const aksi = vi.fn();
    render(<Komponen aksi={aksi} />);
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(aksi).toHaveBeenCalledTimes(1);
  });

  it('Enter biasa tidak memanggil aksi', () => {
    const aksi = vi.fn();
    render(<Komponen aksi={aksi} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(aksi).not.toHaveBeenCalled();
  });

  it('Ctrl+Enter tidak memanggil aksi saat ada aria-modal', () => {
    const aksi = vi.fn();
    render(<Komponen aksi={aksi} />);
    const modal = document.createElement('div');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(aksi).not.toHaveBeenCalled();
    document.body.removeChild(modal);
  });
});
