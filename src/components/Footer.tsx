/* eslint-disable @next/next/no-img-element */
export default function Footer() {
  return (
    <footer className="mt-6 bg-navy text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 px-4 pt-3 pb-[calc(4.75rem+max(env(safe-area-inset-bottom),6px))] text-center">
        <img src="/brave-logo.png" alt="Brave Tech Studio" className="h-6 w-auto" />
        <p className="text-[11px] text-white/70">© 2026 Brave Tech Studio</p>
      </div>
    </footer>
  );
}
