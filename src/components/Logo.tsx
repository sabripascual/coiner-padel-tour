/* eslint-disable @next/next/no-img-element */
/** Logo de COINER PADEL TOUR. Para usar el logo oficial, reemplaza public/logo-mark.svg. */
export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className="flex items-center gap-2">
      <img src="/logo-mark.svg" alt="" className={lg ? "h-16 w-16" : "h-9 w-9"} />
      <span className="font-display leading-[0.95]">
        <span className={`block font-black tracking-tight text-brand-700 ${lg ? "text-4xl" : "text-lg"}`}>COINER</span>
        <span className={`block font-extrabold tracking-[0.18em] text-accent-500 ${lg ? "text-base" : "text-[10px]"}`}>PADEL TOUR</span>
      </span>
    </span>
  );
}
