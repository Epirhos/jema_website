/** Logo Jema : les trois feuilles empilées de l'app (icône « layers »), devant le nom. */
export default function Logo({ size = 26 }) {
  return (
    <span className="inline-flex select-none items-center gap-2.5" style={{ fontFamily: 'var(--f-disp)', fontWeight: 600, fontSize: size * 0.95, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--jema)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
        <path d="m2 17 10 5 10-5" />
        <path d="m2 12 10 5 10-5" />
      </svg>
      Jema
    </span>
  )
}
