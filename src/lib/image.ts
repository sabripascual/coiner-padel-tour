"use client";
import imageCompression from "browser-image-compression";

/** Comprime en el celular antes de subir (≈200-400 KB por foto). */
export async function compressImage(file: File, maxSide = 1600, maxMB = 0.4) {
  const out = await imageCompression(file, {
    maxWidthOrHeight: maxSide,
    maxSizeMB: maxMB,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  });
  const dims = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src); };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = URL.createObjectURL(out);
  });
  return { blob: out, ...dims };
}

export const randomName = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
