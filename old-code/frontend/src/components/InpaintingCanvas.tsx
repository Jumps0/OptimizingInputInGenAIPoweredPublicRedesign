import { useState, useRef, useEffect } from "react";
import { Eraser, Paintbrush, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";

interface InpaintingCanvasProps {
  image: string;
  onMaskChange: (maskData: string) => void;
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
}

export function InpaintingCanvas({ image, onMaskChange, prompt = "", onPromptChange }: InpaintingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    
    img.onload = () => {
      // Set canvas size to match container
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      // Draw the image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setImageLoaded(true);
    };
  }, [image]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Export mask data
    if (canvasRef.current) {
      onMaskChange(canvasRef.current.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== "mousedown" && e.type !== "touchstart") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Scale coordinates to canvas size
    x = (x / rect.width) * canvas.width;
    y = (y / rect.height) * canvas.height;

    ctx.globalCompositeOperation = mode === "draw" ? "source-over" : "destination-out";
    ctx.fillStyle = "rgba(147, 51, 234, 0.5)"; // Purple with transparency
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reload the original image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onMaskChange("");
    };
  };

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="relative aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">Loading image...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "draw" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("draw")}
            className={mode === "draw" ? "bg-purple-600" : ""}
          >
            <Paintbrush className="h-4 w-4 mr-2" />
            Paint
          </Button>
          <Button
            variant={mode === "erase" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("erase")}
            className={mode === "erase" ? "bg-purple-600" : ""}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Erase
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMask}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Brush Size</label>
            <span className="text-sm text-gray-500">{brushSize}px</span>
          </div>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            min={5}
            max={50}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          💡 Paint over the areas you want to redesign, then describe what you want in those areas below.
        </p>
      </div>

      {/* Text prompt for inpainting */}
      <div className="space-y-2">
        <label className="text-sm">What should be in the painted area?</label>
        <Textarea
          placeholder="E.g., Add a fountain, Place benches, Add trees and flowers..."
          value={prompt}
          onChange={(e) => onPromptChange?.(e.target.value)}
          className="min-h-20 resize-none"
        />
        <p className="text-xs text-gray-500">
          {prompt.length} characters
        </p>
      </div>
    </div>
  );
}
