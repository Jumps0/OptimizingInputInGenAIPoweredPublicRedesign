import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Image as KonvaImage } from 'react-konva';
import { 
  Eraser, 
  Pen, 
  RotateCcw, 
  Image as ImageIcon, 
  Undo, 
  Redo, 
  /*Download,*/ 
  ZoomIn, 
  ZoomOut, 
  Move,
  Maximize
} from 'lucide-react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type Konva from 'konva';
import useImage from 'use-image';

type KonvaPointerEvent = KonvaEventObject<MouseEvent | TouchEvent>;

interface InpaintingEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  lines: LineType[];
  onLinesChange: (lines: LineType[]) => void;
  imageUrl?: string | null;
}

export interface LineType {
  tool: 'pen' | 'eraser';
  points: number[];
  strokeWidth: number;
}

// Custom hook for history management
const useHistory = (initialState: LineType[]) => {
  const [history, setHistory] = useState<LineType[][]>([initialState]);
  const [step, setStep] = useState(0);

  const push = (newState: LineType[]) => {
    const newHistory = history.slice(0, step + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setStep(newHistory.length - 1);
  };

  const undo = () => {
    if (step > 0) {
      setStep(step - 1);
      return history[step - 1];
    }
    return null;
  };

  const redo = () => {
    if (step < history.length - 1) {
      setStep(step + 1);
      return history[step + 1];
    }
    return null;
  };

  const reset = () => {
    setHistory([[]]);
    setStep(0);
  };

  return { push, undo, redo, canUndo: step > 0, canRedo: step < history.length - 1, reset };
};

const InpaintingEditor = ({ prompt, onPromptChange, lines, onLinesChange, imageUrl }: InpaintingEditorProps) => {
  const [image] = useImage(imageUrl || '', 'anonymous');
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Canvas State
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Drawing State
  const isDrawing = useRef(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'pan'>('pen');
  const [brushSize, setBrushSize] = useState(140);
  const [mergedMaskImage, setMergedMaskImage] = useState<HTMLCanvasElement | null>(null);

  // History
  const history = useHistory([]);

  // Responsive Stage
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Fit image to stage when loaded
  const lastFittedImageRef = useRef<HTMLImageElement | undefined>(undefined);

  const clampPointToImage = (point: { x: number; y: number }) => {
    if (!image) return point;
    return {
      x: Math.max(0, Math.min(image.width, point.x)),
      y: Math.max(0, Math.min(image.height, point.y)),
    };
  };

  useEffect(() => {
    if (image && containerRef.current && image !== lastFittedImageRef.current) {
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;

      if (width === 0 || height === 0) return;

      const imageRatio = image.width / image.height;
      const stageRatio = width / height;
      
      let newScale = 1;
      if (stageRatio > imageRatio) {
        newScale = height / image.height;
      } else {
        newScale = width / image.width;
      }
      
      // Center image
      const newX = (width - image.width * newScale) / 2;
      const newY = (height - image.height * newScale) / 2;

      // Use requestAnimationFrame to avoid synchronous state updates during effect
      requestAnimationFrame(() => {
        setScale(newScale * 0.9); // 90% fit
        setPosition({ x: newX, y: newY });
      });
      lastFittedImageRef.current = image;
    }
  }, [image]);

  // Compose all strokes into one mask image so overlap does not increase opacity.
  useEffect(() => {
    if (!image || lines.length === 0) {
      setMergedMaskImage(null);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');

    if (!context) {
      setMergedMaskImage(null);
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (const line of lines) {
      if (line.points.length < 2) continue;

      context.save();
      context.globalCompositeOperation = line.tool === 'eraser' ? 'destination-out' : 'source-over';
      context.strokeStyle = '#df4b26';
      context.lineWidth = line.strokeWidth;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(line.points[0], line.points[1]);

      for (let i = 2; i < line.points.length; i += 2) {
        context.lineTo(line.points[i], line.points[i + 1]);
      }

      context.stroke();
      context.restore();
    }

    setMergedMaskImage(canvas);
  }, [image, lines]);

  const handleMouseDown = (e: KonvaPointerEvent) => {
    if (tool === 'pan') return;
    
    e.evt.preventDefault();
    isDrawing.current = true;
    const stage = e.target.getStage();
    if (!stage) return;
    
    // Get pointer position relative to the image/layer transform
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = transform.point(pointerPos);
    if (image && (pos.x < 0 || pos.x > image.width || pos.y < 0 || pos.y > image.height)) return;

    const clampedPos = clampPointToImage(pos);
    onLinesChange([...lines, { tool: tool === 'eraser' ? 'eraser' : 'pen', points: [clampedPos.x, clampedPos.y], strokeWidth: brushSize }]);
  };

  const handleMouseMove = (e: KonvaPointerEvent) => {
    if (!isDrawing.current || tool === 'pan') {
      return;
    }

    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const point = clampPointToImage(transform.point(pointerPos));
    
    const newLines = [...lines];
    const lastLine = { ...newLines[newLines.length - 1] };
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    newLines.splice(newLines.length - 1, 1, lastLine);
    onLinesChange(newLines);
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      history.push(lines); // Add to history after stroke
    }
  };

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;
    
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    setScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  const handleUndo = () => {
    const prev = history.undo();
    if (prev) onLinesChange(prev);
  };

  const handleRedo = () => {
    const next = history.redo();
    if (next) onLinesChange(next);
  };

  /*
  const handleDownload = () => {
    if (!stageRef.current) return;
    
    // Create a temporary link
    const uri = stageRef.current.toDataURL({
       pixelRatio: 2 // High quality
    });
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  */
  
  const handleZoomIn = () => {
     setScale(s => s * 1.2);
  };
  
  const handleZoomOut = () => {
     setScale(s => s * 0.8);
  };
  
  const handleResetView = () => {
      // Re-center logic similar to initial load
      if (image) {
          const stageRatio = stageSize.width / stageSize.height;
          const imageRatio = image.width / image.height;
          let newScale = 1;
          if (stageRatio > imageRatio) {
            newScale = stageSize.height / image.height;
          } else {
            newScale = stageSize.width / image.width;
          }
          const newX = (stageSize.width - image.width * newScale) / 2;
          const newY = (stageSize.height - image.height * newScale) / 2;
          setScale(newScale * 0.9);
          setPosition({ x: newX, y: newY });
      } else {
          setScale(1);
          setPosition({ x: 0, y: 0 });
      }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-md transition-all ${tool === 'pen' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
            title="Brush (B)"
          >
            <Pen size={18} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
            title="Eraser (E)"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={() => setTool('pan')}
            className={`p-2 rounded-md transition-all ${tool === 'pan' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}
            title="Pan Tool (Space)"
          >
            <Move size={18} />
          </button>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg px-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Size</span>
          <input
            type="range"
            min="50"
            max="200"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs text-gray-600 w-6 text-right">{brushSize}px</span>
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

        <div className="flex items-center space-x-1">
          <button onClick={handleUndo} disabled={!history.canUndo} className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-100" title="Undo">
            <Undo size={18} />
          </button>
          <button onClick={handleRedo} disabled={!history.canRedo} className="p-2 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded hover:bg-gray-100" title="Redo">
            <Redo size={18} />
          </button>
          <button onClick={() => { onLinesChange([]); history.reset(); }} className="p-2 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" title="Clear All">
            <RotateCcw size={18} />
          </button>
        </div>
        
        <div className="flex-1"></div>

        <div className="flex items-center space-x-2">
           <button onClick={handleResetView} className="p-2 text-gray-500 hover:bg-gray-100 rounded" title="Fit to Screen">
              <Maximize size={18} />
           </button>
           {/*}
           <button 
             onClick={handleDownload}
             className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
           >
             <Download size={16} />
             Save Image
           </button>
           */}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[400px] border border-gray-200 rounded-xl bg-gray-100 overflow-hidden shadow-inner group">
        <div className="absolute inset-0 bg-[url('https://t3.ftcdn.net/jpg/04/54/01/53/360_F_454015329_4279P55e5b565756.jpg')] opacity-5 pointer-events-none bg-repeat"></div> {/* Checkered background pattern optional */}
        
        <div ref={containerRef} className="absolute inset-0 w-full h-full touch-none">
            {!imageUrl && !image && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pointer-events-none">
                    <ImageIcon size={64} className="mb-2 opacity-20" />
                    <p className="text-sm font-medium opacity-40">No image loaded</p>
                </div>
            )}
            
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              onTouchCancel={handleMouseUp}
              onWheel={handleWheel}
              draggable={tool === 'pan'}
              onDragEnd={(e) => {
                  setPosition(e.target.position());
              }}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              className={`${tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
            >
              <Layer>
                {/* Background Image */}
                {image && (
                  <KonvaImage
                    image={image}
                    listening={false} // Don't interfere with drawing
                  />
                )}
              </Layer>
              <Layer>
                {/* Drawing Layer */}
                {mergedMaskImage ? (
                  <KonvaImage image={mergedMaskImage} opacity={0.65} listening={false} />
                ) : (
                  lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke="#df4b26"
                      strokeWidth={line.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                      }
                      opacity={0.65}
                    />
                  ))
                )}
              </Layer>
            </Stage>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white p-1 rounded-lg shadow-md border border-gray-100">
           <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom In">
             <ZoomIn size={18} />
           </button>
           <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded text-gray-600" title="Zoom Out">
             <ZoomOut size={18} />
           </button>
           <div className="text-[10px] text-center font-mono text-gray-400 border-t pt-1 mt-1">
             {Math.round(scale * 100)}%
           </div>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 flex justify-between">
          <span>Edit Instruction</span>
          <span className="text-xs font-normal text-gray-400">Describe what you want to change in the masked area</span>
        </label>
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="e.g. Remove the person from the background, or replace the sky with a sunset..."
          className="w-full h-24 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50 transition-all"
        />
      </div>

      {/* Instructions / Tips */}
      <div className="bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold text-lg mb-2">How to Use</h4>
        <p className="text-sm">
          Use the brush to <span className="font-medium text-blue-700">paint over</span> areas you want to edit, and the eraser to remove any unwanted marks. Use the pan tool to move around the image, and the zoom controls to get a closer look. When you're done, <span className="font-medium text-blue-700">enter a prompt</span> describing your desired edits.
        </p>
      </div>
      <div className="bg-blue-100 p-4 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Tips for better results:</h4>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Avoid using the word 'remove', instead ask to 'replace'</li>
          <li>Mention specific materials (wood, stone, metal)</li>
          <li>Describe lighting (sunny, sunset, evening)</li>
          <li>Specify styles (modern, classical, eco-friendly)</li>
        </ul>
      </div>
    </div>
  );
};

export default InpaintingEditor;
