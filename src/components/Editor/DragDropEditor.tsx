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
  const [draggedItem, setDraggedItem] = useState<{ type: string, label: string } | null>(null);
  const [movingElementId, setMovingElementId] = useState<string | null>(null);


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

  const handleDragStart = (e: React.DragEvent, type: string, label: string) => {
    setDraggedItem({ type, label });
    e.dataTransfer.setData('application/json', JSON.stringify({ type, label, isNew: true }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setMovingElementId(null);
  };

  const handleElementDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setMovingElementId(id);
    e.dataTransfer.setData('application/json', JSON.stringify({ id, isNew: false }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = movingElementId ? 'move' : 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.isNew) {
        // Add new element
        const newElement: DroppedElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: data.type,
          label: data.label,
          x: clampedX,
          y: clampedY
        };
        onElementsChange([...placedElements, newElement]);
      } else {
        // Move existing element
        const updatedElements = placedElements.map(el => 
          el.id === data.id ? { ...el, x: clampedX, y: clampedY } : el
        );
        onElementsChange(updatedElements);
      }
    } catch (err) {
      console.error("Drop error", err);
    }
    
    setDraggedItem(null);
    setMovingElementId(null);
  };

  const removeElement = (id: string) => {
    onElementsChange(placedElements.filter(el => el.id !== id));
  };

  const getIconComponent = (type: string) => {
    const element = DRAGGABLE_ELEMENTS.find(el => el.id === type);
    return element ? element.icon : Armchair;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Canvas Area */}
      <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner group min-h-[400px] flex items-center justify-center">
        {imageUrl ? (
          <div 
            ref={containerRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="relative inline-block max-w-full max-h-[600px]"
          >
            <img 
              src={imageUrl} 
              alt="Workspace" 
              className="max-w-full max-h-[600px] object-contain block pointer-events-none select-none" 
            />
            
            {/* Overlay Grid (Optional, visible on drag) */}
            {(draggedItem || movingElementId) && (
              <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed z-10 pointer-events-none" />
            )}

            {/* Dropped Elements */}
            {placedElements.map((el) => {
              const Icon = getIconComponent(el.type);
              const isMoving = movingElementId === el.id;
              
              return (
                <div
                  key={el.id}
                  draggable
                  onDragStart={(e) => handleElementDragStart(e, el.id)}
                  onDragEnd={handleDragEnd}
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-600 shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            
            {placedElements.length === 0 && !draggedItem && (
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Available Elements</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {DRAGGABLE_ELEMENTS.map((element) => (
            <div
              key={element.id}
              draggable
              onDragStart={(e) => handleDragStart(e, element.id, element.label)}
              onDragEnd={handleDragEnd}
              className="flex flex-col items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-200 hover:shadow-md transition-all active:cursor-grabbing group"
            >
              <div className="p-2 bg-white rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <element.icon size={20} className="text-gray-700 group-hover:text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-blue-700">{element.label}</span>
            </div>
          ))}
        </div>
      </div>
      
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
