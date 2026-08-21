/** Eine Quelle fuer beide Navigationen (Kopfleiste und Bottom-Nav). */
export type NavItem = {
  href: string;
  label: string;
  /** Kurzform fuer die Bottom-Nav – "KI-Workflow" passt dort nicht. */
  short: string;
  icon: string;
};

export const NAV: NavItem[] = [
  { href: '/',            label: 'Start',       short: 'Start',   icon: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5' },
  { href: '/projekte/',   label: 'Projekte',    short: 'Projekte', icon: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2.5h7A1.5 1.5 0 0 1 20 10v7.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 17.5Z' },
  { href: '/ueber-mich/', label: 'Über mich',   short: 'Über',    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0' },
  { href: '/ki-workflow/',label: 'KI-Workflow', short: 'KI',      icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1m-7.2 7.2-2.1 2.1M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
  { href: '/devlog/',     label: 'Devlog',      short: 'Devlog',  icon: 'M5 4.5h11l3 3V19a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 5 19ZM8 10h8M8 13.5h8M8 17h5' },
  { href: '/kontakt/',    label: 'Kontakt',     short: 'Kontakt', icon: 'M3.5 7.5h17v10h-17ZM4 8l8 5.5L20 8' },
];

/** Aktiv ist auch /devlog/mein-post/ auf dem Devlog-Eintrag. */
export function isActive(href: string, pathname: string): boolean {
  const p = pathname.endsWith('/') ? pathname : pathname + '/';
  if (href === '/') return p === '/';
  return p === href || p.startsWith(href);
}
