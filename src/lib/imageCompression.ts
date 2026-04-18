/**
 * Comprime una imagen en el navegador usando la API de Canvas antes de subirla.
 * Si el archivo no es una imagen (ej. PDF), lo devuelve intacto.
 */
export const compressImage = async (file: File, maxWidth = 800, quality = 0.7): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file; // Si es un PDF u otro archivo, no hacer nada
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la proporción
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback si el navegador no soporta Canvas
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir el canvas a un Blob comprimido (WebP o JPEG)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Crear un nuevo File a partir del Blob
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (error) => {
        console.error("Error al cargar la imagen para compresión", error);
        resolve(file); // Fallback si falla
      };
    };
    reader.onerror = (error) => {
      console.error("Error al leer el archivo", error);
      resolve(file); // Fallback si falla
    };
  });
};
