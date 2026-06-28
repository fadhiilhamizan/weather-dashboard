import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../src/components/ThemeToggle.jsx';

describe('ThemeToggle', () => {
  it('renders exactly two options (Light, Dark)', () => {
    render(<ThemeToggle theme="light" onChange={() => {}} />);
    expect(screen.getByLabelText('Light theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Dark theme')).toBeInTheDocument();
  });

  it('marks the active theme as pressed', () => {
    render(<ThemeToggle theme="dark" onChange={() => {}} />);
    expect(screen.getByLabelText('Dark theme')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Light theme')).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with the chosen theme', async () => {
    const onChange = vi.fn();
    render(<ThemeToggle theme="light" onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Dark theme'));
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
