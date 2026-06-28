import { describe, it, expect } from 'vitest';
import { readState, buildSearch } from '../src/utils/url.js';

describe('readState', () => {
  it('parses a city query', () => {
    expect(readState('?q=Tokyo')).toEqual({ query: { kind: 'city', q: 'Tokyo' }, view: 'detailed' });
  });

  it('parses coordinates', () => {
    expect(readState('?lat=51.5&lon=-0.12')).toEqual({
      query: { kind: 'coords', lat: 51.5, lon: -0.12 },
      view: 'detailed',
    });
  });

  it('prefers coordinates over q when both present', () => {
    expect(readState('?q=Tokyo&lat=1&lon=2').query).toEqual({ kind: 'coords', lat: 1, lon: 2 });
  });

  it('reads a valid view and ignores invalid ones', () => {
    expect(readState('?view=compare').view).toBe('compare');
    expect(readState('?view=bogus').view).toBe('detailed');
  });

  it('returns a null query when nothing is given', () => {
    expect(readState('').query).toBeNull();
  });
});

describe('buildSearch', () => {
  it('round-trips a city + view', () => {
    expect(buildSearch({ query: { kind: 'city', q: 'Paris' }, view: 'map' })).toBe('?q=Paris&view=map');
  });

  it('omits the default view', () => {
    expect(buildSearch({ query: { kind: 'city', q: 'Paris' }, view: 'detailed' })).toBe('?q=Paris');
  });

  it('encodes coordinates to 4 dp', () => {
    expect(buildSearch({ query: { kind: 'coords', lat: 51.50735, lon: -0.1277 } })).toBe(
      '?lat=51.5074&lon=-0.1277'
    );
  });
});
