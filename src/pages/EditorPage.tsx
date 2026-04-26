import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ImageCapture from "@/components/ImageCapture";
import { useAuth, useNavigationGuard } from "@/context";
import { saveNewGeneration, addResultFeedback } from "@/utils";
import { TextTool, VoiceTool, InpaintingTool, DragDropTool } from "@/components/Editor/Tools";
import type { LineType } from "@/components/Editor/InpaintingEditor";
import type { DroppedElement } from "@/components/Editor/DragDropEditor";
import {  Sparkles, RotateCcw, CheckCircle2, Loader2, ImageOff, /*Check, MessageSquareText, X*/ } from "lucide-react";
import ComparisonSlider from "@/components/ComparisonSlider";
import { METHODS } from "@/utils/constants";
import { applySepiaFilter, applyInpaintingFilter, applyDragDropMask, compressImage, fetchImageAsDataUrl, getReusableImageUrl/*,applyDragDropFilter*/ } from "@/utils/imageUtils";

// import SuggestionGallery from "@/components/SuggestionGallery";
import {
  type SuggestionItem,
  getRandomSuggestions,
  getRandomInitialSuggestions,
} from "@/utils/suggestionImages";


type EditorStep = "upload" | "editor" | "result";
type ToolType = "text" | "voice" | "inpainting" | "dragdrop";
type VariantStatus = "loading" | "ready" | "error";

type ResultVariant = {
  imageUrl: string | null;
  status: VariantStatus;
  completedStages: number;
  totalStages: number;
};

const OUTPUT_VARIANTS_COUNT = 3;

const EditorPage = () => {
  const { user } = useAuth();
  const { setGuardEnabled, setBackExitAction } = useNavigationGuard();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const hasAdminSelectedToolRef = useRef(false);

  const [step, setStep] = useState<EditorStep>("upload");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>(
    () => user?.assignedMethod ?? "text"
  );

  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [resultVariants, setResultVariants] = useState<ResultVariant[]>([]);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const [inpaintingLines, setInpaintingLines] = useState<LineType[]>([]);
  const [placedElements, setPlacedElements] = useState<DroppedElement[]>([]);
  /** Increments on refine; resets on new upload or restart. Shown as “Round N” above the comparison. */
  const [sessionRound, setSessionRound] = useState(1);
  const [resultSuggestions, setResultSuggestions] = useState<SuggestionItem[]>([]);
  const [realSuggestions, setRealSuggestions] = useState<SuggestionItem[]>([]);
  const [lastHistoryId, setLastHistoryId] = useState<number | null>(null);
  const [refineBaseHistoryId, setRefineBaseHistoryId] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackThanks, setFeedbackThanks] = useState(false);
  const selectedResultImage =
    resultVariants[selectedVariantIndex]?.imageUrl ||
    resultVariants.find((variant) => variant.imageUrl)?.imageUrl ||
    null;

  const selectedVariant = resultVariants[selectedVariantIndex] ?? null;
  const isSelectedVariantGenerating = Boolean(
    selectedVariant?.imageUrl && selectedVariant.status === "loading"
  );

  const isEditingSessionActive = step !== "upload" && Boolean(previewUrl);

  useEffect(() => {
    setGuardEnabled(isEditingSessionActive);
    return () => {
      setGuardEnabled(false);
    };
  }, [isEditingSessionActive, setGuardEnabled]);

  useEffect(() => {
    if (!user) return;

    // New login/session -> reset admin selection state.
    hasAdminSelectedToolRef.current = false;

    // Non-admin users are locked to their assigned method.
    // Admin users start on their assigned method but can switch freely.
    if (user.role !== "admin") {
      setActiveTool(user.assignedMethod);
      return;
    }

    if (!hasAdminSelectedToolRef.current) {
      setActiveTool(user.assignedMethod);
    }
  }, [user]);

  const toolOptions: Array<{ id: ToolType; label: string }> = [
    { id: "text", label: "Text" },
    { id: "voice", label: "Voice" },
    { id: "inpainting", label: "Inpainting" },
    { id: "dragdrop", label: "Drag & Drop" },
  ];

  const isActiveToolAllowed = (tool: ToolType) => {
    if (!user) return tool === "text";
    if (user.role === "admin") return METHODS.includes(tool);
    return tool === user.assignedMethod;
  };


  const REQUEST_IMAGE_MAX_WIDTH = 1536;
  const REQUEST_IMAGE_JPEG_QUALITY = 0.8;

  const getRequestImageDataUrl = async (imageUrl: string): Promise<string> => {
    try {
      // Normalize any source to a capped JPEG payload for API requests.
      return await compressImage(imageUrl, REQUEST_IMAGE_MAX_WIDTH, REQUEST_IMAGE_JPEG_QUALITY);
    } catch (compressionError) {
      console.warn('Compression failed, falling back to original image payload.', compressionError);
      return fetchImageAsDataUrl(imageUrl);
    }
  };

  const normalizeGeneratedImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    return getReusableImageUrl(imageUrl);
  };

  const bflImage2Image = async (prompt: string, encodedImage: string) => {
    const response = await fetch('/api/bfl/proxy-bfl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        encoded_image: encodedImage,
        model: 'flux-2-klein-9b',
      }),
    });
    console.log("Sent request for image-to-image...");

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'BFL proxy request failed');
    }
    return data;
  };

  
  const bflInpainting = async (prompt: string, encodedImage: string, encoded_mask: string) => {
    const response = await fetch('/api/bfl/proxy-bfl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        encoded_image: encodedImage,
        encoded_mask,
        model: 'flux-pro-1.0-fill',
        steps: 50,
        guidance: 30,
        output_format: 'jpeg',
      }),
    });
    console.log("Sent request for inpainting...");

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || 'BFL proxy request failed');
    }
    return data;
  };
  

  const pollBflGeneration = async (id: string, pollingUrl?: string) => {
    const params = new URLSearchParams();
    params.set('id', id);
    if (pollingUrl) {
      params.set('polling_url', String(pollingUrl));
    }

    // Image2Image takes ~11. Inpainting takes more than 20. Though drag and drop can take A LONG TIME somewhat often.
    const maxAttempts = 90;
    let attempt = 0;

    while (attempt < maxAttempts) {
      console.log(`Polling BFL generation (attempt ${attempt + 1}/${maxAttempts})...`);
      const response = await fetch(`/api/bfl/proxy-bfl?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'BFL proxy polling failed');
      }

      const status = String(data?.status || '').toLowerCase();
      if (status === 'ready') {
        console.log('Data ready!');
        return data;
      }

      if (['error', 'failed'].includes(status)) {
        throw new Error(data?.error || `BFL returned ${data?.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempt += 1;
    }

    throw new Error('BFL generation polling timed out');
  };

  const handleImageSelect = (_file: File, url: string) => {
    setPreviewUrl(url);
    setSessionRound(1);
    setRefineBaseHistoryId(null);
    setResultVariants([]);
    setSelectedVariantIndex(0);
    setStep("editor");
  };

  const handleBack = () => {
    if (step === "result") {
      setStep("editor");
      setResultVariants([]);
      setSelectedVariantIndex(0);
      setLastHistoryId(null);
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackThanks(false);
    } else {
      setStep("upload");
      setPreviewUrl(null);
      setPrompt("");
      setInpaintingLines([]);
      setPlacedElements([]);
      setSessionRound(1);
      setResultVariants([]);
      setSelectedVariantIndex(0);
      setResultSuggestions([]);
      setRealSuggestions([]);
      setLastHistoryId(null);
      setRefineBaseHistoryId(null);
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackThanks(false);
    }
  };

  useEffect(() => {
    if (!isEditingSessionActive) {
      setBackExitAction(null);
      return;
    }

    setBackExitAction(() => () => {
      navigate("/gallery");
    });
    return () => {
      setBackExitAction(null);
    };
  }, [isEditingSessionActive, navigate, setBackExitAction]);

  // const handleSuggestionSelect = (url: string) => {
  //   setPreviewUrl(url);
  //   setSessionRound(1);
  //   setStep("editor");
  //   setResultImage(null);
  //   setLastHistoryId(null);
  //   setFeedbackOpen(false);
  //   setFeedbackText("");
  //   setFeedbackThanks(false);
  //   setPrompt("");
  //   setInpaintingLines([]);
  //   setPlacedElements([]);
  // };

  /*
  ===== HOW TO AVOID 301 / 310 / 321 ERRORS ======
  1. All hooks must be put on the top lever, this is a hook --> const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
     This is also a hook --> useEffect(() => { ... }, []);
  */
  
  // Basic debug function to show a specific image URL/data URL in a popup.
  // Accepts both full data URLs and raw base64 mask strings.
  const showImagePopup = (imageSrc: string) => {
    // Create popup div
    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.top = '30%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.backgroundColor = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    popup.style.zIndex = '1000';
    popup.style.maxWidth = '40vw';
    popup.style.maxHeight = '40vh';
    
    // Normalize raw base64 masks into a displayable data URL.
    const normalizedSrc = imageSrc.startsWith('data:')
      ? imageSrc
      : `data:image/png;base64,${imageSrc}`;

    // Display image source directly (e.g., mask data URL)
    const img = document.createElement('img');
    img.src = normalizedSrc;
    img.style.width = '70%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    
    popup.appendChild(img);
    document.body.appendChild(popup);
    
    // Remove after 5 seconds
    setTimeout(() => {
      popup.remove();
    }, 10000);
  }

  const handleGenerate = async () => {
    console.log("Starting process...");
    if (!previewUrl) return;

    setIsGenerating(true);
    setFeedbackOpen(false);
    setFeedbackText("");
    setFeedbackThanks(false);
    const totalStages = activeTool === "dragdrop" ? Math.max(placedElements.length, 1) : 1;
    setResultVariants(
      Array.from({ length: OUTPUT_VARIANTS_COUNT }, () => ({
        imageUrl: null,
        status: "loading" as const,
        completedStages: 0,
        totalStages,
      }))
    );
    setSelectedVariantIndex(0);
    setStep("result");

    const livePreviewImages: Array<string | null> = Array.from({ length: OUTPUT_VARIANTS_COUNT }, () => null);

    const updateVariantProgress = (
      variantIndex: number,
      imageUrl: string | null,
      completedStages: number,
      totalStages: number,
      status: VariantStatus
    ) => {
      if (imageUrl) {
        livePreviewImages[variantIndex] = imageUrl;
      }

      setResultVariants((prev) => {
        const next = [...prev];
        next[variantIndex] = {
          imageUrl: imageUrl ?? next[variantIndex]?.imageUrl ?? null,
          status,
          completedStages,
          totalStages,
        };
        return next;
      });

      if (imageUrl) {
        setSelectedVariantIndex((currentIndex) => (
          livePreviewImages[currentIndex] ? currentIndex : variantIndex
        ));
      }
    };

    const callImageGeneration = async (
      inputPrompt: string,
      previewUrl: string,
      _inpaintingLines: any[],
      _placedElements: any[],
      onProgress?: (imageUrl: string, completedStages: number, totalStages: number) => void
    ): Promise<string | null> => {
      console.log("...and running generation logic...");

      if(false){ // Pop-out this code to disable AI image editing
        const reusableOutputUrl = normalizeGeneratedImageUrl(await applySepiaFilter(previewUrl));
        console.log('Generation successful.');
        return reusableOutputUrl;
      }

      try {
        let requestImageUrl = await getRequestImageDataUrl(previewUrl);
        let encodedImage = requestImageUrl.split(',')[1] || '';

        // ================== //
        //  DETERMINE INPUTS  //
        // ================== //

        // DEV NOTE: Yes, I know this looks bad. It's done this way to avoid await errors. There's probably a way to avoid this without repeating the logic each time.
        if (activeTool === "text"){
          console.log("...to perform text-to-image. Prompt:", inputPrompt);
          // Simple stuff, all we need is:
          // - inputPrompt (string)
          // - baseImage (the image to modify)

          const textResult = await bflImage2Image(inputPrompt, encodedImage);

          const requestId = textResult?.id;
          const pollingUrl = textResult?.polling_url;

          if (!requestId) {
            console.error('No generation ID returned from BFL proxy:', textResult);
            return null;
          }

          const pollResult = await pollBflGeneration(String(requestId), pollingUrl);
          const outputUrl = pollResult?.result?.sample || pollResult?.sample;

          if (!outputUrl) {
            console.error('BFL proxy returned no output URL:', pollResult);
            return null;
          }

          const reusableOutputUrl = normalizeGeneratedImageUrl(outputUrl);
          if (!reusableOutputUrl) {
            console.error('BFL proxy output URL could not be normalized:', pollResult);
            return null;
          }

          console.log('Generation successful.');
          return reusableOutputUrl;
        }
        else if(activeTool === "voice"){
          console.log("...to perform voice-to-image. Prompt:", inputPrompt);
          // Same as text, voice should have been pre-processed into a text prompt, so we need:
          // - inputPrompt (string)
          // - baseImage (the image to modify)

          const audioResult = await bflImage2Image(inputPrompt, encodedImage);

          const requestId = audioResult?.id;
          const pollingUrl = audioResult?.polling_url;

          if (!requestId) {
            console.error('No generation ID returned from BFL proxy:', audioResult);
            return null;
          }

          const pollResult = await pollBflGeneration(String(requestId), pollingUrl);
          const outputUrl = pollResult?.result?.sample || pollResult?.sample;

          if (!outputUrl) {
            console.error('BFL proxy returned no output URL:', pollResult);
            return null;
          }

          const reusableOutputUrl = normalizeGeneratedImageUrl(outputUrl);
          if (!reusableOutputUrl) {
            console.error('BFL proxy output URL could not be normalized:', pollResult);
            return null;
          }

          console.log('Generation successful.');
          return reusableOutputUrl;
        }
        else if(activeTool === "inpainting"){
          console.log("...to perform inpainting. Prompt:", inputPrompt);
          // This requires a bit more work, we need:
          // - inputPrompt (string)
          // - baseImage (the image to modify)
          // - inpaintingLines (array of {x1, y1, x2, y2} objects representing the lines drawn by the user). Gonna need to parse this into a black & white image
          
          // Convert the lines to an actual mask. Remember: BLACK = NO CHANGE | WHITE = CHANGE
          const mask = await applyInpaintingFilter(requestImageUrl, _inpaintingLines);

          // Generate!
          const inpaintResult = await bflInpainting(inputPrompt, encodedImage, mask);

          const requestId = inpaintResult?.id;
          const pollingUrl = inpaintResult?.polling_url;

          if (!requestId) {
            console.error('No generation ID returned from BFL proxy:', inpaintResult);
            return null;
          }

          const pollResult = await pollBflGeneration(String(requestId), pollingUrl);
          const outputUrl = pollResult?.result?.sample || pollResult?.sample;

          if (!outputUrl) {
            console.error('BFL proxy returned no output URL:', pollResult);
            return null;
          }

          const reusableOutputUrl = normalizeGeneratedImageUrl(outputUrl);
          if (!reusableOutputUrl) {
            console.error('BFL proxy output URL could not be normalized:', pollResult);
            return null;
          }

          console.log('Generation successful.');
          return reusableOutputUrl;
        }
        else if(activeTool === "dragdrop"){
          console.log("...to perform drag & drop.");
          // The most complex (and annoying one). Uses inpainting in phases.
          if (_placedElements.length === 0) {
            console.warn('No placed elements for dragdrop generation');
            return null;
          }

          // Split prompt into relevant segments
          const promptSegments = inputPrompt
            .split(',')
            .map((segment) => segment.trim())
            .filter(Boolean);

          let currentImageUrl = requestImageUrl;
          let currentEncodedImage = encodedImage;
          let outputUrl: string | null = null;
          const totalStages = _placedElements.length;

          // Loop through each element and modify one at a time
          for (let i = 0; i < _placedElements.length; i += 1) {
            const element = _placedElements[i];

            const mask = await applyDragDropMask(currentImageUrl, [element]);
            if(false)showImagePopup(mask);
            
            // Get relevant segment
            const segmentPrompt = promptSegments[i] || `add a ${element.label.toLowerCase()}`;

           console.log(`Processing sticker ${i + 1}/${_placedElements.length}:`, element, 'with prompt segment:', segmentPrompt);
            const inpaintResult = await bflInpainting(segmentPrompt, currentEncodedImage, mask);

            const requestId = inpaintResult?.id;
            const pollingUrl = inpaintResult?.polling_url;

            if (!requestId) {
              console.error('No generation ID returned from BFL proxy:', inpaintResult);
              return null;
            }

            const pollResult = await pollBflGeneration(String(requestId), pollingUrl);
            outputUrl = pollResult?.result?.sample || pollResult?.sample;

            if (!outputUrl) {
              console.error('BFL proxy returned no output URL:', pollResult);
              return null;
            }

            const reusableOutputUrl = normalizeGeneratedImageUrl(outputUrl);
            if (!reusableOutputUrl) {
              console.error('BFL proxy output URL could not be normalized:', pollResult);
              return null;
            }

            console.log(`Sticker ${i + 1} applied.`);
            onProgress?.(reusableOutputUrl, i + 1, totalStages);
            currentImageUrl = await getRequestImageDataUrl(reusableOutputUrl);
            currentEncodedImage = currentImageUrl.split(',')[1] || '';
            outputUrl = reusableOutputUrl;
          }

          console.log('Drag & drop generation successful.');
          return outputUrl;
        }
        else{
          return null;
        }
      } catch (error) {
        console.error('Error calling backend proxy:', error);
        return null;
      }
    };

    try {
      const generatedResults: Array<string | null> = Array.from({ length: OUTPUT_VARIANTS_COUNT }, () => null);

      await Promise.all(
        Array.from({ length: OUTPUT_VARIANTS_COUNT }, async (_, variantIndex) => {
          const generatedImage = await callImageGeneration(
            prompt,
            previewUrl,
            inpaintingLines,
            placedElements,
            (imageUrl, completedStages, totalStages) => {
              updateVariantProgress(variantIndex, imageUrl, completedStages, totalStages, completedStages >= totalStages ? "ready" : "loading");
            }
          );
          generatedResults[variantIndex] = generatedImage;

          if (generatedImage) {
            updateVariantProgress(
              variantIndex,
              generatedImage,
              activeTool === "dragdrop" ? Math.max(placedElements.length, 1) : 1,
              activeTool === "dragdrop" ? Math.max(placedElements.length, 1) : 1,
              "ready"
            );
          } else {
            updateVariantProgress(
              variantIndex,
              null,
              0,
              activeTool === "dragdrop" ? Math.max(placedElements.length, 1) : 1,
              "error"
            );
          }
        })
      );

      if (!generatedResults[selectedVariantIndex]) {
        const firstReadyIndex = generatedResults.findIndex(Boolean);
        if (firstReadyIndex >= 0) {
          setSelectedVariantIndex(firstReadyIndex);
        }
      }

      setResultSuggestions(getRandomSuggestions(4));
      setRealSuggestions(getRandomInitialSuggestions(4));
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const persistSelectedGeneration = async (): Promise<number | null> => {
    if (!previewUrl || !selectedResultImage || !user) {
      return null;
    }

    const resolvedSelectedIndex = resultVariants[selectedVariantIndex]?.imageUrl
      ? selectedVariantIndex
      : resultVariants.findIndex((variant) => Boolean(variant.imageUrl));
    const safeSelectedIndex = Math.max(0, Math.min(resolvedSelectedIndex, OUTPUT_VARIANTS_COUNT - 1));
    const allOutputImages = Array.from({ length: OUTPUT_VARIANTS_COUNT }, (_, index) => {
      return resultVariants[index]?.imageUrl || selectedResultImage;
    });

    const saved = await saveNewGeneration(user.id, user.username, prompt, previewUrl, selectedResultImage, {
      baseHistoryId: refineBaseHistoryId,
      allOutputImages,
      selectedOutputIndex: safeSelectedIndex,
    });

    setLastHistoryId(saved.id);
    return saved.id;
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
            isDisabled={isGenerating}
          />
        );

      default:
        return <div className="text-gray-500">Unknown tool selected</div>;
    }
  };

  //console.log(resultSuggestions, realSuggestions);

  const handleRefineResult = async () => {
    if (!selectedResultImage || isGenerating || isSavingSelection) return;

    setIsSavingSelection(true);
    try {
      const savedHistoryId = await persistSelectedGeneration();
      setRefineBaseHistoryId(savedHistoryId);
      setPreviewUrl(selectedResultImage);
      setSessionRound((r) => r + 1);
      setStep("editor");
      setResultVariants([]);
      setSelectedVariantIndex(0);
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackThanks(false);
      setInpaintingLines([]);
      setPlacedElements([]);
      setResultSuggestions(getRandomSuggestions(4));
      setRealSuggestions(getRandomInitialSuggestions(4));
    } catch (error) {
      console.error("Failed to save selected result for refine:", error);
    } finally {
      setIsSavingSelection(false);
    }
  };

  
  const handleExitGallery = async () => {
    if (isGenerating || isSavingSelection) return;

    setIsSavingSelection(true);
    let didPersist = false;
    try {
      await persistSelectedGeneration();
      setRefineBaseHistoryId(null);
      didPersist = true;
    } catch (error) {
      console.error("Failed to save selected result for gallery:", error);
    } finally {
      setIsSavingSelection(false);
    }

    if (!didPersist) {
      return;
    }

    setFeedbackOpen(false);
    setFeedbackText("");
    navigate("/gallery");
  };

  const handleRestart = () => {
    setSessionRound(1);
    setRefineBaseHistoryId(null);
    setStep("editor");
    setResultVariants([]);
    setSelectedVariantIndex(0);
    setLastHistoryId(null);
    setFeedbackOpen(false);
    setFeedbackText("");
    setFeedbackThanks(false);
  };
  
  /*
  const handleCancelReview = () => {
    setStep("editor");
    setResultImage(null);
    setLastHistoryId(null);
    setFeedbackOpen(false);
    setFeedbackText("");
    setFeedbackThanks(false);
  };
  */

  const handleSubmitFeedback = () => {
    const trimmed = feedbackText.trim();
    if (!trimmed) return;
    addResultFeedback({
      userId: user?.id ?? 0,
      historyId: lastHistoryId,
      round: sessionRound,
      prompt: prompt.slice(0, 500),
      message: trimmed,
    });
    setFeedbackThanks(true);
    setFeedbackText("");
    setFeedbackOpen(false);
  };

  const renderResult = () => {
    const hasReadyVariant = resultVariants.some((variant) => variant.status === "ready" && Boolean(variant.imageUrl));
    const isGenerationComplete =
      !isGenerating &&
      resultVariants.length > 0 &&
      resultVariants.every((variant) => variant.status !== "loading");

    if (!previewUrl || (!isGenerating && resultVariants.length > 0 && !hasReadyVariant)) {
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
              setResultVariants([]);
              setSelectedVariantIndex(0);
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

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 border-b border-gray-200/80 pb-6">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Round {sessionRound}
            </p>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight sm:text-2xl">Before &amp; after</h3>
            {/*}
            <p className="text-sm leading-relaxed text-gray-600 max-w-xl">
              Your source image is on the left; the redesign is on the right. Drag the slider to compare, then choose{" "}
              <span className="font-medium text-gray-800">Exit to Gallery</span> if you are satisfied,{" "}
              <span className="font-medium text-gray-800">Refine this Result</span> to continue editing, or{" "}
              <span className="font-medium text-gray-800">Restart</span> to start over again.
            </p>
            */}
          </div>
          <span className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
            {(isGenerating || isSavingSelection) ? <Loader2 size={14} className="animate-spin" /> : null}
            {isSavingSelection ? "Saving selection" : isGenerating ? "Generating options" : "Output ready"}
          </span>
        </div>

        {isGenerationComplete ? (
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">Image generation complete!</p>
              <p className="text-xs text-gray-600">
                You may now save and exit to the Gallery to see the selected photo(s) you have generated, restart with the same original photo, or go back to the editor to refine the image you have selected further.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleExitGallery()}
                disabled={!selectedResultImage || isGenerating || isSavingSelection}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Save and exit to Gallery
              </button>

              <button
                type="button"
                onClick={() => handleRestart()}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow"
              >
                <RotateCcw size={18} />
                Restart
              </button>

              <button
                type="button"
                onClick={handleRefineResult}
                disabled={!selectedResultImage || isGenerating || isSavingSelection}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles size={18} />
                Refine Selected Result
              </button>
            </div>

          
            {/*
            <div>
            <button
              type="button"
              onClick={() => {
                setFeedbackThanks(false);
                setFeedbackOpen((o) => !o);
              }}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl border-2 font-semibold transition-all ${
                feedbackOpen
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                  : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <MessageSquareText size={18} />
              Give feedback
            </button>
            </div>
            */}

          {feedbackOpen && (
            <div className="pt-2 border-t border-emerald-100/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <label htmlFor="result-feedback" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Your feedback
              </label>
              <textarea
                id="result-feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                placeholder="What would you change? What felt wrong or unclear?"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-y min-h-[100px]"
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackOpen(false);
                    setFeedbackText("");
                  }}
                  className="sm:w-auto w-full py-2.5 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!feedbackText.trim()}
                  onClick={handleSubmitFeedback}
                  className="sm:w-auto w-full py-2.5 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit feedback
                </button>
              </div>
            </div>
          )}

          {feedbackThanks && !feedbackOpen && (
            <p
              className="text-sm text-emerald-800 bg-emerald-50/90 border border-emerald-100 rounded-xl px-4 py-3 animate-in fade-in duration-300"
              role="status"
            >
              Thank you — your feedback was saved and will appear in the admin dashboard.
            </p>
          )}
          </div>
        ) : null}

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-4 ring-white min-h-[280px] sm:min-h-[360px]">
          {selectedResultImage ? (
            <div className="relative">
              <ComparisonSlider
                originalImage={previewUrl}
                editedImage={selectedResultImage}
              />
              {isSelectedVariantGenerating ? (
                <div className="absolute inset-0 z-10 flex items-start justify-between gap-3 bg-gray-900/12 px-4 py-4 pointer-events-none">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
                    <Loader2 size={14} className="animate-spin text-gray-500" />
                    Applying sticker {selectedVariant?.completedStages ?? 0} of {selectedVariant?.totalStages ?? 0}
                  </span>
                  <span className="inline-flex rounded-full bg-gray-800/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    Preview updating
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="h-full min-h-[280px] sm:min-h-[360px] flex flex-col items-center justify-center gap-3 px-5 text-gray-500 bg-gray-50">
              <Loader2 size={28} className="animate-spin text-emerald-600" />
              <p className="max-w-xs text-center text-sm font-medium sm:max-w-none">Preparing first generated image... this usually takes 10-30 seconds.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: OUTPUT_VARIANTS_COUNT }, (_, index) => {
            const variant = resultVariants[index] ?? { imageUrl: null, status: "loading" as const };
            const isSelected = index === selectedVariantIndex;
            const isReady = variant.status === "ready" && Boolean(variant.imageUrl);

            return (
              <button
                key={`variant-${index}`}
                type="button"
                disabled={!isReady || isGenerating}
                onClick={() => {
                  if (isGenerating) return;
                  setSelectedVariantIndex(index);
                }}
                className={`relative overflow-hidden rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-400/40 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                } ${!isReady || isGenerating ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {variant.imageUrl ? (
                    <img src={variant.imageUrl} alt={`Generated option ${index + 1}`} className="w-full h-full object-cover" />
                  ) : variant.status === "error" ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <ImageOff size={20} />
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gray-100" />
                  )}
                </div>

                {variant.status === "loading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/18 text-white pointer-events-none">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="rounded-full bg-gray-800/70 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
                      {variant.imageUrl
                        ? `Applying sticker ${variant.completedStages} of ${variant.totalStages}`
                        : "Generating preview"}
                    </span>
                  </div>
                ) : null}

                {isSelected && isReady ? (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-emerald-500/18" />
                    <div className="absolute inset-0 flex items-start justify-end p-2 sm:p-3">
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                        <CheckCircle2 className="h-8 w-8 sm:h-9 sm:w-9" />
                      </span>
                    </div>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        {/*}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Exit to Gallery
          </button>
        </div>
        */}
        <div className="space-y-3 border-t border-gray-100 pt-8">
          {/*
          <p className="text-sm leading-relaxed text-gray-600">
            Explore curated samples below. Each card summarizes the look—tap to load it as your next editable photo
            (starts a new round).
          </p>
          */}
          {/* <SuggestionGallery
            title="Suggested redesigns"
            suggestions={resultSuggestions}
            onSelect={handleSuggestionSelect}
          />
          <SuggestionGallery
            title="Suggested original photos"
            suggestions={realSuggestions}
            onSelect={handleSuggestionSelect}
          /> */}
        </div>
      </div>
    );
  };

  const renderEditor = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Image Preview Card */}
      {activeTool !== "inpainting" && activeTool !== "dragdrop" && (
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
      )}

      {/* Tool Controls Card */}
      <div className="bg-white border border-gray-100 shadow-lg shadow-emerald-50/50 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400"></div>
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Editing Controls</h3>
          <div className="h-px w-full bg-gray-100"></div>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {isAdmin ? (                
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Method
              </h4>) : null}

            {isAdmin ? (
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
                {toolOptions.map((opt) => {
                  const isActive = activeTool === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (!isActiveToolAllowed(opt.id)) return;
                        hasAdminSelectedToolRef.current = true;
                        setActiveTool(opt.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                      aria-pressed={isActive}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div></div> // Nothing!
            )}
          </div>
        </div>
        {renderTool()}
      </div>
      
    </div>
  );

  /* ============================
        UPLOAD SCREEN
  ============================ */

  if (step === "upload") {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-y-auto pb-24 md:pb-0">
        <div
          className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
          style={{
            // Keep content above the mobile bottom nav + safe-area inset.
            paddingBottom: "calc(max(1.5rem, env(safe-area-inset-bottom)) + 72px)",
            paddingTop: "max(0.5rem, env(safe-area-inset-top))",
          }}
        >
      

          <div className="w-full mb-5 sm:mb-7">
            {/* <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700/90">
                  Step 1 of 3
                </p>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  Capture or upload a photo
                </h1>
                <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                  Use your phone camera for the best results. You’ll add edits next, then review before saving.
                </p>
              </div>

              <div className="shrink-0 hidden sm:flex flex-col items-end gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Method
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-900">
                  {user?.assignedMethod ?? "text"}
                </span>
              </div>
            </div> */}

            {/*}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Method</span>
              <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-900">
                {activeTool}
              </span>
            </div>
            */}
          </div>

          <div className="w-full flex-1 flex flex-col justify-center bg-white/85 backdrop-blur-xl border border-emerald-200/80 rounded-3xl shadow-2xl shadow-emerald-100/50 p-4 sm:p-8 md:p-10 min-h-0">
            <ImageCapture onImageSelect={handleImageSelect} />
          </div>

          {/* <div className="mt-5 grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900">Quick tips</p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Keep the room well lit and hold steady.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Capture the whole space (walls + floor) for better context.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  If the preview looks cropped, retake and step back a little.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200/70 bg-white/70 backdrop-blur p-4 sm:p-5">
              <p className="text-sm font-semibold text-gray-900">What happens next</p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                After you pick a photo, you’ll describe edits and generate a before/after comparison. Nothing is saved
                until you confirm.
              </p>
              <div className="mt-3 inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
                JPG, PNG, WEBP • Max 10MB
              </div>
            </div>
          </div> */}
        </div>



        <div className="px-6 pb-6 text-center text-xs sm:text-sm text-gray-400">
          Tip: On iPhone, allow camera access when prompted for the smoothest flow.
        </div>
      </div>
    );
  }

  /* ============================
        EDITOR SCREEN
  ============================ */

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="max-w-3xl mx-auto px-1 py-1 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-4 min-h-full">
        {step === "result" ? renderResult() : renderEditor()}
      </div>
      </div>

      {/* Footer / Floating Action Bar - Fixed/Sticky */}
      {step !== "result" && (
      <div className="pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0">
        <div className="max-w-3xl mx-auto pointer-events-auto">
        {(() => {
          const canGenerate = (() => {
          if (activeTool === "text") return prompt.trim();
          if (activeTool === "voice") return prompt.trim();
          if (activeTool === "inpainting") {
            return inpaintingLines.length > 0 && prompt.trim();
          }
          if (activeTool === "dragdrop") {
            return placedElements.length > 0 && prompt.trim();
          }
          return false;
          })();

          return canGenerate ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
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
              Generating your edited image... this usually takes 10-30 seconds.
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
          ) : null;
        })()}
        </div>
      </div>
      )}
    </div>
  );

  if(false){ // Here to remove warning
      console.log(resultSuggestions, realSuggestions, handleBack, showImagePopup, lastHistoryId);
  }
};

export default EditorPage;
