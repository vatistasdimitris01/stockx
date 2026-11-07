// Reusable inline SVG icon set (Feather / Material-like, stroke-based).

const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export function Icon({ name, size = 16, stroke = 2 }) {
  const paths = {
    menu: (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </>
    ),
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />,
    chart: (
      <>
        <line x1="3" y1="3" x2="3" y2="21" />
        <line x1="3" y1="17" x2="21" y2="17" />
        <path d="M8 12l4-5 3 3 5-7" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <path d="M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z" />
      </>
    ),
    monitor: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 3 3 5-6" />
      </>
    ),
    insights: (
      <>
        <path d="M3 17l6-6 4 4 8-8" />
        <path d="M17 7h4v4" />
      </>
    ),
    radar: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="3" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="21" />
        <line x1="3" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="21" y2="12" />
      </>
    ),
    flask: (
      <>
        <path d="M9 2v6l-4 8a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 16l-4-8V2" />
        <line x1="8" y1="7" x2="16" y2="7" />
      </>
    ),
    wallet: (
      <>
        <path d="M20 7H4a2 2 0 0 0 0 4h16a2 2 0 0 1 0 4H4" />
        <path d="M4 7a2 2 0 0 0 0 4h13v8H6a2 2 0 0 1-2-2z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7.1 4.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
    refresh: (
      <>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    quote: (
      <>
        <path d="M4 20h16" />
        <path d="M5 4h14v10H5z" />
        <path d="M8 15l-1 5 4-5M10 15h1" />
      </>
    ),
  };

  if (!paths[name]) return null;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...base} strokeWidth={stroke}>
      {paths[name]}
    </svg>
  );
}
