'use client';

/**
 * Robust Client-Side Image Processor
 * - Detects & converts iPhone HEIC/HEIF to JPEG
 * - Resizes and compresses JPEG/PNG to optimal dimensions for fast web loading
 * - Returns a universal, high-quality data:image/jpeg;base64 URL
 */
export async function optimizeUploadedImage(file: File): Promise<string> {
  let blobToProcess: Blob = file;

  const isHeic = 
    file.name.toLowerCase().endsWith('.heic') || 
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' || 
    file.type === 'image/heif';

  if (isHeic) {
    try {
      const heic2any = (await import('heic2any')).default;
      const conversionResult = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      });
      blobToProcess = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
    } catch (err) {
      console.warn('HEIC client conversion notice:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return resolve('');

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 900;
        const maxH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }
        } else {
          if (height > maxH) {
            width = Math.round((width * maxH) / height);
            height = maxH;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressed);
        } else {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        // If image decoding failed, return raw data url
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(blobToProcess);
  });
}
