import { Camera, Grid, User } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect,useRef  } from "react";

interface CameraScreenProps {
  onCapture: (image: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToProfile?: () => void;
  
}

export function CameraScreen({ onCapture, onNavigateToFeed, onNavigateToProfile }: CameraScreenProps) {
  const [showText, setShowText] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);
  
   const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // Separate effect to handle video when camera turns on
  useEffect(() => {
    if (isCameraOn && videoRef.current && videoRef.current.srcObject) {
      const playVideo = () => {
        videoRef.current?.play().catch(err => {
          console.error("Video play error:", err);
        });
      };
      
      playVideo();
      
      // Try again after a short delay
      setTimeout(playVideo, 100);
      setTimeout(playVideo, 500);
    }
  }, [isCameraOn]);
  
  const startCamera = async () => {
    try {

      // Stop any existing camera first
      stopCamera();
      
      console.log("Starting camera...");
      
       // Check if we're on HTTPS/localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isSecure = window.location.protocol === 'https:';
    
    if (!isLocalhost && !isSecure) {
      alert("Camera requires HTTPS or localhost. Current URL: " + window.location.href);
      return;
    }
    
    // First check permissions
    const permissionStatus = await navigator.permissions.query({ name: 'camera' as any });
    console.log("Camera permission state:", permissionStatus.state);
    
    if (permissionStatus.state === 'denied') {
      alert("Camera permission is denied. Please enable camera permissions in your browser settings.");
      return;
    }
    
     
      
      // Try different constraints
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { exact: "environment" } as any
        },
        audio: false
      };
      
      // First try back camera
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Got back camera");
      } catch (backError) {
        console.log("Back camera failed, trying any camera:", backError);
        // Fallback to any camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        console.log("Got fallback camera");
      }
      
      console.log("Stream obtained, tracks:", stream.getVideoTracks().length);
      
      if (videoRef.current) {
        // Clear any previous event listeners
        videoRef.current.onloadedmetadata = null;
        videoRef.current.oncanplay = null;
        videoRef.current.onerror = null;
        
        // Set up new event listeners
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current?.play().catch(err => {
            console.error("Autoplay failed in onloadedmetadata:", err);
          });
        };
        
        videoRef.current.oncanplay = () => {
          console.log("Video can play");
          videoRef.current?.play().catch(err => {
            console.error("Autoplay failed in oncanplay:", err);
          });
        };
        
        videoRef.current.onerror = (e) => {
          console.error("Video element error:", e);
        };
        
        // Set the stream
        videoRef.current.srcObject = stream;
        
        // Try to play immediately
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            console.log("Attempting to play video...");
            videoRef.current.play().catch(err => {
              console.error("Delayed play failed:", err);
            });
          }
        }, 50);
      }
      
      setIsCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Cannot access camera. Please allow camera permissions and use HTTPS/localhost.");
    }
  };
  
  const captureImage = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/png");
       // Stop camera after capturing
      stopCamera();
      
      onCapture(imageData);
    }
  };
  
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Video element - always render but conditionally show stream */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isCameraOn ? 'opacity-100 z-40' : 'opacity-0 z-0'
        }`}
        style={{ background: 'black' }}
        onError={(e) => console.error("Video error:", e)}
      />
      
      {/* Background image - only show when camera is OFF */}
      {!isCameraOn && (
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
          }}
        />
      )}
      
      {/* Overlay UI - always on top */}
      <div className="absolute inset-0 flex flex-col z-50">
        {/* Top bar */}
        <div className="flex justify-between items-start p-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
            onClick={onNavigateToFeed}
          >
            <Grid className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
            onClick={onNavigateToProfile}
          >
            <User className="h-5 w-5" />
          </Button>
        </div>

        {/* Center overlay text */}
        <div className="flex-1 flex items-center justify-center px-8">
          {showText && !isCameraOn && (
            <div className="bg-black/40 backdrop-blur-md rounded-2xl px-6 py-8 max-w-sm animate-in fade-in duration-500">
              <h2 className="text-white text-center mb-2">
                Reimagine Your City
              </h2>
              <p className="text-white/90 text-center">
                Capture a public space and transform it with AI. Your vision can inspire real change in your community.
              </p>
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="pb-12 px-8">
          <div className="flex justify-center">
            {!isCameraOn ? (
              <Button
                onClick={startCamera}
                size="icon"
                className="h-20 w-20 rounded-full bg-white border-4 border-white/30 hover:bg-white/90 shadow-xl"
              >
                <Camera className="h-8 w-8 text-black" />
              </Button>
            ) : (
              <Button
                onClick={captureImage}
                size="icon"
                className="h-20 w-20 rounded-full bg-white border-4 border-white/30 hover:bg-white/90 shadow-xl"
              >
                <Camera className="h-8 w-8 text-black" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Viewfinder grid overlay - only show when camera is ON */}
      {isCameraOn && (
        <div className="absolute inset-0 pointer-events-none z-45">
          <div className="h-full w-full grid grid-cols-3 grid-rows-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/10" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}