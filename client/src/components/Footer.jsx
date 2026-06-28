import { Github } from 'lucide-react';

/**
 * Quiet footer: data attribution and a place for the repo link. The brief wants
 * a clean, deployable portfolio piece, so crediting the data source matters.
 */
export default function Footer({ demo = false }) {
  return (
    <footer className="mt-10 flex flex-col items-center gap-2 pb-8 text-center text-xs text-[color:var(--text-faint)]">
      <p>
        {demo ? 'Sample data for demonstration' : 'Weather data by Open-Meteo'}
        {'  ·  '}
        Built with React, Vite &amp; Express
      </p>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[color:var(--text-soft)] transition-colors hover:text-white"
      >
        <Github className="h-3.5 w-3.5" />
        View source
      </a>
    </footer>
  );
}
