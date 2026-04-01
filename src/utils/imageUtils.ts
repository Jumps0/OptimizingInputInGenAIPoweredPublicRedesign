import type { LineType } from '@/components/Editor/InpaintingEditor';

export interface DroppedElement {
  id: string;
  type: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export const applySepiaFilter = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin if it's not a local blob/data URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Apply Sepia Filter (simple color transformation)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Sepia formula
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189); // Red
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168); // Green
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131); // Blue
        }
        
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg");
        resolve(dataUrl);
      } catch (err) {
        console.error("Error processing image:", err);
        reject(err);
      }
    };
    
    img.onerror = (err) => {
      console.error("Error loading image for processing:", err);
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageUrl;
  });
};

export const applyInpaintingFilter = async (imageUrl: string, lines: LineType[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin if it's not a local blob/data URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // Build a mask image based on the drawn lines
        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext("2d");
        let maskData: Uint8ClampedArray | null = null;

        if (maskCtx) {
            maskCtx.lineCap = 'round';
            maskCtx.lineJoin = 'round';

            lines.forEach(line => {
                if (line.tool === 'pen') {
                    maskCtx.strokeStyle = 'white';
                    maskCtx.lineWidth = line.strokeWidth;
                    maskCtx.beginPath();
                    maskCtx.moveTo(line.points[0], line.points[1]);
                    for (let i = 2; i < line.points.length; i += 2) {
                        maskCtx.lineTo(line.points[i], line.points[i + 1]);
                    }
                    maskCtx.stroke();
                } else if (line.tool === 'eraser') {
                    maskCtx.globalCompositeOperation = 'destination-out';
                    maskCtx.lineWidth = line.strokeWidth;
                    maskCtx.beginPath();
                    maskCtx.moveTo(line.points[0], line.points[1]);
                    for (let i = 2; i < line.points.length; i += 2) {
                        maskCtx.lineTo(line.points[i], line.points[i + 1]);
                    }
                    maskCtx.stroke();
                    maskCtx.globalCompositeOperation = 'source-over';
                }
            });

            const maskImage = maskCtx.getImageData(0, 0, canvas.width, canvas.height);
            maskData = maskImage.data;
        }

        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const isLine = maskData ? maskData[i + 3] > 0 : false;
            const color = isLine ? 255 : 0;
            data[i] = color;
            data[i + 1] = color;
            data[i + 2] = color;
            data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        
        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      } catch (err) {
        console.error("Error processing inpainting:", err);
        reject(err);
      }
    };
    
    img.onerror = (err) => {
      console.error("Error loading image for inpainting:", err);
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageUrl;
  });
};

export const applyDragDropMask = async (imageUrl: string, elements: DroppedElement[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Fill black background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const circleRadius = canvas.height * 0.05; // 10% of height = diameter, so radius is 5%. If this doesn't work we can swap to a fixed pixel size.

        elements.forEach((element) => {
          const x = (element.x / 100) * canvas.width;
          const y = (element.y / 100) * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
          ctx.fillStyle = 'white';
          ctx.fill();
        });

        const dataUrl = canvas.toDataURL("image/png");
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      } catch (err) {
        console.error("Error creating drag drop mask:", err);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error("Error loading image for drag drop mask:", err);
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
};

export const applyDragDropFilter = async (imageUrl: string, elements: DroppedElement[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin if it's not a local blob/data URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Draw elements
        elements.forEach(el => {
            const x = (el.x / 100) * canvas.width;
            const y = (el.y / 100) * canvas.height;

            // Draw a circle for the element
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();
            ctx.strokeStyle = '#10B981'; // Emerald-500
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw label
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = '#111827'; // Gray-900
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw first letter or simple icon representation if possible
            // But let's just use the label text above it
            ctx.fillText(el.label.substring(0, 1), x, y);

            // Draw full label below
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.strokeText(el.label, x, y + 45);
            ctx.fillText(el.label, x, y + 45);
        });
        
        const dataUrl = canvas.toDataURL("image/jpeg");
        resolve(dataUrl);
      } catch (err) {
        console.error("Error processing drag drop:", err);
        reject(err);
      }
    };
    
    img.onerror = (err) => {
      console.error("Error loading image for drag drop:", err);
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageUrl;
  });
};

export const applyGrayscaleFilter = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};

export const urlToImage = async (imageUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin if it's not a local blob/data URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      resolve(img);
    };

    img.onerror = (err) => {
      console.error("Error loading image:", err);
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
};

const mimeTypeToExtension = (mimeType: string): string => {
  if (mimeType.includes('png')) return '.png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return '.jpg';
  if (mimeType.includes('webp')) return '.webp';
  if (mimeType.includes('gif')) return '.gif';
  if (mimeType.includes('bmp')) return '.bmp';
  return '.png';
};

const getExtensionFromUrl = (imageUrl: string): string | null => {
  try {
    const url = new URL(imageUrl, window.location.href);
    const match = url.pathname.match(/\.(png|jpe?g|webp|gif|bmp)(?:$|\?)/i);
    return match ? match[0].toLowerCase() : null;
  } catch {
    return null;
  }
};

export const fetchImageBytes = async (imageUrl: string): Promise<{ bytes: Uint8Array; fileName: string }> => {
  if (imageUrl.startsWith('data:')) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);
    if (!match) {
      throw new Error('Unsupported data URL format');
    }

    const [, mimeType, base64Data] = match;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return {
      bytes,
      fileName: `input_image${mimeTypeToExtension(mimeType)}`,
    };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch image: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? '';
  const extension = getExtensionFromUrl(imageUrl) || mimeTypeToExtension(contentType) || '.png';

  return {
    bytes: new Uint8Array(arrayBuffer),
    fileName: `input_image${extension}`,
  };
};

export const downloadImage = (imageUrl: string, filename: string = 'redesigned-space.jpg') => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const compressImage = async (imageUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin if it's not a local blob/data URL
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = "Anonymous";
    }

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with reduced quality
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      } catch (err) {
        console.error("Error compressing image:", err);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error("Error loading image for compression:", err);
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
};
