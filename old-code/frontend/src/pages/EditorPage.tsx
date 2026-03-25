import { useState, useEffect } from "react";
import ImageCapture from "@/components/ImageCapture";
import { useAuth } from "@/context";
import { saveNewGeneration } from "@/utils";
import {
  TextTool,
  VoiceTool,
  InpaintingTool,
  DragDropTool,
} from "@/components/Editor/Tools";
import type { LineType } from "@/components/Editor/InpaintingEditor";
import type { DroppedElement } from "@/components/Editor/DragDropEditor";
import { ChevronLeft, Sparkles, Download, RotateCcw } from "lucide-react";
import ComparisonSlider from "@/components/ComparisonSlider";
import { applySepiaFilter, applyInpaintingFilter, applyDragDropFilter, downloadImage } from "@/utils/imageUtils";
import SuggestionGallery from "@/components/SuggestionGallery";
import { getRandomSuggestions, getRandomInitialSuggestions } from "@/utils/suggestionImages";

type EditorStep = "upload" | "editor" | "result";
type ToolType = "text" | "voice" | "inpainting" | "dragdrop";

const EditorPage = () => {
  const { user } = useAuth();

  const [step, setStep] = useState<EditorStep>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("text");

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [inpaintingLines, setInpaintingLines] = useState<LineType[]>([]);
  const [placedElements, setPlacedElements] = useState<DroppedElement[]>([]);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (user && user.assignedMethod) {
      setActiveTool(user.assignedMethod);
    }
  }, [user]);

  const handleImageSelect = (_file: File, url: string) => {
    setPreviewUrl(url);
    setSuggestions(getRandomInitialSuggestions());
    setStep("editor");
  };

  const handleBack = () => {
    if (step === "result") {
      setStep("editor");
      setResultImage(null);
      // Reset suggestions to initial when going back to editor
      setSuggestions(getRandomInitialSuggestions());
    } else {
      setStep("upload");
      setPreviewUrl(null);
      setPrompt("");
      setInpaintingLines([]);
      setPlacedElements([]);
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = (url: string) => {
    setPreviewUrl(url);
    setStep("editor");
    setResultImage(null);
    setPrompt("");
    setInpaintingLines([]);
    setPlacedElements([]);
    // When selecting a suggestion, we can show new suggestions or keep current ones.
    // Let's refresh suggestions to keep it interesting
    setSuggestions(getRandomInitialSuggestions());
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      if (previewUrl) {
        let filteredImage;
        if (activeTool === 'inpainting') {
          filteredImage = await applyInpaintingFilter(previewUrl, inpaintingLines);
        } else if (activeTool === 'dragdrop') {
          filteredImage = await applyDragDropFilter(previewUrl, placedElements);
        } else {
          filteredImage = await applySepiaFilter(previewUrl);
        }
        
        setResultImage(filteredImage);

        if (filteredImage && user) {
          await saveNewGeneration(user.id, prompt, previewUrl, filteredImage);
        }

        setSuggestions(getRandomSuggestions());
        setStep("result");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);

      if (previewUrl) {
        setResultImage(previewUrl);

        if (user) {
          await saveNewGeneration(user.id, prompt, previewUrl, previewUrl);
        }
        
        setSuggestions(getRandomSuggestions());
        setStep("result");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      downloadImage(resultImage, `redesign-${Date.now()}.jpg`);
    }
  };

  const renderTool = () => {
    switch (activeTool) {
      case "text":
        return <TextTool prompt={prompt} onPromptChange={setPrompt} />;

      case "voice":
        return <VoiceTool prompt={prompt} onPromptChange={setPrompt} />;

      case "inpainting":
        return (
          <InpaintingTool
            prompt={prompt}
            onPromptChange={setPrompt}
            lines={inpaintingLines}
            onLinesChange={setInpaintingLines}
            imageUrl={previewUrl}
          />
        );

      case "dragdrop":
        return (
          <DragDropTool
            prompt={prompt}
            onPromptChange={setPrompt}
            placedElements={placedElements}
            onElementsChange={setPlacedElements}
            imageUrl={previewUrl}
          />
        );

      default:
        return <div className="text-gray-500">Unknown tool selected</div>;
    }
  };

  const handleRefineResult = () => {
    if (resultImage) {
      setPreviewUrl(resultImage);
      setStep("editor");
      setResultImage(null);
      // setPrompt(""); // Optional: keep prompt or clear it
      setInpaintingLines([]);
      setPlacedElements([]);
      setSuggestions(getRandomInitialSuggestions());
    }
  };

  const renderResult = () => {
    if (!previewUrl || !resultImage) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-300">
          <div className="bg-red-50 p-4 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Generation Failed</h3>
          <p className="text-gray-500 mb-6 max-w-md">
            We couldn't generate the redesign. Please try again or choose a different image.
          </p>
          <button
            onClick={() => {
              setStep("editor");
              setResultImage(null);
            }}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Your Redesign</h3>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            Successfully Generated
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-4 ring-white">
          <ComparisonSlider
            originalImage={previewUrl}
            editedImage={resultImage}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
           {/* Option 1: Edit the Original Image Again */}
          <button
            onClick={() => {
              setStep("editor");
              setResultImage(null);
              setSuggestions(getRandomInitialSuggestions());
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow"
          >
            <RotateCcw size={18} />
            Edit Original
          </button>

          {/* Option 2: Refine the Result (Use result as new input) */}
          <button
            onClick={handleRefineResult}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Sparkles size={18} />
            Refine This Result
          </button>

          {/* Option 3: Download */}
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Download size={18} />
            Download
          </button>
        </div>
        
        {/* Suggestion Gallery Section */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-2xl p-6 border border-emerald-100/50 shadow-sm">
          <SuggestionGallery 
            suggestions={suggestions} 
            onSelect={handleSuggestionSelect} 
            title="Try these AI Variations" 
          />
        </div>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Image Preview Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden group">
        {previewUrl && (
          <div className="relative bg-gray-100">
            <img
              src={previewUrl}
              alt="Original Space"
              className="w-full max-h-[50vh] object-contain mx-auto"
            />
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Original
            </div>
          </div>
        )}
      </div>

      {/* Tool Controls Card */}
      <div className="bg-white border border-gray-100 shadow-lg shadow-emerald-50/50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Editing Controls</h3>
          <div className="h-px w-full bg-gray-100"></div>
        </div>
        {renderTool()}
      </div>
      
      {/* Suggestions Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <SuggestionGallery 
          suggestions={suggestions} 
          onSelect={handleSuggestionSelect} 
          title="Suggested Ideas" 
        />
      </div>
    </div>
  );

  /* ============================
        UPLOAD SCREEN
  ============================ */

  if (step === "upload") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50  overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto my-auto">
          <div className="w-full text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-6">
              AI Public Space Redesign
            </h1>

            <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Capture or upload a public space image and reimagine it with the power of AI.
            </p>

            {user && (
              <div className="mt-6 inline-flex items-center gap-2 bg-white/50 backdrop-blur border border-emerald-100 text-emerald-700 px-5 py-2.5 rounded-full text-sm font-semibold shadow-sm">
                <span className="text-gray-500 font-normal">Method:</span>
                <span className="uppercase tracking-wide">{user.assignedMethod}</span>
              </div>
            )}
          </div>

          <div className="w-full bg-white/80  mb-10 backdrop-blur-xl border border-emerald-200 rounded-3xl shadow-2xl shadow-emerald-100/50 p-4 md:p-10 transition-all hover:shadow-emerald-200/50">
            <ImageCapture onImageSelect={handleImageSelect} />
          </div>
        </div>
        
        <div className="p-6 text-center text-sm text-gray-400">
          Supported formats: JPG, PNG, WEBP • Max size: 10MB
        </div>
      </div>
    );
  }

  /* ============================
        EDITOR SCREEN
  ============================ */

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-none z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm px-6 py-4">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft size={24} />
            </button>
            
            <h2 className="text-lg font-bold text-gray-800 capitalize flex items-center gap-2">
              {step === "result" ? (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <span>Redesign Result</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{activeTool} Editor</span>
                </>
              )}
            </h2>
          </div>
          
          {step !== "result" && (
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Draft Mode
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="max-w-3xl mx-auto px-6 py-8 pb-32 min-h-full">
          {step === "result" ? renderResult() : renderEditor()}
        </div>
      </div>

      {/* Footer / Floating Action Bar - Fixed/Sticky */}
      {step !== "result" && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-20 pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating ||
                (activeTool === "text" && !prompt) ||
                (activeTool === "voice" && !prompt)
              }
              className={`w-full relative group overflow-hidden py-4 px-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0
              ${
                isGenerating
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-gray-900 text-white hover:bg-black"
              }
              `}
            >
              {/* Background gradient effect on hover */}
              {!isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
              )}
              
              {isGenerating ? (
                <>
                  <div className="animate-spin h-5 w-5 rounded-full border-[2.5px] border-gray-300 border-t-emerald-500"></div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-500 to-gray-400">
                    Generating Redesign...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Generate Redesign
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
