import { useState, useRef, useEffect } from "react";
import { 
  Heart, MessageCircle, Share2, Camera, Grid, User, 
  ChevronLeft, ChevronRight, Search
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ProfileScreen } from "./ProfileScreen";

interface FeedItem {
  id: string;
  before: string;
  after: string;
  variants?: string[];
  likes: number;
  comments: number;
  author: string;
  isLiked: boolean;
  description: string;
  location: string;
}

interface UserProject {
  id: string;
  beforeImage: string;
  afterImage: string;
  timestamp: Date;
  aiChanges: string;
  location?: string;
  isShared: boolean;
}

interface FeedScreenProps {
  onNewCapture: () => void;
  onNavigateToProfile: () => void;
  userProjects: UserProject[];
  onShareToFeed: (projectId: string) => void;
  initialTab?: ActiveTab;
}

type ActiveTab = "capture" | "feed" | "profile";

export function FeedScreen({ onNewCapture, onNavigateToProfile, userProjects, onShareToFeed, initialTab = "feed" }: FeedScreenProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [items, setItems] = useState<FeedItem[]>([
    {
      id: "1",
      before: "https://images.unsplash.com/photo-1555144673-5d79dc022e15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHB1YmxpYyUyMHNwYWNlJTIwcGFya3xlbnwxfHx8fDE3NjIyNDkxODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      after: "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjByZWRlc2lnbnxlbnwxfHx8fDE3NjIyNDkxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      variants: [
        "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjByZWRlc2lnbnxlbnwxfHx8fDE3NjIyNDkxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1761303349910-8b5784888d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MjI0OTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ],
      likes: 324,
      comments: 45,
      author: "Sarah M.",
      isLiked: false,
      description: "Added more trees, benches, and a central fountain for community gathering",
      location: "Downtown Plaza",
    },
    {
      id: "2",
      before: "https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      after: "https://images.unsplash.com/photo-1761303349910-8b5784888d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MjI0OTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      variants: [
        "https://images.unsplash.com/photo-1761303349910-8b5784888d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MjI0OTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjByZWRlc2lnbnxlbnwxfHx8fDE3NjIyNDkxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ],
      likes: 189,
      comments: 28,
      author: "Mike L.",
      isLiked: true,
      description: "Transformed narrow sidewalk into vibrant pedestrian plaza with water features",
      location: "Main Street",
    },
    {
      id: "3",
      before: "https://images.unsplash.com/photo-1761303349910-8b5784888d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MjI0OTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      after: "https://images.unsplash.com/photo-1555144673-5d79dc022e15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHB1YmxpYyUyMHNwYWNlJTIwcGFya3xlbnwxfHx8fDE3NjIyNDkxODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      variants: [
        "https://images.unsplash.com/photo-1555144673-5d79dc022e15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHB1YmxpYyUyMHNwYWNlJTIwcGFya3xlbnwxfHx8fDE3NjIyNDkxODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjByZWRlc2lnbnxlbnwxfHx8fDE3NjIyNDkxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ],
      likes: 456,
      comments: 62,
      author: "Alex K.",
      isLiked: false,
      description: "Converted concrete plaza into lush green park with modern amenities",
      location: "City Center",
    },
    {
      id: "4",
      before: "https://images.unsplash.com/photo-1714392525681-de9a49627a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHBhcmslMjByZWRlc2lnbnxlbnwxfHx8fDE3NjIyNDkxODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      after: "https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      variants: [
        "https://images.unsplash.com/photo-1600206085398-f6ede93b06f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwc3RyZWV0JTIwYmVuY2h8ZW58MXx8fHwxNzYyMjQ5MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        "https://images.unsplash.com/photo-1761303349910-8b5784888d58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwdWJsaWMlMjBwbGF6YSUyMGZvdW50YWlufGVufDF8fHx8MTc2MjI0OTE4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      ],
      likes: 267,
      comments: 34,
      author: "Emma W.",
      isLiked: false,
      description: "Added sustainable bike lanes and green infrastructure for urban cooling",
      location: "Riverside Ave",
    },
  ]);

  const handleLike = (id: string) => {
    setItems(items.map(item => 
      item.id === id 
        ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? item.likes - 1 : item.likes + 1 }
        : item
    ));
  };

  // Handle navigation to capture screen in an effect to avoid setState during render
  useEffect(() => {
    if (activeTab === "capture") {
      onNewCapture();
    }
  }, [activeTab, onNewCapture]);

  if (activeTab === "profile") {
    return (
      <ProfileScreen 
        onBack={() => setActiveTab("feed")}
        onNewCapture={onNewCapture}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProjects={userProjects}
        onShareToFeed={onShareToFeed}
        onNavigateToFeed={() => setActiveTab("feed")}
      />
    );
  }

  if (activeTab === "capture") {
    return null;
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Feed content */}
      <div className="flex-1 overflow-hidden">
        <CommunityFeedView items={items} onLike={handleLike} onNewCapture={onNewCapture} />
      </div>

      {/* Bottom tab bar */}
      <div className="bg-white border-t px-4 py-3 flex items-center justify-around">
        <button
          onClick={() => setActiveTab("capture")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "capture" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs">Studio</span>
        </button>
        <button
          onClick={() => setActiveTab("feed")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "feed" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <Grid className="h-6 w-6" />
          <span className="text-xs">Feed</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            activeTab === "profile" ? "text-purple-600" : "text-gray-400"
          }`}
        >
          <User className="h-6 w-6" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}

// Community Feed View Component (TikTok-style with Search)
function CommunityFeedView({ items, onLike, onNewCapture }: { items: FeedItem[], onLike: (id: string) => void, onNewCapture: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredItems = items.filter(item =>
    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentItem = filteredItems[currentIndex] || items[0];

  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentIndex < filteredItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSliderPosition(50);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSliderPosition(50);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, x)));
  };

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-hidden relative bg-black"
      onWheel={handleScroll}
    >
      {/* Header with Search */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <Grid className="h-5 w-5" />
            <h1>Community Feed</h1>
          </div>
          <div className="flex-1" />
          <Button
            onClick={onNewCapture}
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white"
          >
            <Camera className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search bar */}
        {isSearchOpen && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by location, author, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/90 backdrop-blur-sm"
              />
            </div>
            {searchQuery && (
              <p className="text-white/80 text-xs mt-2">
                {filteredItems.length} {filteredItems.length === 1 ? 'project' : 'projects'} found
              </p>
            )}
          </div>
        )}
      </div>

      {/* Main image comparison */}
      <div 
        className="absolute inset-0"
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={handleSliderMove}
        onTouchMove={handleTouchMove}
      >
        {/* Before image */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src={currentItem.before}
            alt="Before"
            className="w-full h-full object-cover"
          />
        </div>

        {/* After image with clip-path */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <ImageWithFallback
            src={currentItem.after}
            alt="After"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Slider handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-xl">
            <div className="flex gap-1">
              <ChevronLeft className="h-4 w-4 text-gray-700" />
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Before/After labels */}
        <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
          Before
        </div>
        <div className="absolute top-20 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
          After
        </div>
      </div>

      {/* Right side controls */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
        <button
          onClick={() => onLike(currentItem.id)}
          className="flex flex-col items-center gap-1"
        >
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
            <Heart className={`h-7 w-7 ${currentItem.isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
          </div>
          <span className="text-white text-sm">{currentItem.likes}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
            <MessageCircle className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-sm">{currentItem.comments}</span>
        </button>

        <button className="flex flex-col items-center gap-1">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <span className="text-white text-sm">Share</span>
        </button>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 pb-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white">{currentItem.author[0]}</span>
          </div>
          <div className="flex-1">
            <p className="text-white">{currentItem.author}</p>
            <p className="text-white/80 text-sm">{currentItem.location}</p>
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          {currentItem.description}
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {filteredItems.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 w-2 rounded-full transition-all ${
              idx === currentIndex ? "bg-white h-8" : "bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
          <Search className="h-16 w-16 text-white/40 mb-4" />
          <h3 className="text-white mb-2">No projects found</h3>
          <p className="text-sm text-white/60 text-center px-8">
            Try adjusting your search to find what you're looking for
          </p>
        </div>
      )}
    </div>
  );
}
