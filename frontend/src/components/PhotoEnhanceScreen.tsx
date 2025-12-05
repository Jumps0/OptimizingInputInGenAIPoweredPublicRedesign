import { useState } from "react";
import { ArrowLeft, Sun, Moon, Zap, Palette, Sliders, Check, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PhotoEnhanceScreenProps {
  originalImage: string;
  onBack: () => void;
  onContinue: (enhancedImage: string) => void;
}

export function PhotoEnhanceScreen({ originalImage, onBack, onContinue }: PhotoEnhanceScreenProps) {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [lightingMode, setLightingMode] = useState<"auto" | "bright" | "dim" | "night">("auto");

  const filters = [
    { id: "none", name: "Original", filter: "" },
    { id: "vivid", name: "Vivid", filter: "saturate(1.3) contrast(1.1)" },
    { id: "warm", name: "Warm", filter: "sepia(0.3) saturate(1.2)" },
    { id: "cool", name: "Cool", filter: "hue-rotate(20deg) saturate(1.1)" },
    { id: "bw", name: "B&W", filter: "grayscale(1)" },
    { id: "vintage", name: "Vintage", filter: "sepia(0.5) contrast(0.9) brightness(0.95)" },
  ];

  const lightingModes = [
    { id: "auto", icon: Sparkles, label: "Auto", description: "Balanced" },
    { id: "bright", icon: Sun, label: "Bright", description: "Enhanced light" },
    { id: "dim", icon: Zap, label: "Dim", description: "Softer light" },
    { id: "night", icon: Moon, label: "Night", description: "Low light" },
  ];

  const getImageStyle = () => {
    const filterStr = filters.find(f => f.id === selectedFilter)?.filter || "";
    const lightingAdjust = 
      lightingMode === "bright" ? "brightness(1.15) contrast(1.05)" :
      lightingMode === "dim" ? "brightness(0.9) contrast(0.95)" :
      lightingMode === "night" ? "brightness(0.7) contrast(1.1) saturate(0.8)" :
      "";
    
    return {
      filter: `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) ${filterStr} ${lightingAdjust}`,
      transform: `translateX(${exposure}px)`,
    };
  };

  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setExposure(0);
    setSelectedFilter(null);
    setLightingMode("auto");
  };

  const handleContinue = () => {
    // In a real app, this would apply the filters and return the enhanced image
    onContinue(originalImage);
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span>Enhance Photo</span>
        <Button variant="ghost" onClick={handleReset} className="text-xs">
          Reset
        </Button>
      </div>

      {/* Photo Preview with live adjustments */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-900 relative">
          <ImageWithFallback
            src={originalImage}
            alt="Photo preview"
            className="w-full h-full object-cover transition-all duration-200"
            style={getImageStyle()}
          />
          
          {/* Lighting mode indicator */}
          {lightingMode !== "auto" && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2">
              {lightingModes.find(m => m.id === lightingMode)?.icon && (
                <span className="text-white text-xs flex items-center gap-1">
                  {(() => {
                    const Icon = lightingModes.find(m => m.id === lightingMode)!.icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {lightingModes.find(m => m.id === lightingMode)?.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhancement Controls */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-6">
          {/* Lighting Modes */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="h-5 w-5 text-yellow-600" />
              <h3>Lighting</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {lightingModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setLightingMode(mode.id as any)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    lightingMode === mode.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <mode.icon className={`h-5 w-5 ${lightingMode === mode.id ? "text-purple-600" : "text-gray-600"}`} />
                  <div className="text-center">
                    <p className="text-xs">{mode.label}</p>
                    <p className="text-[10px] text-gray-500">{mode.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-purple-600" />
              <h3>Filters</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id === "none" ? null : filter.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    (filter.id === "none" && selectedFilter === null) || selectedFilter === filter.id
                      ? "border-purple-500 ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="aspect-square bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400" style={{ filter: filter.filter }} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-xs text-center">{filter.name}</p>
                  </div>
                  {((filter.id === "none" && selectedFilter === null) || selectedFilter === filter.id) && (
                    <div className="absolute top-1 right-1 bg-purple-600 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Adjustment Sliders */}
          <div className="bg-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="h-5 w-5 text-blue-600" />
              <h3>Adjustments</h3>
            </div>
            
            <div className="space-y-6">
              {/* Brightness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Brightness</label>
                  <span className="text-sm text-gray-500">{brightness}%</span>
                </div>
                <Slider
                  value={[brightness]}
                  onValueChange={(val) => setBrightness(val[0])}
                  min={50}
                  max={150}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Contrast</label>
                  <span className="text-sm text-gray-500">{contrast}%</span>
                </div>
                <Slider
                  value={[contrast]}
                  onValueChange={(val) => setContrast(val[0])}
                  min={50}
                  max={150}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-700">Saturation</label>
                  <span className="text-sm text-gray-500">{saturation}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  onValueChange={(val) => setSaturation(val[0])}
                  min={0}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
            <p className="text-sm text-purple-900">
              💡 <strong>Tip:</strong> Use "Bright" lighting mode for outdoor spaces or "Dim" for evening scenes. Filters can help establish the mood before AI redesign.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="bg-white border-t p-4">
        <Button
          onClick={handleContinue}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
        >
          Continue to Redesign
        </Button>
      </div>
    </div>
  );
}
