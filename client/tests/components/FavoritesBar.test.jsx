import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoritesBar from '../../src/components/FavoritesBar.jsx';

const favorites = [
  { id: '51.51,-0.13', name: 'London', country: 'GB', state: 'England', lat: 51.51, lon: -0.13 },
  { id: '35.69,139.69', name: 'Tokyo', country: 'JP', state: 'Tokyo', lat: 35.69, lon: 139.69 },
];

describe('FavoritesBar', () => {
  it('renders nothing when there are no favorites', () => {
    const { container } = render(<FavoritesBar favorites={[]} onSelect={() => {}} onRemove={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip per saved location', () => {
    render(<FavoritesBar favorites={favorites} onSelect={() => {}} onRemove={() => {}} />);
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
  });

  it('calls onSelect when a chip is clicked', async () => {
    const onSelect = vi.fn();
    render(<FavoritesBar favorites={favorites} onSelect={onSelect} onRemove={() => {}} />);
    await userEvent.click(screen.getByText('Tokyo'));
    expect(onSelect).toHaveBeenCalledWith(favorites[1]);
  });

  it('calls onRemove with the id when the × is clicked', async () => {
    const onRemove = vi.fn();
    render(<FavoritesBar favorites={favorites} onSelect={() => {}} onRemove={onRemove} />);
    await userEvent.click(screen.getByLabelText('Remove London from saved'));
    expect(onRemove).toHaveBeenCalledWith('51.51,-0.13');
  });
});
