import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X, SwitchCamera } from 'lucide-react';

interface ImageCaptureProps {
  onImageSelect: (file: File, previewUrl: string) => void;
}

const ImageCapture = ({ onImageSelect }: ImageCaptureProps) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle File Drop / Selection
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onImageSelect(file, objectUrl);
      setError('');
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  // Camera Functions
  const startCamera = async () => {
    // Stop existing stream if any
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    // Only restart if camera is already open and facingMode changed
    if (isCameraOpen) {
        startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isCameraOpen, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob/file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            const objectUrl = URL.createObjectURL(blob);
            setPreview(objectUrl);
            onImageSelect(file, objectUrl);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const resetImage = () => {
    setPreview(null);
    setError('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Preview Mode */}
      {preview ? (
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto max-h-[500px] object-contain mx-auto"
          />
          <button
            onClick={resetImage}
            className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-md hover:bg-white text-gray-700 transition-colors"
            title="Remove image"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-md text-xs font-medium text-gray-600">
            Ready for editing
          </div>
        </div>
      ) : isCameraOpen ? (
        /* Camera Mode */
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex flex-col items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          <div className="absolute top-4 right-4 z-10">
             <button 
                onClick={switchCamera}
                className="p-2 rounded-full bg-gray-800/60 text-white hover:bg-gray-700/80 transition-colors backdrop-blur-sm"
                title="Switch Camera"
             >
                <SwitchCamera size={20} />
             </button>
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center space-x-8 z-10">
            <button 
              onClick={stopCamera}
              className="p-3 rounded-full bg-gray-800/80 text-white hover:bg-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capturePhoto}
              className="p-4 rounded-full bg-white border-4 border-gray-300 shadow-lg hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-red-500" />
            </button>
          </div>
        </div>
      ) : (
        /* Upload / Selection Mode */
        <div className="grid gap-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-200 hover:bg-emerald-50/30'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                <Upload size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? "Drop the image here" : "Click or drag image to upload"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports JPG, PNG, WEBP
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          <button
            onClick={() => {
                setFacingMode('environment'); // Prefer back camera initially for "Take a Photo"
                setIsCameraOpen(true); // Open camera state first
                // startCamera will be called by the effect when isCameraOpen becomes true or facingMode changes
                // But we need to ensure startCamera is called.
                // Actually, let's just call startCamera directly here to be safe and simple
                startCamera(); 
            }}
            className="w-full flex items-center justify-center space-x-2 py-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-700 font-medium"
          >
            <Camera size={24} />
            <span>Take a Photo</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageCapture;