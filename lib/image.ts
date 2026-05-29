"use client";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export async function resizeToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return fileToDataUrl(file);
  }
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  if (canvas instanceof HTMLCanvasElement) {
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  }
  const blob = await (canvas as OffscreenCanvas).convertToBlob({
    type: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  return fileToDataUrl(new File([blob], file.name, { type: "image/jpeg" }));
}
