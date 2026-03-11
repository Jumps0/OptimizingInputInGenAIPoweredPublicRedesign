import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Mic,
  Type,
  Paintbrush,
  Hand,
  Sparkles,
  TreeDeciduous,
  Armchair,
  Droplet,
  Camera,
  Grid,
  User,
  Bike,
  Lamp,
  Flower2,
  Brain,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { InpaintingCanvas } from "./InpaintingCanvas";

interface EditScreenProps {
  originalImage: string;
  onBack: () => void;
  onComplete: (editedImage: string, aiChanges: string, location?: string) => void;
  onGenerationComplete?: (userInput: string, inputMethod: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToProfile?: () => void;
}

export function EditScreen({
  originalImage,
  onBack,
  onComplete,
  onGenerationComplete,
  onNavigateToFeed,
  onNavigateToProfile,
}: EditScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"" | "voice" | "text" | "inpainting" | "drag">("");
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  
  // Text state
  const [textPrompt, setTextPrompt] = useState("");
  
  // Inpainting state
  const [inpaintingMask, setInpaintingMask] = useState<string>("");
  const [inpaintingPrompt, setInpaintingPrompt] = useState("");
  
  // Drag and drop state
  const [droppedIcons, setDroppedIcons] = useState<
    Array<{
      id: string;
      x: number;
      y: number;
      icon: any;
      label: string;
    }>
  >([]);
  const [dragDropPrompt, setDragDropPrompt] = useState("");
  const [isDragDropListening, setIsDragDropListening] = useState(false);
  const [dragDropVoiceTranscript, setDragDropVoiceTranscript] = useState("");
  const [dragDropLiveTranscript, setDragDropLiveTranscript] = useState("");
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const [activeBottomTab, setActiveBottomTab] = useState<"studio" | "feed" | "profile">("studio");

  // AI-suggested icons based on image analysis
  const aiSuggestedTools = [
    { id: "bench", icon: Armchair, label: "Bench", suggested: true },
    { id: "tree", icon: TreeDeciduous, label: "Tree", suggested: true },
    { id: "fountain", icon: Droplet, label: "Fountain", suggested: true },
    { id: "bike", icon: Bike, label: "Bike Rack", suggested: true },
    { id: "lamp", icon: Lamp, label: "Street Lamp", suggested: true },
    { id: "flower", icon: Flower2, label: "Flower Bed", suggested: true },
  ];

  const dragDropTools = showAISuggestions ? aiSuggestedTools : [
    { id: "bench", icon: Armchair, label: "Bench" },
    { id: "tree", icon: TreeDeciduous, label: "Tree" },
    { id: "fountain", icon: Droplet, label: "Fountain" },
  ];

  // Simulate AI image analysis
  const analyzeImageWithAI = () => {
    setIsAnalyzingImage(true);
    setTimeout(() => {
      setIsAnalyzingImage(false);
      setShowAISuggestions(true);
    }, 2000);
  };

  // Handle navigation
  useEffect(() => {
    if (activeBottomTab === "feed" && onNavigateToFeed) {
      onNavigateToFeed();
    } else if (activeBottomTab === "profile" && onNavigateToProfile) {
      onNavigateToProfile();
    }
  }, [activeBottomTab, onNavigateToFeed, onNavigateToProfile]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Navigate to refinement screen with user input
      if (onGenerationComplete) {
        let userInput = "";
        let inputMethod = "";

        if (selectedMethod === "voice" && voiceTranscript) {
          userInput = voiceTranscript;
          inputMethod = "Voice";
        } else if (selectedMethod === "text" && textPrompt) {
          userInput = textPrompt;
          inputMethod = "Text";
        } else if (selectedMethod === "inpainting" && inpaintingPrompt) {
          userInput = inpaintingPrompt;
          inputMethod = "Inpainting";
        } else if (selectedMethod === "drag" && (droppedIcons.length > 0 || dragDropPrompt || dragDropVoiceTranscript)) {
          const elementsText = droppedIcons.length > 0 ? `Placed ${droppedIcons.map(icon => icon.label).join(", ")}` : "";
          const promptText = dragDropPrompt || dragDropVoiceTranscript || "";
          userInput = [elementsText, promptText].filter(Boolean).join(". ");
          inputMethod = "Drag & Drop";
        } else {
          userInput = "Generate AI redesign variations";
          inputMethod = selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1);
        }

        onGenerationComplete(userInput, inputMethod);
      }
    }, 2000);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setVoiceTranscript(liveTranscript);
      setLiveTranscript("");
    } else {
      // Start listening
      setIsListening(true);
      setLiveTranscript("");
      setVoiceTranscript("");

      // Simulate real-time voice-to-text transcription
      const words = [
        "Add",
        "more",
        "trees",
        "and",
        "benches",
        "to",
        "make",
        "it",
        "more",
        "welcoming",
        "and",
        "green",
      ];
      let currentText = "";

      words.forEach((word, index) => {
        setTimeout(() => {
          currentText += (index === 0 ? "" : " ") + word;
          setLiveTranscript(currentText);

          // Auto-stop after all words
          if (index === words.length - 1) {
            setTimeout(() => {
              setIsListening(false);
              setVoiceTranscript(currentText);
              setLiveTranscript("");
            }, 500);
          }
        }, index * 400);
      });
    }
  };

  const handleDragDropVoiceInput = () => {
    if (isDragDropListening) {
      // Stop listening
      setIsDragDropListening(false);
      setDragDropVoiceTranscript(dragDropLiveTranscript);
      setDragDropLiveTranscript("");
    } else {
      // Start listening
      setIsDragDropListening(true);
      setDragDropLiveTranscript("");
      setDragDropVoiceTranscript("");

      // Simulate real-time voice-to-text transcription
      const words = [
        "Add",
        "benches",
        "near",
        "the",
        "trees",
        "for",
        "shaded",
        "seating",
      ];
      let currentText = "";

      words.forEach((word, index) => {
        setTimeout(() => {
          currentText += (index === 0 ? "" : " ") + word;
          setDragDropLiveTranscript(currentText);

          // Auto-stop after all words
          if (index === words.length - 1) {
            setTimeout(() => {
              setIsDragDropListening(false);
              setDragDropVoiceTranscript(currentText);
              setDragDropLiveTranscript("");
            }, 500);
          }
        }, index * 400);
      });
    }
  };

  // Method selection screen
  if (!selectedMethod) {
    return (
      <div className="h-screen w-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span>Choose Input Method</span>
          <div className="w-10" />
        </div>

        {/* Photo preview */}
        <div className="bg-white px-4 pt-4 pb-6">
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
            <ImageWithFallback
              src={originalImage}
              alt="Captured space"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Method selection */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">
              Select how you'd like to describe your redesign
            </p>

            {/* Voice Option */}
            <button
              onClick={() => setSelectedMethod("voice")}
              className="w-full bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Mic className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 group-hover:text-purple-600 transition-colors">Voice Input</h3>
                  <p className="text-sm text-gray-600">
                    Speak your redesign ideas naturally
                  </p>
                </div>
              </div>
            </button>

            {/* Text Option */}
            <button
              onClick={() => setSelectedMethod("text")}
              className="w-full bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Type className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 group-hover:text-purple-600 transition-colors">Text Input</h3>
                  <p className="text-sm text-gray-600">
                    Type detailed redesign instructions
                  </p>
                </div>
              </div>
            </button>

            {/* Inpainting Option */}
            <button
              onClick={() => setSelectedMethod("inpainting")}
              className="w-full bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Paintbrush className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 group-hover:text-purple-600 transition-colors">Inpainting</h3>
                  <p className="text-sm text-gray-600">
                    Paint over areas to redesign specific zones
                  </p>
                </div>
              </div>
            </button>

            {/* Drag & Drop Option */}
            <button
              onClick={() => setSelectedMethod("drag")}
              className="w-full bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Hand className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="mb-1 group-hover:text-purple-600 transition-colors">Drag & Drop</h3>
                  <p className="text-sm text-gray-600">
                    Place elements directly on the image
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom navigation tabs */}
        <div className="bg-white border-t px-4 py-3 flex items-center justify-around">
          <button
            onClick={() => setActiveBottomTab("studio")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeBottomTab === "studio" ? "text-purple-600" : "text-gray-400"
            }`}
          >
            <Camera className="h-6 w-6" />
            <span className="text-xs">Studio</span>
          </button>
          <button
            onClick={() => setActiveBottomTab("feed")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeBottomTab === "feed" ? "text-purple-600" : "text-gray-400"
            }`}
          >
            <Grid className="h-6 w-6" />
            <span className="text-xs">Feed</span>
          </button>
          <button
            onClick={() => setActiveBottomTab("profile")}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeBottomTab === "profile" ? "text-purple-600" : "text-gray-400"
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    );
  }

  // Individual method screens
  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setSelectedMethod("")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span>
          {selectedMethod === "voice" && "Voice Input"}
          {selectedMethod === "text" && "Text Input"}
          {selectedMethod === "inpainting" && "Inpainting"}
          {selectedMethod === "drag" && "Drag & Drop"}
        </span>
        <div className="w-10" />
      </div>

      {/* Photo preview */}
      <div className="bg-white px-4 pt-4">
        <div
          className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 relative"
          onDragOver={(e) => {
            if (selectedMethod === "drag") {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(e) => {
            if (selectedMethod === "drag") {
              e.preventDefault();
              const toolId = e.dataTransfer.getData("toolId");
              if (toolId) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const tool = dragDropTools.find((t) => t.id === toolId);
                if (tool) {
                  setDroppedIcons([
                    ...droppedIcons,
                    {
                      id: `${toolId}-${Date.now()}`,
                      x,
                      y,
                      icon: tool.icon,
                      label: tool.label,
                    },
                  ]);
                }
              }
            }
          }}
        >
          <ImageWithFallback
            src={originalImage}
            alt="Captured space"
            className="w-full h-full object-cover"
          />
          {/* Dropped icons overlay */}
          {selectedMethod === "drag" && droppedIcons.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="bg-purple-600 p-2 rounded-full shadow-lg">
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
              </div>
            );
          })}
          {isGenerating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="h-10 w-10 text-white animate-pulse" />
                <p className="text-white">Generating redesign...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input content */}
      <div className="flex-1 overflow-auto">
        {/* Voice Input */}
        {selectedMethod === "voice" && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl p-6">
              <h3 className="mb-2">Voice Input</h3>
              <p className="text-sm text-gray-600 mb-6">
                Describe what you'd like to change in this space
              </p>

              <Button
                onClick={handleVoiceInput}
                variant={isListening ? "default" : "outline"}
                className={`w-full h-20 ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}
              >
                <Mic className="h-6 w-6 mr-2" />
                {isListening ? "Tap to Stop" : "Tap to Speak"}
              </Button>

              {/* Live transcription while listening */}
              {isListening && liveTranscript && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 min-h-[60px]">
                  <p className="text-sm text-red-900">
                    {liveTranscript}
                    <span className="animate-pulse">|</span>
                  </p>
                </div>
              )}

              {/* Final transcript after listening stops */}
              {!isListening && voiceTranscript && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-900">{voiceTranscript}</p>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500">Try saying:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                    "Add more greenery"
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                    "Make it modern"
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                    "Add seating areas"
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Text Input */}
        {selectedMethod === "text" && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl p-6">
              <h3 className="mb-2">Text Prompt</h3>
              <p className="text-sm text-gray-600 mb-4">
                Type your redesign instructions
              </p>

              <Textarea
                placeholder="E.g., Add modern benches, more trees, and a water feature. Make it feel inviting and accessible..."
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                className="min-h-32 resize-none"
              />

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>{textPrompt.length} characters</span>
                <span>Be specific for best results</span>
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-xs text-gray-500">Example prompts:</p>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setTextPrompt(
                        "Transform this into a vibrant community space with colorful seating, planters, and street art"
                      )
                    }
                    className="w-full p-3 bg-gray-50 rounded-lg text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    "Transform into a vibrant community space..."
                  </button>
                  <button
                    onClick={() =>
                      setTextPrompt(
                        "Add sustainable elements like rain gardens, bike racks, and solar-powered lighting"
                      )
                    }
                    className="w-full p-3 bg-gray-50 rounded-lg text-left text-sm hover:bg-gray-100 transition-colors"
                  >
                    "Add sustainable elements like rain gardens..."
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inpainting */}
        {selectedMethod === "inpainting" && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl p-6">
              <h3 className="mb-2">Inpainting</h3>
              <p className="text-sm text-gray-600 mb-4">
                Paint over areas to redesign, then describe what you want
              </p>

              <InpaintingCanvas
                image={originalImage}
                onMaskChange={setInpaintingMask}
                prompt={inpaintingPrompt}
                onPromptChange={setInpaintingPrompt}
              />
            </div>
          </div>
        )}

        {/* Drag & Drop */}
        {selectedMethod === "drag" && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="mb-1">Drag & Drop Elements</h3>
                  <p className="text-sm text-gray-600">
                    Drag elements onto the image to place them
                  </p>
                </div>
                {!showAISuggestions && !isAnalyzingImage && (
                  <Button
                    onClick={analyzeImageWithAI}
                    size="sm"
                    variant="outline"
                    className="ml-2"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Suggest
                  </Button>
                )}
              </div>

              {isAnalyzingImage && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                  <p className="text-sm text-purple-900">
                    AI is analyzing your image to suggest elements...
                  </p>
                </div>
              )}

              {showAISuggestions && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-900">
                    ✨ AI suggested {aiSuggestedTools.length} elements based on your space
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-6">
                {dragDropTools.map((tool) => (
                  <div
                    key={tool.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("toolId", tool.id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 bg-white hover:border-purple-300 transition-all cursor-move active:opacity-50 ${
                      (tool as any).suggested ? "border-green-300 bg-green-50" : ""
                    }`}
                  >
                    <tool.icon className="h-8 w-8 text-gray-600" />
                    <span className="text-sm text-center">{tool.label}</span>
                  </div>
                ))}
              </div>

              {droppedIcons.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                  <p className="text-sm text-purple-900 mb-2">
                    <strong>{droppedIcons.length}</strong> element
                    {droppedIcons.length !== 1 ? "s" : ""} placed
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDroppedIcons([])}
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              )}

              {/* Additional text/voice input for drag & drop */}
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm">
                  Describe what you want to change (optional):
                </p>

                {/* Voice input for drag & drop */}
                <Button
                  onClick={handleDragDropVoiceInput}
                  variant={isDragDropListening ? "default" : "outline"}
                  className={`w-full ${isDragDropListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {isDragDropListening ? "Tap to Stop" : "Voice Input"}
                </Button>

                {/* Live transcription while listening */}
                {isDragDropListening && dragDropLiveTranscript && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-900">
                      {dragDropLiveTranscript}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                )}

                {/* Final transcript after listening stops */}
                {!isDragDropListening && dragDropVoiceTranscript && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900">
                      {dragDropVoiceTranscript}
                    </p>
                  </div>
                )}

                {/* Text input for drag & drop */}
                <Textarea
                  placeholder="E.g., Make sure the benches are in shaded areas under the trees..."
                  value={dragDropPrompt}
                  onChange={(e) => setDragDropPrompt(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 Drag elements onto the image above and optionally add voice or text instructions to refine your design
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="bg-white border-t p-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Generate Redesign
        </Button>
      </div>

      {/* Bottom navigation tabs */}
      <div className="bg-white border-t fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 py-3 flex items-center justify-around">
        <button
          onClick={() => setActiveBottomTab("studio")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeBottomTab === "studio" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Studio</span>
        </button>
        <button
          onClick={() => setActiveBottomTab("feed")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeBottomTab === "feed" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <Grid className="h-6 w-6" />
          <span className="text-xs">Feed</span>
        </button>
        <button
          onClick={() => setActiveBottomTab("profile")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeBottomTab === "profile" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
