import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, SwitchCamera, Zap } from "lucide-react";

interface ImageCaptureProps {
  onImageSelect: (file: File, previewUrl: string) => void;
}

const baseVideoConstraints: Omit<MediaTrackConstraints, "facingMode"> = {
  width: { ideal: 1920, max: 3840 },
  height: { ideal: 1080, max: 2160 },
};

const ImageCapture = ({ onImageSelect }: ImageCaptureProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
      return;
    }

    let cancelled = false;

    const open = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { ...baseVideoConstraints, facingMode },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        setStream(mediaStream);
        setError("");
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access camera. Please check permissions.");
        setIsCameraOpen(false);
      }
    };

    open();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isCameraOpen, facingMode]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      el.play().catch((e) => console.error("Error playing video:", e));
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onImageSelect(file, objectUrl);
        setError("");
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  });

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const stopCamera = () => {
    setError("");
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera is still starting — try again in a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    if (facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        const objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
        onImageSelect(file, objectUrl);
        setIsCameraOpen(false);
      },
      "image/jpeg",
      0.95
    );
  };

  const resetImage = () => {
    setPreview(null);
    setError("");
  };

  const openCamera = () => {
    setError("");
    setFacingMode("environment");
    setIsCameraOpen(true);
  };

  const cameraOverlay =
    isCameraOpen && !preview ? (
      <div
        className="fixed inset-0 z-[200] flex flex-col bg-black touch-manipulation"
        role="dialog"
        aria-modal="true"
        aria-label="Camera"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
          paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        }}
      >
        {error ? (
          <div className="mb-3 shrink-0 rounded-xl border border-red-400/40 bg-red-950/90 px-4 py-2.5 text-center text-sm text-red-50">
            {error}
          </div>
        ) : null}
        <div className="flex shrink-0 items-center justify-between gap-3 px-1 pb-3">
          <button
            type="button"
            onClick={stopCamera}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            aria-label="Close camera"
          >
            <X size={22} strokeWidth={2} />
          </button>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Live view</span>
            <span className="text-sm font-medium text-white/90">Frame your space</span>
          </div>
          <button
            type="button"
            onClick={switchCamera}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            aria-label="Switch camera"
          >
            <SwitchCamera size={22} strokeWidth={2} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl ring-1 ring-white/15">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />

          <div className="pointer-events-none absolute inset-6 rounded-xl border border-white/25 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] sm:inset-10" />

          <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 sm:block">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          </div>
          <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 sm:block">
            <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 rounded-full bg-black/35 px-4 py-2 text-center backdrop-blur-md sm:bottom-6">
            <Zap className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            <p className="text-xs leading-snug text-white/85 sm:text-sm">
              Hold steady — tap the shutter for a crisp capture. Use the corner button to flip cameras.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-4 pt-6">
          <div className="grid w-full max-w-md grid-cols-[3.5rem_1fr_3.5rem] items-center gap-2">
            <button
              type="button"
              onClick={stopCamera}
              className="flex h-14 w-14 items-center justify-center justify-self-start rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/15 active:scale-95"
              aria-label="Cancel"
            >
              <X size={26} />
            </button>

            <button
              type="button"
              onClick={capturePhoto}
              className="group relative mx-auto flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border-[3px] border-white/90 bg-white/10 p-1 shadow-[0_0_0_6px_rgba(255,255,255,0.08)] transition active:scale-95 sm:h-[5rem] sm:w-[5rem]"
              aria-label="Take photo"
            >
              <span className="h-full w-full rounded-full bg-gradient-to-br from-white via-white to-gray-200 shadow-inner ring-2 ring-black/10 transition group-active:scale-95" />
            </button>

            <div className="flex justify-end justify-self-end">
              <button
                type="button"
                onClick={switchCamera}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/15 active:scale-95 sm:hidden"
                aria-label="Switch camera"
              >
                <SwitchCamera size={26} />
              </button>
            </div>
          </div>
          <p className="text-center text-[11px] text-white/45">JPG • Up to 10MB when uploading from files</p>
        </div>
      </div>
    ) : null;

  return (
    <div className="w-full max-w-2xl mx-auto p-0 sm:p-4">
      {error && !isCameraOpen && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}

      {preview ? (
        <div className="relative min-h-[50dvh] overflow-hidden rounded-2xl border border-gray-200/80 bg-gray-100 shadow-lg sm:min-h-0 sm:max-h-[min(70dvh,560px)]">
          <img src={preview} alt="Selected photo preview" className="h-full w-full max-h-[min(85dvh,640px)] object-contain sm:max-h-[min(70dvh,560px)]" />
          <button
            type="button"
            onClick={resetImage}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:bg-black/70"
            title="Remove image"
            aria-label="Remove image"
          >
            <X size={22} />
          </button>
          <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            Ready to edit
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <button
            type="button"
            onClick={openCamera}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 py-6 text-lg font-semibold text-white shadow-xl shadow-emerald-900/20 transition hover:brightness-105 active:scale-[0.99] sm:py-7 sm:text-xl"
          >
            <Camera size={28} className="shrink-0 opacity-95" strokeWidth={2} />
            <span>Take a photo</span>
          </button>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-8 ${
              isDragActive
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-300/80 hover:bg-emerald-50/40"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2 text-gray-600 sm:flex-row sm:gap-3">
              <Upload size={18} className="text-emerald-600" />
              <span className="text-sm font-medium">
                {isDragActive ? "Drop image to upload" : "Or upload — tap, click, or drag an image"}
              </span>
            </div>
          </div>
        </div>
      )}

      {typeof document !== "undefined" && cameraOverlay ? createPortal(cameraOverlay, document.body) : null}
    </div>
  );
};

export default ImageCapture;
