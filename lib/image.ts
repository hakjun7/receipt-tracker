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

export async function resizeToFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale === 1 && file.type === "image/jpeg" && file.size < 1_200_000) {
    bitmap.close?.();
    return file;
  }
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement("canvas"), { width: w, height: h });
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  (ctx as CanvasRenderingContext2D).drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob =
    canvas instanceof HTMLCanvasElement
      ? await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
        )
      : await (canvas as OffscreenCanvas).convertToBlob({
          type: "image/jpeg",
          quality: JPEG_QUALITY,
        });
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
