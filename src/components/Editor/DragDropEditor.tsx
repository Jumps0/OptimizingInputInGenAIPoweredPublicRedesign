import { useState, useRef, useEffect } from 'react';
import { Armchair, Trees, Droplets, Lightbulb, Trash2, Flower2, X, Flower, Route, Bike } from 'lucide-react';

export interface DroppedElement {
  id: string;
  type: string;
  label: string;
  x: number; 
  y: number; 
}

interface DragDropEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  placedElements: DroppedElement[];
  onElementsChange: (elements: DroppedElement[]) => void;
  imageUrl?: string | null;
}

interface PointerDragState {
  pointerId: number;
  pointerType: string;
  type: string;
  label: string;
  elementId?: string;
  clientX: number;
  clientY: number;
}

const DRAGGABLE_ELEMENTS = [
  { id: 'bench', label: 'Bench', icon: Armchair },
  { id: 'tree', label: 'Tree', icon: Trees },
  { id: 'fountain', label: 'Fountain', icon: Droplets },
  { id: 'lamp', label: 'Street Lamp', icon: Lightbulb },
  { id: 'bin', label: 'Trash can', icon: Trash2 },
  { id: 'flower', label: 'Flowerbed', icon: Flower2 },
  { id: 'bush', label: 'Bush', icon: Flower },
  { id: 'footpath', label: 'Footpath', icon: Route },
  { id: 'bikepath', label: 'Bike Path', icon: Bike },
];

const DragDropEditor = ({ prompt, onPromptChange, placedElements, onElementsChange, imageUrl }: DragDropEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointerDrag, setPointerDrag] = useState<PointerDragState | null>(null);
  const hasReachedStickerLimit = placedElements.length >= 3;


  // Update prompt whenever elements change
  useEffect(() => {
    if (placedElements.length === 0) {
      if (prompt !== '') onPromptChange('');
      return;
    }

    const promptText = placedElements
      .map((element) => "Add a " + element.label.toLowerCase())
      .join(', ');
      
    onPromptChange(promptText);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedElements]);

  const clearPointerDrag = () => {
    setPointerDrag(null);
  };

  const createElementId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return Math.random().toString(36).slice(2, 11);
  };

  const getDropPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const isInside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;

    if (!isInside) {
      return null;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const commitPointerDrop = (clientX: number, clientY: number) => {
    if (!pointerDrag) return;

    const position = getDropPosition(clientX, clientY);
    if (!position) {
      clearPointerDrag();
      return;
    }

    if (pointerDrag.elementId) {
      const updatedElements = placedElements.map((element) =>
        element.id === pointerDrag.elementId ? { ...element, x: position.x, y: position.y } : element
      );
      onElementsChange(updatedElements);
    } else {
      if (placedElements.length >= 3) {
        clearPointerDrag();
        return;
      }

      const newElement: DroppedElement = {
        id: createElementId(),
        type: pointerDrag.type,
        label: pointerDrag.label,
        x: position.x,
        y: position.y,
      };
      onElementsChange([...placedElements, newElement]);
    }

    clearPointerDrag();
  };

  useEffect(() => {
    if (!pointerDrag) return;

    const previousUserSelect = document.body.style.userSelect;
    const previousOverflow = document.body.style.overflow;

    document.body.style.userSelect = 'none';
    if (pointerDrag.pointerType === 'touch') {
      document.body.style.overflow = 'hidden';
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerDrag.pointerId) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      setPointerDrag((currentDrag) =>
        currentDrag && currentDrag.pointerId === event.pointerId
          ? { ...currentDrag, clientX: event.clientX, clientY: event.clientY }
          : currentDrag
      );
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== pointerDrag.pointerId) return;

      if (event.cancelable) {
        event.preventDefault();
      }

      commitPointerDrop(event.clientX, event.clientY);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== pointerDrag.pointerId) return;
      clearPointerDrag();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: false });

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [pointerDrag, placedElements, onElementsChange]);

  const handlePalettePointerDown = (e: React.PointerEvent, type: string, label: string) => {
    if (e.button !== 0) return;
    if (placedElements.length >= 3) return;

    e.preventDefault();
    setPointerDrag({
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      type,
      label,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  const handlePlacedElementPointerDown = (e: React.PointerEvent, element: DroppedElement) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    setPointerDrag({
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      type: element.type,
      label: element.label,
      elementId: element.id,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!pointerDrag) return;

    if (e.cancelable) {
      e.preventDefault();
    }

    setPointerDrag((currentDrag) =>
      currentDrag
        ? { ...currentDrag, clientX: e.clientX, clientY: e.clientY }
        : currentDrag
    );
  };

  const removeElement = (id: string) => {
    onElementsChange(placedElements.filter(el => el.id !== id));
  };

  const getIconComponent = (type: string) => {
    const element = DRAGGABLE_ELEMENTS.find(el => el.id === type);
    return element ? element.icon : Armchair;
  };

  const previewPosition = pointerDrag ? getDropPosition(pointerDrag.clientX, pointerDrag.clientY) : null;
  const PreviewIcon = pointerDrag ? getIconComponent(pointerDrag.type) : null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Canvas Area */}
      <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group min-h-[400px] flex items-center justify-center">
        {imageUrl ? (
          <div 
            ref={containerRef}
            onPointerMove={handleCanvasPointerMove}
            className="relative inline-block max-w-full max-h-[600px]"
            style={{ touchAction: pointerDrag ? 'none' : 'auto' }}
          >
            <img 
              src={imageUrl} 
              alt="Workspace" 
              className="max-w-full max-h-[600px] object-contain block pointer-events-none select-none" 
            />
            
            {/* Overlay Grid (Optional, visible on drag) */}
            {pointerDrag && (
              <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed z-10 pointer-events-none" />
            )}

            {pointerDrag && previewPosition && PreviewIcon && (
              <div
                className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-blue-300 pointer-events-none"
                style={{ left: `${previewPosition.x}%`, top: `${previewPosition.y}%` }}
              >
                <PreviewIcon size={24} className="text-gray-800" />
              </div>
            )}

            {/* Dropped Elements */}
            {placedElements.map((el) => {
              const Icon = getIconComponent(el.type);
              const isMoving = pointerDrag?.elementId === el.id;
              
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePlacedElementPointerDown(e, el)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 cursor-move group/item hover:scale-110 hover:z-50 transition-all
                    ${isMoving ? 'opacity-50' : 'opacity-100'}
                  `}
                  style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                  <Icon size={24} className="text-gray-800" />
                  
                  {/* Delete Button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeElement(el.id);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            
            {placedElements.length === 0 && !pointerDrag && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/20">
                   Drag elements here
                 </div>
               </div>
            )}
          </div>
        ) : (
          <div className="text-gray-400 flex flex-col items-center">
            <p>No image loaded</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      {hasReachedStickerLimit ? (
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
          <p className="text-sm font-semibold text-orange-600 text-center">
            Max of 3 stickers at a time. Generate and refine to add more.
          </p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Available Elements</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {DRAGGABLE_ELEMENTS.map((element) => (
              <div
                key={element.id}
                onPointerDown={(e) => handlePalettePointerDown(e, element.id, element.label)}
                className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all active:cursor-grabbing group"
                style={{ touchAction: 'none' }}
              >
                <div className="p-2 bg-white rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                  <element.icon size={20} className="text-gray-700 group-hover:text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{element.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions / Tips */}
      <div className="bg-blue-100 border border-blue-200 text-blue-700 p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold text-lg mb-2">How to Use</h4>
        <p className="text-sm">
          <span className="font-medium text-blue-700">Drag elements</span> from the toolbar onto the workspace. Drag them to reposition, and click the 'x' to delete them.
        </p>
      </div>

      {/* Stats / Clear */}
      {placedElements.length > 0 && (
        <div className="flex justify-between items-center px-2">
          <p className="text-sm text-gray-500">
            {placedElements.length} element{placedElements.length !== 1 ? 's' : ''} placed
          </p>
          <button 
            onClick={() => {
              onElementsChange([]);
              onPromptChange('');
            }}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default DragDropEditor;
