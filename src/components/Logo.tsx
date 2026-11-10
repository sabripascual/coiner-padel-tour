/* eslint-disable @next/next/no-img-element */
/** Logo oficial de COINER PADEL TOUR (public/logo-coiner.webp). */
export default function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <img
      src="/logo-coiner.webp"
      alt="COINER PADEL TOUR"
      width={480}
      height={268}
      className={size === "lg" ? "h-32 w-auto" : "h-11 w-auto"}
    />
  );
}
