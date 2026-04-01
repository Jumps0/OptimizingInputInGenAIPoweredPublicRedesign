import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ImageCapture from "@/components/ImageCapture";
import { useAuth } from "@/context";
import { saveNewGeneration, addResultFeedback } from "@/utils";
import { TextTool, VoiceTool, InpaintingTool, DragDropTool } from "@/components/Editor/Tools";
import type { LineType } from "@/components/Editor/InpaintingEditor";
import type { DroppedElement } from "@/components/Editor/DragDropEditor";
import {  Sparkles, RotateCcw, /*Check, MessageSquareText, X*/ } from "lucide-react";
import ComparisonSlider from "@/components/ComparisonSlider";
import { METHODS } from "@/utils/constants";
import { /*applySepiaFilter, */applyInpaintingFilter, applyDragDropMask/*,applyDragDropFilter*/ } from "@/utils/imageUtils";

// import SuggestionGallery from "@/components/SuggestionGallery";
import {
  type SuggestionItem,
  getRandomSuggestions,
  getRandomInitialSuggestions,
} from "@/utils/suggestionImages";


type EditorStep = "upload" | "editor" | "result";
type ToolType = "text" | "voice" | "inpainting" | "dragdrop";

const EditorPage = () => {
  const { user } = useAuth();
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
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [inpaintingLines, setInpaintingLines] = useState<LineType[]>([]);
  const [placedElements, setPlacedElements] = useState<DroppedElement[]>([]);
  /** Increments on refine; resets on new upload or restart. Shown as “Round N” above the comparison. */
  const [sessionRound, setSessionRound] = useState(1);
  const [resultSuggestions, setResultSuggestions] = useState<SuggestionItem[]>([]);
  const [realSuggestions, setRealSuggestions] = useState<SuggestionItem[]>([]);
  const [lastHistoryId, setLastHistoryId] = useState<number | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackThanks, setFeedbackThanks] = useState(false);

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


  const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to load image for upload: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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

    // Image2Image takes ~11. Inpainting takes more than 20.
    const maxAttempts = 60;
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
    setStep("editor");
  };

  const handleBack = () => {
    if (step === "result") {
      setStep("editor");
      setResultImage(null);
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
      setResultSuggestions([]);
      setRealSuggestions([]);
      setLastHistoryId(null);
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackThanks(false);
    }
  };

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
  
  // Basic debug function to show a specific image in a popup
  const showImagePopup = (image: HTMLImageElement) => {
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
    
    // Clone and display image
    const img = image.cloneNode() as HTMLImageElement;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.objectFit = 'contain';
    
    popup.appendChild(img);
    document.body.appendChild(popup);
    
    // Remove after 5 seconds
    setTimeout(() => {
      popup.remove();
    }, 5000);
  }

  const handleGenerate = async () => {
    console.log("Starting process...");
    setIsGenerating(true);

    // Initialize Pyodide and load the script
    const callImageGeneration = async (inputPrompt: string, previewUrl: string, _inpaintingLines: any[], _placedElements: any[]): Promise<string | null> => {
      console.log("...and running generation logic...");

      //return await applySepiaFilter(previewUrl); // TEMP
      try {
        const encodedImage = await fetchImageAsBase64(previewUrl);

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

          console.log('Generation successful.');
          return outputUrl;
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

          console.log('Generation successful.');
          return outputUrl;
        }
        else if(activeTool === "inpainting"){
          console.log("...to perform inpainting. Prompt:", inputPrompt);
          // This requires a bit more work, we need:
          // - inputPrompt (string)
          // - baseImage (the image to modify)
          // - inpaintingLines (array of {x1, y1, x2, y2} objects representing the lines drawn by the user). Gonna need to parse this into a black & white image
          
          // Convert the lines to an actual mask. Remember: BLACK = NO CHANGE | WHITE = CHANGE
          const mask = await applyInpaintingFilter(previewUrl, inpaintingLines);

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

          console.log('Generation successful.');
          return outputUrl;
        }
        else if(activeTool === "dragdrop"){
          console.log("...to perform drag & drop.");
          // The most complex (and annoying one). Uses inpainting in phases.
          if (_placedElements.length === 0) {
            console.warn('No placed elements for dragdrop generation');
            return null;
          }

          let currentImageUrl = previewUrl;
          let currentEncodedImage = encodedImage;
          let outputUrl: string | null = null;

          for (let i = 0; i < _placedElements.length; i += 1) {
            const element = _placedElements[i];
            console.log(`Processing sticker ${i + 1}/${_placedElements.length}:`, element);

            const mask = await applyDragDropMask(currentImageUrl, [element]);
            const inpaintResult = await bflInpainting(inputPrompt, currentEncodedImage, mask);

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

            console.log(`Sticker ${i + 1} applied.`);
            currentImageUrl = outputUrl;
            currentEncodedImage = await fetchImageAsBase64(currentImageUrl);
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

    const handleProcess = async (): Promise<void> => {
      try {
        if (previewUrl) {
          // Loading screen appears here

          let hid: number | null = null;

          /*
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
            const saved = await saveNewGeneration(user.id, prompt, previewUrl, filteredImage);
            hid = saved.id;
          }
          */
          
          // Call the function
          const result = await callImageGeneration(prompt, previewUrl, inpaintingLines, placedElements);

          // Set the result image
          setResultImage(result);

          if (result && user) {
            const saved = await saveNewGeneration(user.id, prompt, previewUrl, result);
            hid = saved.id;
            console.log(`Generation saved with history ID: ${hid}`);
          }
            
          

          setLastHistoryId(hid);
          setResultSuggestions(getRandomSuggestions(4));
          setRealSuggestions(getRandomInitialSuggestions(4));

          setStep("result"); // After this step the new image is shown!

        }
      } catch (error) {
        console.error("Failed to generate image:", error);

        if (previewUrl) {
          setResultImage(previewUrl);

          let hid: number | null = null;
          if (user) {
            const saved = await saveNewGeneration(user.id, prompt, previewUrl, previewUrl);
            hid = saved.id;
          }
          setLastHistoryId(hid);
          setResultSuggestions(getRandomSuggestions(4));
          setRealSuggestions(getRandomInitialSuggestions(4));
          setStep("result");
        }
      } finally {
        setIsGenerating(false);
      }
    };

    handleProcess(); // Run it!
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

  //console.log(resultSuggestions, realSuggestions);

  const handleRefineResult = () => {
    if (resultImage) {
      setPreviewUrl(resultImage);
      setSessionRound((r) => r + 1);
      setStep("editor");
      setResultImage(null);
      setLastHistoryId(null);
      setFeedbackOpen(false);
      setFeedbackText("");
      setFeedbackThanks(false);
      setInpaintingLines([]);
      setPlacedElements([]);
      setResultSuggestions(getRandomSuggestions(4));
      setRealSuggestions(getRandomInitialSuggestions(4));
    }
  };

  
  const handleExitGallery = () => {
    setFeedbackOpen(false);
    setFeedbackText("");
    navigate("/gallery");
  };

  const handleRestart = () => {
    setSessionRound(1);
    setStep("editor");
    setResultImage(null);
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
          <span className="shrink-0 self-start sm:self-auto inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
            Output ready
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 sm:p-6 shadow-sm space-y-4">

        <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-gray-900">Image generation complete!</p>
            <p className="text-xs text-gray-600">
              You may now exit to the Gallery and see the photo(s) you have generated, restart with the same original photo, or go back to the editor to refine your image further. 
              {/* If you're not happy with the result, please give feedback so we can improve the system! */}
            </p>
          </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <button
            type="button"
            onClick={() => handleExitGallery()}
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gray-900 text-white font-semibold shadow-lg hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Exit to Gallery
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
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-emerald-600 text-white font-semibold shadow-md hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Sparkles size={18} />
            Refine This Result
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

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-4 ring-white">
          <ComparisonSlider
            originalImage={previewUrl}
            editedImage={resultImage}
          />
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
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Method
            </h4>

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
              <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-900 shadow-sm">
                {user?.assignedMethod ?? "text"}
              </span>
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

            <div className="mt-4 flex flex-wrap items-center gap-2 sm:hidden">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Method</span>
              <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-900">
                {activeTool}
              </span>
            </div>
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
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
      <div className="max-w-3xl mx-auto px-6 py-8 pb-32 min-h-full">
        {step === "result" ? renderResult() : renderEditor()}
      </div>
      </div>

      {/* Footer / Floating Action Bar - Fixed/Sticky */}
      {step !== "result" && (
      <div className="fixed left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-60 pointer-events-none bottom-[max(72px,env(safe-area-inset-bottom))] md:bottom-0">
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
      console.log(resultSuggestions, realSuggestions, handleBack, showImagePopup);
  }
};

export default EditorPage;
