import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HourlyChart from '../../src/components/HourlyChart.jsx';

function makeHourly(n = 24) {
  const start = 1_751_000_000;
  return Array.from({ length: n }, (_, i) => ({
    dt: start + i * 3600,
    temp: 20 + i,
    pop: 30,
    windSpeed: 4 + i * 0.1,
    isDay: true,
    condition: { id: 800 },
  }));
}

describe('HourlyChart', () => {
  it('renders the chart and an accessible data table', () => {
    render(<HourlyChart hourly={makeHourly()} tz="UTC" units="metric" />);
    expect(screen.getByRole('img', { name: /temp graph/i })).toBeInTheDocument();
    // Accessible table mirrors the data for screen readers.
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBe(25); // header + 24 hours
  });

  it('offers temp/rain/wind metric options and switches them', async () => {
    render(<HourlyChart hourly={makeHourly()} tz="UTC" units="metric" />);
    expect(screen.getByRole('button', { name: 'Temp' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rain' })).toBeInTheDocument();
    const wind = screen.getByRole('button', { name: 'Wind' });
    await userEvent.click(wind);
    expect(wind).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: /wind graph/i })).toBeInTheDocument();
  });

  it('hides the wind option when no hourly wind data is present', () => {
    const noWind = makeHourly().map((h) => ({ ...h, windSpeed: null }));
    render(<HourlyChart hourly={noWind} tz="UTC" units="metric" />);
    expect(screen.queryByRole('button', { name: 'Wind' })).not.toBeInTheDocument();
  });

  it('renders nothing in mini mode chrome (no toggle/table)', () => {
    render(<HourlyChart hourly={makeHourly()} tz="UTC" units="metric" mini />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Temp' })).not.toBeInTheDocument();
  });
});
