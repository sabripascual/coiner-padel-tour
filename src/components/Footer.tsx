/* eslint-disable @next/next/no-img-element */
export default function Footer() {
  return (
    <footer className="mt-8 bg-navy text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-center">
        <img src="/brave-logo.png" alt="Brave Tech Studio" className="h-8 w-auto" />
        <p className="text-xs text-white/70">© 2026 Brave Tech Studio</p>
      </div>
    </footer>
  );
}
