interface SocialLinksProps {
  variant?: "dark" | "light";
  showLabels?: boolean;
}

export const SOCIAL_MEDIA_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/1DpaBxQweN/",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/warraichmotorsgujrat/",
    icon: (
      <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@warraichmotorsgujrat",
    icon: (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
  },
];

export function SocialLinks({ variant = "dark", showLabels = false }: SocialLinksProps) {
  const baseClass =
    variant === "dark"
      ? "bg-slate-800 hover:bg-brand-600 text-slate-300 hover:text-white border border-slate-700 hover:border-brand-500"
      : "bg-slate-100 hover:bg-brand-600 text-slate-700 hover:text-white border border-slate-200 hover:border-brand-600";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {SOCIAL_MEDIA_LINKS.map((item) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Warraich Motors on ${item.name}`}
          title={item.name}
          className={`inline-flex items-center justify-center rounded-lg transition ${
            showLabels ? "gap-2 px-3 py-2 text-xs font-medium" : "w-9 h-9"
          } ${baseClass}`}
        >
          {item.icon}
          {showLabels && <span>{item.name}</span>}
        </a>
      ))}
    </div>
  );
}
