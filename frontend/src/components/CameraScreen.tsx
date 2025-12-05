import { Camera, Grid, User } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

interface CameraScreenProps {
  onCapture: (image: string) => void;
  onNavigateToFeed?: () => void;
  onNavigateToProfile?: () => void;
}

export function CameraScreen({ onCapture, onNavigateToFeed, onNavigateToProfile }: CameraScreenProps) {
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);
  const handleCapture = () => {
    // Hide text immediately when capturing
    setShowText(false);
    // Simulate capturing a photo - using the "before" urban park image
    const sampleImage = "https://images.unsplash.com/photo-1604883555768-e39e7efae702?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjBvcmlnaW5hbHxlbnwxfHx8fDE3NjIyNzQxMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
    onCapture(sampleImage);
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Viewfinder with urban background blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-sm"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`
        }}
      />
      
      {/* Camera viewfinder overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Top bar */}
        <div className="flex justify-between items-start p-4 z-10">
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
          {showText && (
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
        <div className="pb-12 px-8 z-10">
          <div className="flex justify-center">
            <Button
              onClick={handleCapture}
              size="icon"
              className="h-20 w-20 rounded-full bg-white border-4 border-white/30 hover:bg-white/90 shadow-xl animate-pulse"
            >
              <Camera className="h-8 w-8 text-black" />
            </Button>
          </div>
        </div>
      </div>

      {/* Viewfinder grid overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full grid grid-cols-3 grid-rows-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}