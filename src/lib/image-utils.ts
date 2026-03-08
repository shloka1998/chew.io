export async function processImage(file: File): Promise<{
  fullImage: Blob;
  thumbnail: Blob;
}> {
  const bitmap = await createImageBitmap(file);
  const fullImage = await resizeAndCompress(bitmap, 1200, 0.7);
  const thumbnail = await resizeAndCompress(bitmap, 200, 0.5);
  bitmap.close();
  return { fullImage, thumbnail };
}

async function resizeAndCompress(
  bitmap: ImageBitmap,
  maxSize: number,
  quality: number
): Promise<Blob> {
  const { width, height } = bitmap;
  const scale = Math.min(maxSize / Math.max(width, height), 1);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  return canvas.convertToBlob({ type: 'image/jpeg', quality });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
