import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFavorites, placeId } from '../../src/hooks/useFavorites.js';

const london = { name: 'London', country: 'GB', state: 'England', lat: 51.5074, lon: -0.1278 };
const tokyo = { name: 'Tokyo', country: 'JP', state: 'Tokyo', lat: 35.6895, lon: 139.6917 };

describe('useFavorites', () => {
  beforeEach(() => window.localStorage.clear());

  it('adds and reflects has()', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(london));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.has(placeId(london))).toBe(true);
  });

  it('does not add duplicates', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(london));
    act(() => result.current.add(london));
    expect(result.current.favorites).toHaveLength(1);
  });

  it('toggle adds then removes', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.toggle(tokyo));
    expect(result.current.has(placeId(tokyo))).toBe(true);
    act(() => result.current.toggle(tokyo));
    expect(result.current.has(placeId(tokyo))).toBe(false);
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(london));
    expect(window.localStorage.getItem('atmosfer:favorites')).toContain('London');
  });

  it('remove deletes by id', () => {
    const { result } = renderHook(() => useFavorites());
    act(() => result.current.add(london));
    act(() => result.current.remove(placeId(london)));
    expect(result.current.favorites).toHaveLength(0);
  });
});
