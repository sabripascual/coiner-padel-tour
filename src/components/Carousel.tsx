"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Slide = { id: string; src: string; caption: string };

export default function Carousel({ slides }: { slides: Slide[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => {
      if (paused.current || !ref.current) return;
      const el = ref.current;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="card grid aspect-[4/3] place-items-center bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-center text-white">
        <div>
          <div className="text-4xl">📸</div>
          <p className="mt-2 font-semibold">Todavía no hay recuerdos</p>
          <Link href="/galeria" className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-sm">Subir la primera foto</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow"
      onPointerDown={() => (paused.current = true)} onPointerUp={() => setTimeout(() => (paused.current = false), 6000)}>
      <div ref={ref} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s) => (
          <Link key={s.id} href={`/galeria/${s.id}`} className="relative h-full w-full shrink-0 snap-center">
            <img src={s.src} alt={s.caption} className="h-full w-full object-cover" loading="lazy" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-6 pt-10 text-sm font-medium text-white">{s.caption}</span>
          </Link>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {slides.map((s, i) => (
          <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
