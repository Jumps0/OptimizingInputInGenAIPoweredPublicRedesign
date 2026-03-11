import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Mic,
  Type,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

/**
 * RefinementScreen - Iterative AI Design Refinement
 * 
 * This screen allows users to iteratively refine AI-generated urban redesigns through:
 * - Multi-image selection: Select 1 or multiple generated variants
 * - Combined refinement: Blend features from multiple designs
 * - Voice/Text input: Add specific refinement instructions for any selection
 * - Iterative process: Continue refining until satisfied
 * - Full tracking: All modifications tracked and viewable in AI Changes Transcript
 * 
 * Works with all input methods: Voice, Text, Inpainting, and Drag & Drop
 */

interface RefinementScreenProps {
  originalImage: string;
  initialUserInput: string;
  inputMethod: string;
  onBack: () => void;
  onComplete: (finalImage: string, aiChanges: string, location?: string) => void;
}

interface GeneratedVariant {
  id: string;
  imageUrl: string;
  description: string;
}

export function RefinementScreen({
  originalImage,
  initialUserInput,
  inputMethod,
  onBack,
  onComplete,
}: RefinementScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationRound, setGenerationRound] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [refinementText, setRefinementText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRefinementOpen, setIsRefinementOpen] = useState(false);
  const [allChanges, setAllChanges] = useState<string[]>([]);
  const [enlargedVariant, setEnlargedVariant] = useState<GeneratedVariant | null>(null);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  // Determine which input method to show for refinement
  // Voice → Voice only
  // Text → Text only
  // Inpainting → Text only (after generation)
  // Drag & Drop → Voice only (after generation)
  const showVoiceInput = inputMethod === "Voice" || inputMethod === "Drag & Drop";
  const showTextInput = inputMethod === "Text" || inputMethod === "Inpainting";

  // Mock generated variants - in real app, these would come from AI
  const [generatedVariants, setGeneratedVariants] = useState<
    GeneratedVariant[]
  >([
    {
      id: "1",
      imageUrl:
        "https://images.unsplash.com/photo-1705598123544-645837683702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjBiZW5jaGVzJTIwZ3JlZW58ZW58MXx8fHwxNzYzMTEwNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Added modern benches and enhanced greenery",
    },
    {
      id: "2",
      imageUrl:
        "https://images.unsplash.com/photo-1759751587626-51a0f80afe1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MzExMDY5NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Central fountain with seating areas",
    },
    {
      id: "3",
      imageUrl:
        "https://images.unsplash.com/photo-1762969995339-1ffc336e4c95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1cmJhbiUyMGdhcmRlbnxlbnwxfHx8fDE3NjMxMTA2OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Modern garden with walking paths",
    },
    {
      id: "4",
      imageUrl:
        "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcGFyayUyMHJlZGVzaWdufGVufDF8fHx8MTc2MzExMDY5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Tree-lined promenade with lighting",
    },
    {
      id: "5",
      imageUrl:
        "https://images.unsplash.com/photo-1630250280658-aa9b7bed64df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHB1YmxpYyUyMHNwYWNlJTIwdHJlZXN8ZW58MXx8fHwxNzYzMTEwNjk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Natural landscaping with shade trees",
    },
    {
      id: "6",
      imageUrl:
        "https://images.unsplash.com/photo-1618680189638-2b2f8424800a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwYXJrJTIwZGVzaWdufGVufDF8fHx8MTc2MzExMDY5N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      description: "Community gathering space with pavilion",
    },
  ]);

  const handleVariantClick = (variant: GeneratedVariant, e: React.MouseEvent) => {
    // If clicking on the selection badge, toggle selection without enlarging
    if ((e.target as HTMLElement).closest('.selection-toggle')) {
      handleVariantSelect(variant.id);
    } else {
      // Otherwise, enlarge the image
      setEnlargedVariant(variant);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    setSelectedVariants((prev) => {
      if (prev.includes(variantId)) {
        return prev.filter((id) => id !== variantId);
      } else {
        return [...prev, variantId];
      }
    });
  };

  const handleVoiceInput = () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setVoiceTranscript(liveTranscript);
      setRefinementText(liveTranscript);
      setLiveTranscript("");
    } else {
      // Start listening
      setIsListening(true);
      setLiveTranscript("");
      setVoiceTranscript("");

      // Simulate real-time voice-to-text transcription
      const words = [
        "Make",
        "the",
        "benches",
        "more",
        "colorful",
        "and",
        "add",
        "more",
        "flowers",
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
              setRefinementText(currentText);
              setLiveTranscript("");
            }, 500);
          }
        }, index * 400);
      });
    }
  };

  const handleRefineSelected = () => {
    if (selectedVariants.length === 0) return;

    setIsGenerating(true);

    // Record the refinement for history with detailed information
    const selectedDescriptions = selectedVariants
      .map((id, index) => {
        const variant = generatedVariants.find((v) => v.id === id);
        return variant ? `Design ${index + 1}: \"${variant.description}\"` : null;
      })
      .filter(Boolean)
      .join(" + ");

    if (selectedVariants.length === 1 && refinementText) {
      setAllChanges((prev) => [
        ...prev,
        `Refined ${selectedDescriptions} → Instructions: \"${refinementText}\"`,
      ]);
    } else if (selectedVariants.length === 1 && !refinementText) {
      setAllChanges((prev) => [
        ...prev,
        `Regenerated variations of ${selectedDescriptions}`,
      ]);
    } else if (selectedVariants.length > 1 && refinementText) {
      setAllChanges((prev) => [
        ...prev,
        `Combined ${selectedVariants.length} designs (${selectedDescriptions}) → Instructions: \"${refinementText}\"`,
      ]);
    } else {
      setAllChanges((prev) => [
        ...prev,
        `Combined ${selectedVariants.length} designs (${selectedDescriptions})`,
      ]);
    }

    setTimeout(() => {
      // Generate new variants with different images each time
      // Use timestamp and round number to ensure unique images
      const timestamp = Date.now();
      const roundSeed = generationRound + 1;
      
      // Different image sets for each refinement round
      const imageSets = [
        // Round 1 - Default set
        [
          "https://images.unsplash.com/photo-1705598123544-645837683702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjBiZW5jaGVzJTIwZ3JlZW58ZW58MXx8fHwxNzYzMTEwNjk0fDA&ixlib=rb-4.1.0&q=80&w=1080",
          "https://images.unsplash.com/photo-1759751587626-51a0f80afe1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MzExMDY5NHww&ixlib=rb-4.1.0&q=80&w=1080",
          "https://images.unsplash.com/photo-1762969995339-1ffc336e4c95?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1cmJhbiUyMGdhcmRlbnxlbnwxfHx8fDE3NjMxMTA2OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
          "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwcGFyayUyMHJlZGVzaWdufGVufDF8fHx8MTc2MzExMDY5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
          "https://images.unsplash.com/photo-1630250280658-aa9b7bed64df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHB1YmxpYyUyMHNwYWNlJTIwdHJlZXN8ZW58MXx8fHwxNzYzMTEwNjk2fDA&ixlib=rb-4.1.0&q=80&w=1080",
          "https://images.unsplash.com/photo-1618680189638-2b2f8424800a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBwYXJrJTIwZGVzaWdufGVufDF8fHx8MTc2MzExMDY5N3ww&ixlib=rb-4.1.0&q=80&w=1080",
        ],
        // Round 2 - Different urban designs
        [
          "https://images.unsplash.com/photo-1519501025264-65ba15a82390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1587586062566-447f8ac22e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1581092918484-8313de5c6a8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1519003722824-194d4455a60c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        ],
        // Round 3 - Modern urban spaces
        [
          "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1582407947304-fd86f028f716?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1551801841-ecad875a5142?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1502489597346-dad15683d4c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        ],
        // Round 4+ - Parks and green spaces
        [
          "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1587574293340-e0011c4e8ecf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1541480601022-2308c0f02487?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1562155955-1cb2d73488d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
          "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
        ],
      ];
      
      // Select image set based on round (cycle through sets)
      const imageSetIndex = Math.min(roundSeed - 1, imageSets.length - 1);
      const selectedImageSet = imageSets[imageSetIndex];

      const newVariants: GeneratedVariant[] = selectedImageSet.map((url, index) => ({
        id: `${timestamp}-${index}`,
        imageUrl: url,
        description: refinementText && index === 0
          ? `Refined: ${refinementText}`
          : index === 0
          ? "Combined elements from selected designs"
          : `Variation ${index + 1} - Round ${roundSeed}`,
      }));

      setGeneratedVariants(newVariants);
      setSelectedVariants([]);
      setRefinementText("");
      setVoiceTranscript("");
      setIsGenerating(false);
      setGenerationRound((prev) => prev + 1);
      setIsRefinementOpen(false);
    }, 2000);
  };

  const handleSaveToGallery = () => {
    if (selectedVariants.length !== 1) return;

    const selectedVariant = generatedVariants.find(
      (v) => v.id === selectedVariants[0]
    );

    if (selectedVariant) {
      // Compile all AI changes into one comprehensive description
      let compiledChanges = `Initial Request (${inputMethod}): "${initialUserInput || "Generate AI redesign variations"}"`;
      
      if (allChanges.length > 0) {
        compiledChanges += `\n\nRefinement Iterations (${allChanges.length}):\n${allChanges.map((change, i) => `${i + 1}. ${change}`).join('\n')}`;
      }
      
      compiledChanges += `\n\nFinal Result (Round ${generationRound}): ${selectedVariant.description}`;
      
      onComplete(
        selectedVariant.imageUrl,
        compiledChanges,
        "Urban Area"
      );
    }
  };

  const canRefine = selectedVariants.length > 0;
  const canSave = selectedVariants.length === 1;
  const isMultiSelect = selectedVariants.length > 1;

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span>Refine Design</span>
          <span className="text-xs text-gray-500">
            Round {generationRound}
          </span>
        </div>
        <div className="w-10" />
      </div>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Original Uploaded Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-700">Original Image</h3>
              <Badge variant="outline" className="text-xs">Before</Badge>
            </div>
            <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-white">
              <div className="aspect-[4/3] bg-gray-100">
                <ImageWithFallback
                  src={originalImage}
                  alt="Original uploaded image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-purple-900">
                  {selectedVariants.length === 0 ? (
                    <>Tap AI suggestions to enlarge • Use checkboxes to select for refinement</>
                  ) : selectedVariants.length === 1 ? (
                    <>Optionally add refinement instructions below, then tap "Refine Selected"</>
                  ) : (
                    <>Optionally add instructions below to guide how features are combined</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* AI Generated Suggestions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm text-gray-700">AI Generated Suggestions</h3>
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                {generatedVariants.length} variants
              </Badge>
            </div>

            {isGenerating ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-lg bg-gray-200 animate-pulse flex items-center justify-center"
                  >
                    <Sparkles className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {generatedVariants.map((variant) => {
                  const isSelected = selectedVariants.includes(variant.id);
                  return (
                    <div
                      key={variant.id}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isSelected
                          ? "border-purple-500 ring-4 ring-purple-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={(e) => handleVariantClick(variant, e)}
                    >
                      <div className="aspect-[4/3] bg-gray-100 relative group">
                        <ImageWithFallback
                          src={variant.imageUrl}
                          alt={variant.description}
                          className="w-full h-full object-cover"
                        />
                        {/* Zoom indicator on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                          <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs line-clamp-2">
                          {variant.description}
                        </p>
                      </div>
                      {/* Selection toggle button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVariantSelect(variant.id);
                        }}
                        className={`selection-toggle absolute top-2 right-2 rounded-full p-1 transition-all ${
                          isSelected
                            ? "bg-purple-600"
                            : "bg-white/80 hover:bg-white"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />
                        )}
                      </button>
                      {isSelected && selectedVariants.length > 1 && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs pointer-events-none">
                          {selectedVariants.indexOf(variant.id) + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Refinement input - show for any selection */}
          {selectedVariants.length > 0 && !isGenerating && (
            <Collapsible
              open={isRefinementOpen}
              onOpenChange={setIsRefinementOpen}
              className="mt-4"
            >
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Type className="h-5 w-5 text-purple-600" />
                    <h3>
                      {selectedVariants.length === 1 
                        ? "Add Refinement Instructions" 
                        : `Refine ${selectedVariants.length} Designs`}
                    </h3>
                  </div>
                  {isRefinementOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-4">
                    {/* Show different instruction based on selection count */}
                    {selectedVariants.length > 1 && (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-900">
                          💡 You've selected {selectedVariants.length} designs. Add instructions below to guide how their features should be combined.
                        </p>
                      </div>
                    )}

                    {/* Voice input */}
                    {showVoiceInput && (
                      <div>
                        <Button
                          onClick={handleVoiceInput}
                          variant={isListening ? "default" : "outline"}
                          className={`w-full h-14 ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : ""}`}
                        >
                          <Mic className="h-5 w-5 mr-2" />
                          {isListening ? "Tap to Stop" : "Voice Input"}
                        </Button>

                        {/* Live transcription */}
                        {isListening && liveTranscript && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm text-red-900">
                              {liveTranscript}
                              <span className="animate-pulse">|</span>
                            </p>
                          </div>
                        )}

                        {/* Final transcript */}
                        {!isListening && voiceTranscript && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-900">
                              {voiceTranscript}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Text input */}
                    {showTextInput && (
                      <div>
                        <Textarea
                          placeholder={
                            selectedVariants.length === 1
                              ? "E.g., Make the benches more colorful, add playground equipment, increase shade coverage..."
                              : "E.g., Combine the benches from design 1 with the fountain from design 2, make it more colorful..."
                          }
                          value={refinementText}
                          onChange={(e) => setRefinementText(e.target.value)}
                          className="min-h-24 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {refinementText.length} characters
                        </p>
                      </div>
                    )}

                    {/* Example prompts */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">Quick suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVariants.length === 1 ? (
                          <>
                            <button
                              onClick={() =>
                                setRefinementText("Add more vibrant colors")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              More vibrant colors
                            </button>
                            <button
                              onClick={() =>
                                setRefinementText("Increase accessibility features")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              More accessible
                            </button>
                            <button
                              onClick={() =>
                                setRefinementText("Add play areas for children")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              Add play areas
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                setRefinementText("Blend the best features together")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              Blend best features
                            </button>
                            <button
                              onClick={() =>
                                setRefinementText("Make it more cohesive and unified")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              More cohesive
                            </button>
                            <button
                              onClick={() =>
                                setRefinementText("Emphasize modern elements")
                              }
                              className="px-3 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200 transition-colors"
                            >
                              Emphasize modern
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* Info cards */}
          {!isGenerating && (
            <div className="space-y-3">
              {selectedVariants.length === 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    💡 <strong>Tip:</strong> Select any number of designs and optionally add refinement instructions (voice or text) to guide the AI. You can keep refining until you're satisfied, then save your favorite!
                  </p>
                </div>
              )}

              {allChanges.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm mb-2 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-gray-600" />
                    Refinement History ({allChanges.length} {allChanges.length === 1 ? 'iteration' : 'iterations'})
                  </h4>
                  <div className="space-y-2">
                    {allChanges.map((change, index) => (
                      <div key={index} className="flex gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                          {index + 1}
                        </Badge>
                        <p className="flex-1 leading-relaxed">{change}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Tap "View AI Changes" below for full transcript
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="bg-white border-t p-4 space-y-2">
        {/* Selection info */}
        {selectedVariants.length > 0 && !isGenerating && (
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 mb-2">
            <p className="text-xs text-purple-900">
              {selectedVariants.length === 1 ? (
                <>✨ 1 design selected - Refine it further or save to gallery</>
              ) : (
                <>🎨 {selectedVariants.length} designs selected - Combine their features</>
              )}
            </p>
          </div>
        )}

        {/* Explore More / Refine Again Button */}
        {selectedVariants.length > 0 && (
          <Button
            onClick={handleRefineSelected}
            disabled={isGenerating}
            className="w-full h-12 bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Generating New Variants...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                {generationRound === 1 ? "Refine Selected" : "Explore More Variations"}
              </>
            )}
          </Button>
        )}

        {/* Save to Gallery Button */}
        <Button
          onClick={handleSaveToGallery}
          disabled={!canSave}
          variant={canSave ? "default" : "outline"}
          className={`w-full h-12 ${canSave ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          <Check className="h-5 w-5 mr-2" />
          {canSave
            ? "Save to Gallery"
            : selectedVariants.length === 0 
              ? "Select 1 design to save"
              : "Select only 1 design to save"}
        </Button>

        {/* Info message for iterative refinement */}
        {generationRound > 1 && !isGenerating && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-900 text-center">
              💡 Keep selecting and refining until you find the perfect design
            </p>
          </div>
        )}

        {/* View AI Changes Transcript */}
        <Button
          onClick={() => setIsTranscriptOpen(true)}
          variant="outline"
          className="w-full h-10"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          View AI Changes
        </Button>
      </div>

      {/* Enlarged Image Dialog */}
      <Dialog open={!!enlargedVariant} onOpenChange={(open) => !open && setEnlargedVariant(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Design Preview</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEnlargedVariant(null)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              View enlarged design variant for detailed review
            </DialogDescription>
          </DialogHeader>
          {enlargedVariant && (
            <div className="overflow-auto max-h-[calc(90vh-120px)]">
              <div className="p-4 pt-0">
                {/* Enlarged Image */}
                <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-4">
                  <ImageWithFallback
                    src={enlargedVariant.imageUrl}
                    alt={enlargedVariant.description}
                    className="w-full h-auto object-contain"
                  />
                </div>

                {/* Description */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 mb-4">
                  <h4 className="text-sm text-purple-900 mb-1">AI Modifications</h4>
                  <p className="text-sm text-purple-800">{enlargedVariant.description}</p>
                </div>

                {/* Selection Controls */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      handleVariantSelect(enlargedVariant.id);
                    }}
                    variant={selectedVariants.includes(enlargedVariant.id) ? "default" : "outline"}
                    className={`flex-1 ${selectedVariants.includes(enlargedVariant.id) ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                  >
                    {selectedVariants.includes(enlargedVariant.id) ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Selected
                        {selectedVariants.length > 1 && ` (${selectedVariants.indexOf(enlargedVariant.id) + 1})`}
                      </>
                    ) : (
                      <>Select for Refinement</>
                    )}
                  </Button>
                  <Button
                    onClick={() => setEnlargedVariant(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Changes Transcript Dialog */}
      <Dialog open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Changes Transcript
            </DialogTitle>
            <DialogDescription className="sr-only">
              View complete history of AI-generated changes and refinements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Original User Input */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">Initial</Badge>
                <div className="flex-1">
                  <h4 className="text-sm text-blue-900 mb-1">
                    Original Request ({inputMethod})
                  </h4>
                  <p className="text-sm text-blue-800">
                    {initialUserInput || "Generate AI redesign variations"}
                  </p>
                </div>
              </div>
            </div>

            {/* Refinement History */}
            {allChanges.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm text-gray-700">Refinement Rounds</h4>
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200 mb-3">
                  <p className="text-xs text-purple-900">
                    📝 Complete history of all AI modifications and iterations
                  </p>
                </div>
                {allChanges.map((change, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5 bg-purple-600">
                        Round {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{change}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No refinements yet */}
            {allChanges.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  No refinements yet. Select designs and add instructions to start refining!
                </p>
              </div>
            )}

            {/* Current Round Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 bg-green-100 text-green-800 border-green-300">
                  Current
                </Badge>
                <div className="flex-1">
                  <h4 className="text-sm text-green-900 mb-1">
                    Round {generationRound}
                  </h4>
                  <p className="text-sm text-green-800">
                    Viewing {generatedVariants.length} AI-generated design variations. Select one or more to continue refining.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}