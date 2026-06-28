import { LayoutDashboard, Columns3, Map } from 'lucide-react';

/**
 * Switches between the three top-level views: the detailed single-city
 * dashboard, the multi-city comparison grid, and the radar map. The choice is
 * mirrored to the URL by App (so it's shareable) and is keyboard operable.
 */
const TABS = [
  { value: 'detailed', label: 'Detailed', Icon: LayoutDashboard },
  { value: 'compare', label: 'Compare', Icon: Columns3 },
  { value: 'map', label: 'Map', Icon: Map },
];

export default function ViewTabs({ view, onChange }) {
  return (
    <div className="glass inline-flex items-center rounded-full p-1" role="tablist" aria-label="View">
      {TABS.map(({ value, label, Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={[
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200',
              active ? 'text-[#0b1f3a]' : 'text-[color:var(--text-soft)] hover:text-[color:var(--text-strong)]',
            ].join(' ')}
            style={active ? { background: 'var(--accent)' } : undefined}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
