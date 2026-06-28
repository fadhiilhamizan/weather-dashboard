/**
 * Metric / imperial switch. Controlled by the parent so the choice can be
 * persisted to localStorage and so flipping it re-fetches the active location
 * in the new unit system (the backend does the actual conversion).
 */
export default function UnitToggle({ units, onChange }) {
  const options = [
    { value: 'metric', label: '°C' },
    { value: 'imperial', label: '°F' },
  ];

  return (
    <div
      className="glass inline-flex items-center rounded-full p-1"
      role="group"
      aria-label="Temperature units"
    >
      {options.map((opt) => {
        const active = units === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              'tnum rounded-full px-3 py-1 text-sm font-semibold transition-colors',
              active ? 'text-[#0b1f3a]' : 'text-[color:var(--text-soft)] hover:text-[color:var(--text-strong)]',
            ].join(' ')}
            style={active ? { background: 'var(--accent)' } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
