/** Max dimension (width or height) to resize uploaded images to, to keep localStorage manageable. */
const MAX_IMAGE_DIMENSION = 2048;

/**
 * Reads a File as a data URL, resizing if necessary to fit within MAX_IMAGE_DIMENSION.
 * Returns the data URL and natural dimensions of the (possibly resized) image.
 */
export function readAndResizeImage(
  file: File
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Resize if too large
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const ratio = Math.min(
            MAX_IMAGE_DIMENSION / width,
            MAX_IMAGE_DIMENSION / height
          );
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        // Use JPEG at 0.8 quality for smaller size
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve({ dataUrl, width, height });
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
