/* eslint-disable @next/next/no-img-element */
export default function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white" style={{ width: size, height: size }} />;
  }
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700 ring-2 ring-white" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
