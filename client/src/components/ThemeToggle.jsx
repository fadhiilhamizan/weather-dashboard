import { CloudSun, Moon, Sun } from 'lucide-react';

/**
 * Three-way theme switch: living "Sky" (weather-driven palette, the default),
 * a neutral "Dark", and a neutral "Light". Controlled by the parent so the
 * choice persists to localStorage and gates the sky engine. Styled to match
 * UnitToggle for a consistent header.
 */
const OPTIONS = [
  { value: 'sky', label: 'Living sky theme', Icon: CloudSun },
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
];

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div
      className="glass inline-flex items-center rounded-full p-1"
      role="group"
      aria-label="Colour theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={[
              'rounded-full p-1.5 transition-all duration-200',
              active
                ? 'text-[#0b1f3a]'
                : 'text-[color:var(--text-soft)] hover:text-[color:var(--text-strong)] hover:scale-110',
            ].join(' ')}
            style={active ? { background: 'var(--accent)' } : undefined}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
