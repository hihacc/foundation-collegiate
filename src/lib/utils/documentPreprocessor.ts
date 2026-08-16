/**
 * Client-side Canvas Document Preprocessor
 * Features Local Adaptive Background Normalization (Anti-Glare & Shadow Equalizer)
 * Ensures crisp text extraction even under flash glare, uneven shadows, and low-light camera photos.
 */

export type DocumentFilter = 'magic' | 'bw' | 'grayscale' | 'original';

export interface PreprocessOptions {
  filter?: DocumentFilter;
  rotation?: number; // 0, 90, 180, 270
  contrast?: number; // -50 to 50
  brightness?: number; // -50 to 50
  threshold?: number; // 0 to 255
  cropBox?: { x: number; y: number; width: number; height: number };
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
      threshold = 135,
      cropBox
    } = options;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

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

        const isRotated = rotation === 90 || rotation === 270;
        const targetWidth = isRotated ? srcH : srcW;
        const targetHeight = isRotated ? srcW : srcH;

        let finalWidth = targetWidth;
        let finalHeight = targetHeight;
        const maxDimension = 2000;

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

        const imgData = ctx.getImageData(0, 0, finalWidth, finalHeight);
        const data = imgData.data;
        const width = finalWidth;
        const height = finalHeight;

        // Step 1: Create 2D Luminance Array
        const lumGrid = new Uint8Array(width * height);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          lumGrid[j] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        }

        // Step 2: Compute Integral Image for Fast Local Background Normalization (Anti-Glare)
        // Integral image allows O(1) local mean background estimation over any window size
        const integral = new Float64Array((width + 1) * (height + 1));
        const intW = width + 1;

        for (let y = 0; y < height; y++) {
          let rowSum = 0;
          for (let x = 0; x < width; x++) {
            rowSum += lumGrid[y * width + x];
            integral[(y + 1) * intW + (x + 1)] = integral[y * intW + (x + 1)] + rowSum;
          }
        }

        // Local window radius (e.g. 24px) for background subtraction
        const winRadius = Math.max(16, Math.round(width / 40));

        for (let y = 0; y < height; y++) {
          const y0 = Math.max(0, y - winRadius);
          const y1 = Math.min(height, y + winRadius + 1);

          for (let x = 0; x < width; x++) {
            const x0 = Math.max(0, x - winRadius);
            const x1 = Math.min(width, x + winRadius + 1);

            const count = (x1 - x0) * (y1 - y0);
            const sum = integral[y1 * intW + x1] - integral[y0 * intW + x1] - integral[y1 * intW + x0] + integral[y0 * intW + x0];
            const localMean = sum / count;

            const idx = (y * width + x) * 4;
            const currentLum = lumGrid[y * width + x];

            if (filter === 'bw') {
              // Adaptive thresholding: if significantly darker than local background, it is text
              const isDark = currentLum < localMean * 0.88;
              const val = isDark ? 0 : 255;
              data[idx] = val;
              data[idx + 1] = val;
              data[idx + 2] = val;
            } else if (filter === 'magic') {
              // Magic color: equalize local background to white and boost text ink contrast
              let normalized = Math.round((currentLum / Math.max(1, localMean)) * 240);
              if (normalized > 200) normalized = 255;
              else if (normalized < 140) normalized = Math.max(0, Math.round(normalized * 0.7));

              data[idx] = normalized;
              data[idx + 1] = normalized;
              data[idx + 2] = normalized;
            } else if (filter === 'grayscale') {
              data[idx] = currentLum;
              data[idx + 1] = currentLum;
              data[idx + 2] = currentLum;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => reject(new Error('Image processing error: ' + e));
    img.src = typeof imageSource === 'string' ? imageSource : imageSource.src;
  });
}
