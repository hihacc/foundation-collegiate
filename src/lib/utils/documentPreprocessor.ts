/**
 * Client-side Canvas Document Preprocessor
 * Runs 100% locally in browser to enhance phone photos of physical paper forms
 * for maximum OCR accuracy without any cloud or external API dependencies.
 */

export type DocumentFilter = 'magic' | 'bw' | 'grayscale' | 'original';

export interface PreprocessOptions {
  filter?: DocumentFilter;
  rotation?: number; // 0, 90, 180, 270
  contrast?: number; // -50 to 50 (default 0)
  brightness?: number; // -50 to 50 (default 0)
  threshold?: number; // 0 to 255 for custom binarization (default 128)
  cropBox?: { x: number; y: number; width: number; height: number }; // percentage 0-1
}

export function preprocessDocumentCanvas(
  imageSource: string | HTMLImageElement,
  options: PreprocessOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      filter = 'magic',
      rotation = 0,
      contrast = 0,
      brightness = 0,
      threshold = 128,
      cropBox
    } = options;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        // Apply crop bounds if specified
        let srcX = 0;
        let srcY = 0;
        let srcW = naturalWidth;
        let srcH = naturalHeight;

        if (cropBox) {
          srcX = Math.max(0, Math.min(naturalWidth, cropBox.x * naturalWidth));
          srcY = Math.max(0, Math.min(naturalHeight, cropBox.y * naturalHeight));
          srcW = Math.max(10, Math.min(naturalWidth - srcX, cropBox.width * naturalWidth));
          srcH = Math.max(10, Math.min(naturalHeight - srcY, cropBox.height * naturalHeight));
        }

        // Setup canvas with rotation dimensions
        const isRotated = rotation === 90 || rotation === 270;
        const targetWidth = isRotated ? srcH : srcW;
        const targetHeight = isRotated ? srcW : srcH;

        // Cap max resolution for fast local OCR (max 2000px on long edge)
        let finalWidth = targetWidth;
        let finalHeight = targetHeight;
        const maxDimension = 2200;

        if (finalWidth > maxDimension || finalHeight > maxDimension) {
          if (finalWidth > finalHeight) {
            finalHeight = Math.round((finalHeight * maxDimension) / finalWidth);
            finalWidth = maxDimension;
          } else {
            finalWidth = Math.round((finalWidth * maxDimension) / finalHeight);
            finalHeight = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : img.src);
          return;
        }

        ctx.save();
        ctx.translate(finalWidth / 2, finalHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const drawW = isRotated ? finalHeight : finalWidth;
        const drawH = isRotated ? finalWidth : finalHeight;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        if (filter === 'original' && contrast === 0 && brightness === 0) {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
          return;
        }

        // Pixel processing for Magic Color, B&W threshold, and Grayscale
        const imgData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        const data = imgData.data;
        const len = data.length;

        // Compute contrast multiplier: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        // Find min and max luminance for auto dynamic-range stretching
        let minLum = 255;
        let maxLum = 0;

        for (let i = 0; i < len; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }
        const lumRange = Math.max(1, maxLum - minLum);

        for (let i = 0; i < len; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // 1. Calculate Grayscale Luminance
          let lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

          // 2. Apply Brightness
          if (brightness !== 0) {
            r = Math.max(0, Math.min(255, r + brightness));
            g = Math.max(0, Math.min(255, g + brightness));
            b = Math.max(0, Math.min(255, b + brightness));
            lum = Math.max(0, Math.min(255, lum + brightness));
          }

          // 3. Apply Contrast
          if (contrast !== 0) {
            r = Math.max(0, Math.min(255, Math.round(contrastFactor * (r - 128) + 128)));
            g = Math.max(0, Math.min(255, Math.round(contrastFactor * (g - 128) + 128)));
            b = Math.max(0, Math.min(255, Math.round(contrastFactor * (b - 128) + 128)));
            lum = Math.max(0, Math.min(255, Math.round(contrastFactor * (lum - 128) + 128)));
          }

          if (filter === 'grayscale') {
            data[i] = lum;
            data[i + 1] = lum;
            data[i + 2] = lum;
          } else if (filter === 'bw') {
            // High-contrast clean black & white binarization
            const val = lum > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else if (filter === 'magic') {
            // Google Drive CamScanner style magic enhancement:
            // Normalize paper background to bright white and darken ink/text
            let stretched = Math.round(((lum - minLum) / lumRange) * 255);
            if (stretched > 135) {
              stretched = Math.min(255, Math.round(stretched * 1.15));
            } else {
              stretched = Math.max(0, Math.round(stretched * 0.8));
            }
            data[i] = stretched;
            data[i + 1] = stretched;
            data[i + 2] = stretched;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Failed to load image for preprocessing: ' + e));

    img.src = typeof imageSource === 'string' ? imageSource : imageSource.src;
  });
}
