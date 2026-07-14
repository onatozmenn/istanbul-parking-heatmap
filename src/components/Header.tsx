interface HeaderProps {
  generated: string | null;
}

export function Header({ generated }: HeaderProps) {
  const freshness = generated
    ? new Date(generated).toLocaleDateString("tr-TR", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <header className="pointer-events-auto min-w-0" role="banner">
      <div className="rounded-lg glass-panel px-4 py-3 lg:px-5" style={{ boxShadow: "none" }}>
        <h1 className="truncate text-[14px] font-semibold tracking-tight text-white lg:text-[16px]">
          İstanbul Park Isı Haritası
        </h1>
        {freshness && (
          <p className="mt-1 truncate text-[10px] text-white/35">
            Veriler <span className="font-medium text-white/55">{freshness}</span> tarihinde güncellendi
          </p>
        )}
      </div>
    </header>
  );
}
