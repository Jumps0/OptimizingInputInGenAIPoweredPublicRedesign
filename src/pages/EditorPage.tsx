import { useState, useEffect, useRef } from "react";
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { useNavigate } from "react-router-dom";
import ImageCapture from "@/components/ImageCapture";
import { useAuth } from "@/context";
import { saveNewGeneration, addResultFeedback } from "@/utils";
import { TextTool, VoiceTool, InpaintingTool, DragDropTool } from "@/components/Editor/Tools";
import type { LineType } from "@/components/Editor/InpaintingEditor";
import type { DroppedElement } from "@/components/Editor/DragDropEditor";
import {  Sparkles, RotateCcw, /*Check, MessageSquareText, X*/ } from "lucide-react";
import ComparisonSlider from "@/components/ComparisonSlider";
import { applySepiaFilter, applyInpaintingFilter, applyDragDropFilter } from "@/utils/imageUtils";
import { METHODS } from "@/utils/constants";
// import SuggestionGallery from "@/components/SuggestionGallery";
import {
  type SuggestionItem,
  getRandomSuggestions,
  getRandomInitialSuggestions,
} from "@/utils/suggestionImages";

import runflux from '../runflux.py?raw'; // Python script for actual AI Image Editing

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

  const [loading, setLoading] = useState<boolean>(false);
  const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
  const pyodideRef = useRef<PyodideInterface | null>(null);

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

  console.log(handleBack);

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
  async function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
  }
  */

  /*
  ===== HOW TO AVOID 301 / 310 / 321 ERRORS ======
  1. All hooks must be put on the top lever, this is a hook --> const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
     This is also a hook --> useEffect(() => { ... }, []);
  */

  useEffect(() => {
    const initializePyodide = async () => {
      if(isPyodideReady) return; // Only call when needed

      console.log("⟳ Initializing Pyodide...");

      try {
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/" /* https://pyodide.org/en/stable/usage/quickstart.html */
        });
        
        await pyodide.loadPackage("micropip") // Install micropip first so we can actually use it
        pyodide.FS.writeFile('/home/pyodide/runflux.py', runflux);

        // Install required packages using micropip
        // Note: This must be done BEFORE importing them in the script
        await pyodide.runPythonAsync(`
          import micropip

          # Install packages - this downloads and installs them from PyPI
          # Pillow (PIL) and requests are available as pure Python wheels
          await micropip.install('pillow')
          await micropip.install('requests')

          print("✓ Packages installed successfully")
        `);
        
        // Now write and import runflux.py
        pyodide.FS.writeFile('runflux.py', runflux);
        
        await pyodide.runPythonAsync(`
          import runflux

          # Store reference to the function
          testprint = runflux.testprint
          print("✓ Function(s) loaded")
        `);

        pyodideRef.current = pyodide;
        setIsPyodideReady(true);
        console.log("✓ Pyrodide is ready");
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
      }
    };

    initializePyodide();
    }, []);

  const testFunc = async () => {
    console.log("Call");

    
    console.log(loading);


    const callPythonFunction = async (inputString: string): Promise<string | null> => {
      if (!pyodideRef.current) {
        console.error('Pyodide not ready');
        return null;
      }

      try {
        setLoading(true);
        const escapedInput = inputString.replace(/"/g, '\\"');

        const result = pyodideRef.current.runPython(`
          import runflux
          result = runflux.testprint("${escapedInput}")
          result
        `);
        
        console.log(`Input: "${inputString}" → Output: "${result}"`);
        return result;
      } catch (error) {
        console.error('Error calling Python function:', error);
        return null;
      } finally {
        setLoading(false);
      }
    };

    const handleProcessString = async (): Promise<void> => {
      const testString = "Hello, world ";
      const result = await callPythonFunction(testString);
      console.log('Final result:', result);
    };
    
    handleProcessString();
  };

  const handleGenerate = async () => {
    console.log("GENERATING IMAGE");
    setIsGenerating(true);
    testFunc();

    //const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
    //const pyodideRef = useRef<PyodideInterface | null>(null);
    //const [running, setRunning] = useState<boolean>(false);

    // Initialize Pyodide and load the script
    /*
    useEffect(() => {
    const initializePyodide = async () => {
      try {
        const pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/" // https://pyodide.org/en/stable/usage/quickstart.html
        });
        
        await pyodide.loadPackage("micropip") // Install micropip first so we can actually use it
        pyodide.FS.writeFile('/home/pyodide/runflux.py', runflux);

        // Install required packages using micropip
        // Note: This must be done BEFORE importing them in the script
        await pyodide.runPythonAsync(`
          import micropip

          # Install packages - this downloads and installs them from PyPI
          # Pillow (PIL) and requests are available as pure Python wheels
          await micropip.install('pillow')
          await micropip.install('requests')

          print("✓ Packages installed successfully")
        `);
        
        // Now write and import runflux.py
        pyodide.FS.writeFile('runflux.py', runflux);
        
        await pyodide.runPythonAsync(`
          import runflux

          # Store reference to the functions
          run_image_to_image = runflux.run_image_to_image
          run_inpainting = runflux.run_inpainting
          print("✓ Script loaded")
        `);

        pyodideRef.current = pyodide;
          //setIsPyodideReady(true);
        } catch (error) {
          console.error('Failed to initialize Pyodide:', error);
        }
      };

      initializePyodide();
    }, []);
    
    const callImageGeneration = async (): Promise<string | null> => {
      if (!pyodideRef.current) {
        console.error('Pyodide not ready');
        return null;
      }

      try {
        //setRunning(true);

        // ================== //
        //  DETERMINE INPUTS  //
        // ================== //

        if(activeTool === "text"){
          // Simple stuff, all we need is:
          // - prompt (string)
          // - previewUrl (string to the image)

          // This will called run_image_to_image

          // TODO

        }
        else if(activeTool === "voice"){
          // Same as text, voice should have been pre-processed into a text prompt, so we need:
          // - prompt (string)
          // - previewUrl (string to the image)

          // This will called run_image_to_image

          // TODO

        }
        else if(activeTool === "inpainting"){
          // This requires a bit more work, we need:
          // - prompt (string)
          // - previewUrl (string to the image)
          // - inpaintingLines (array of {x1, y1, x2, y2} objects representing the lines drawn by the user). Gonna need to parse this into a black & white image

          // This will call run_inpainting
          
          // Convert the lines to an actual mask. Remember: BLACK = NO CHANGE | WHITE = CHANGE

          // TODO

        }
        else if(activeTool === "dragdrop"){
          // The most complex (and annoying one). Uses inpainting in phases. This requires:
          // - prompt (string)
          // - previewUrl (string to the image)
          // - inpaintingLines (array of {x1, y1, x2, y2} objects representing the lines drawn by the user). Gonna need to parse this into a black & white image

          // This will call run_inpainting
          
          // Convert the lines to an actual mask. Remember: BLACK = NO CHANGE | WHITE = CHANGE

          // TODO
        }

        // this will be replaced/moved later
        const result = pyodideRef.current.runPython(`
          #import runflux
          result = None
          if True:
            result = runflux.run_inpainting()
          else:
            result = runflux.run_image_to_image()
          #result # Return (?)
        `);
        
        console.log(`Image generation finished.`);
        return result;
      } catch (error) {
        console.error('Error calling Python function:', error);
        return null;
      } finally {
        //setRunning(false);
      }
    };
    */
    const handleProcess = async (): Promise<void> => {
      try {
        if (previewUrl) {
          // Loading screen appears here

          let hid: number | null = null;

          if(true){ // OLD TEMP CODE. HERE TO NOT BREAK THINGS
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
          }
          else{ // NEW CODE. DISABLED FOR NOW
            /*
            // Call the function
            console.log("Calling image generation function...");
            const result = await callImageGeneration();

            // Set the result image
            setResultImage(result);

            if (result && user) {
              const saved = await saveNewGeneration(user.id, prompt, previewUrl, result);
              hid = saved.id;
              console.log(`Generation saved with history ID: ${hid}`);
            }
            */
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
            <p className="text-sm leading-relaxed text-gray-600 max-w-xl">
              Your source image is on the left; the redesign is on the right. Drag the slider to compare, then choose{" "}
              <span className="font-medium text-gray-800">Exit to Gallery</span> if you are satisfied,{" "}
              <span className="font-medium text-gray-800">Refine this Result</span> to continue editing, or{" "}
              <span className="font-medium text-gray-800">Restart</span> to start over again.
            </p>
          </div>
          <span className="shrink-0 self-start sm:self-auto inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
            Output ready
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden ring-4 ring-white">
          <ComparisonSlider
            originalImage={previewUrl}
            editedImage={resultImage}
          />
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
            {/*
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
            */}
          </div>

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
        <div className="absolute left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-60 pointer-events-none bottom-[72px] md:bottom-0">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <button
              onClick={handleGenerate}
              disabled={(() => {
                if (isGenerating) return true;

                // Each method has its own minimal input requirements.
                if (activeTool === "text") return !prompt.trim();
                if (activeTool === "voice") return !prompt.trim();

                if (activeTool === "inpainting") {
                  return inpaintingLines.length === 0 || !prompt.trim();
                }

                if (activeTool === "dragdrop") {
                  return placedElements.length === 0 || !prompt.trim();
                }

                return true;
              })()}
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
          </div>
        </div>
      )}
    </div>
  );

  if(false){ // Here to remove warning
      console.log(resultSuggestions, realSuggestions);
  }
};

export default EditorPage;
