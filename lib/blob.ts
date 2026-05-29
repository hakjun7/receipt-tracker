import "server-only";
import { put, del, get } from "@vercel/blob";

export async function uploadReceiptImage(file: File): Promise<string> {
  const ext = guessExt(file);
  const key = `receipts/${crypto.randomUUID()}${ext}`;
  const blob = await put(key, file, {
    access: "private",
    contentType: file.type || "application/octet-stream",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function deleteReceiptImage(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    console.error("blob delete failed", url, err);
  }
}

export async function getReceiptImageStream(url: string) {
  return get(url, { access: "private" });
}

function guessExt(file: File): string {
  const fromName = file.name.match(/\.[a-zA-Z0-9]+$/)?.[0];
  if (fromName) return fromName.toLowerCase();
  const mime = file.type;
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "application/pdf") return ".pdf";
  return "";
}
