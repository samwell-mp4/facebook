import JSZip from 'jszip';

/**
 * Converts an image URL to a Blob in the desired format (image/jpeg or image/webp)
 * using an offscreen HTML5 Canvas.
 */
export async function convertImageUrlToBlob(url, format = 'jpeg', quality = 0.95) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');

        // If JPEG, fill white background to prevent dark transparency
        if (format === 'jpeg' || format === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);
        const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          mimeType,
          quality
        );
      } catch (err) {
        // Fallback: direct fetch
        fetch(url)
          .then((r) => r.blob())
          .then(resolve)
          .catch(reject);
      }
    };
    img.onerror = () => {
      // Fallback: try fetching directly
      fetch(url)
        .then((r) => r.blob())
        .then(resolve)
        .catch(reject);
    };
    img.src = url;
  });
}

/**
 * Triggers a browser download of a blob or URL
 */
export function triggerFileDownload(blobOrUrl, filename) {
  const isString = typeof blobOrUrl === 'string';
  const url = isString ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!isString) {
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
}

/**
 * Downloads a single image converted to the specified format ('jpeg' or 'webp')
 */
export async function downloadImageAs(imageUrl, baseFilename, format = 'jpeg') {
  const ext = format === 'webp' ? 'webp' : 'jpg';
  const cleanName = baseFilename.replace(/\.[a-zA-Z0-9]+$/, '') + `.${ext}`;
  const blob = await convertImageUrlToBlob(imageUrl, format);
  triggerFileDownload(blob, cleanName);
}

/**
 * Packages an array of image URLs into a ZIP file and triggers download
 */
export async function downloadImagesAsZip({
  images = [],
  zipFilename = 'fotos.zip',
  format = 'jpeg', // 'jpeg', 'webp', or 'original'
  onProgress
}) {
  if (!images || images.length === 0) return;
  const zip = new JSZip();

  const total = images.length;
  for (let i = 0; i < total; i++) {
    const rawUrl = images[i];
    const src = rawUrl.startsWith('/') || rawUrl.startsWith('http') ? rawUrl : `/${rawUrl}`;
    if (onProgress) onProgress(i + 1, total);

    try {
      if (format === 'original') {
        const res = await fetch(src);
        const blob = await res.blob();
        const ext = src.split('.').pop() || 'webp';
        zip.file(`foto_${String(i + 1).padStart(2, '0')}.${ext}`, blob);
      } else {
        const ext = format === 'webp' ? 'webp' : 'jpg';
        const blob = await convertImageUrlToBlob(src, format);
        zip.file(`foto_${String(i + 1).padStart(2, '0')}.${ext}`, blob);
      }
    } catch (e) {
      console.warn(`Erro ao adicionar ${src} ao zip:`, e);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  triggerFileDownload(zipBlob, zipFilename);
}
