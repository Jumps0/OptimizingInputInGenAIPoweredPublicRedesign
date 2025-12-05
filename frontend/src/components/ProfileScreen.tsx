import { useState } from "react";
import { Settings, Share2, Camera, Grid, User, ChevronLeft, Trophy, Heart, TrendingUp, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface UserProject {
  id: string;
  beforeImage: string;
  afterImage: string;
  timestamp: Date;
  aiChanges: string;
  location?: string;
  isShared: boolean;
}

interface ProfileScreenProps {
  onBack: () => void;
  onNewCapture: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userProjects: UserProject[];
  onShareToFeed: (projectId: string) => void;
  onNavigateToFeed: () => void;
}

export function ProfileScreen({ onBack, onNewCapture, activeTab, setActiveTab, userProjects, onShareToFeed, onNavigateToFeed }: ProfileScreenProps) {
  // Helper function to format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        {/* Profile info section */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h1>Profile</h1>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
              <span className="text-2xl">JD</span>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <h2 className="mb-1">Jane Designer</h2>
              <p className="text-sm text-gray-600 mb-3">Urban redesign enthusiast</p>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xl">{userProjects.length}</p>
                  <p className="text-xs text-gray-600">Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-xl">{userProjects.filter(p => p.isShared).length}</p>
                  <p className="text-xs text-gray-600">Shared</p>
                </div>
                <div className="text-center">
                  <p className="text-xl">{userProjects.length - userProjects.filter(p => p.isShared).length}</p>
                  <p className="text-xs text-gray-600">Private</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Achievements badges */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 whitespace-nowrap">
            <Trophy className="h-3 w-3 mr-1" />
            Top Creator
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 whitespace-nowrap">
            <TrendingUp className="h-3 w-3 mr-1" />
            5+ Projects
          </Badge>
          <Badge variant="secondary" className="bg-pink-100 text-pink-800 border-pink-300 whitespace-nowrap">
            <Heart className="h-3 w-3 mr-1" />
            Community Fave
          </Badge>
        </div>
      </div>

      {/* Projects section */}
      <div className="flex-1 overflow-auto bg-white">
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100 h-auto p-1 mx-4 my-3 rounded-lg">
            <TabsTrigger value="grid" className="rounded-md">
              <Grid className="h-4 w-4 mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-md">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Before & After
            </TabsTrigger>
          </TabsList>

          {/* Grid view */}
          <TabsContent value="grid" className="px-4 pb-20 mt-0">
            {userProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-gray-600 mb-2">No Projects Yet</h3>
                <p className="text-sm text-gray-500 mb-6">Start creating urban redesigns to see them here</p>
                <Button onClick={onNewCapture} className="bg-purple-600 hover:bg-purple-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {userProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="bg-white rounded-xl overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigateToFeed()}
                  >
                    {/* Split before/after preview */}
                    <div className="relative aspect-square">
                      <div className="absolute inset-0 grid grid-cols-2">
                        <div className="relative overflow-hidden">
                          <ImageWithFallback
                            src={project.beforeImage}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px]">
                            Before
                          </div>
                        </div>
                        <div className="relative overflow-hidden">
                          <ImageWithFallback
                            src={project.afterImage}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 right-1.5 bg-purple-600 text-white px-2 py-0.5 rounded text-[10px]">
                            After
                          </div>
                        </div>
                      </div>
                      {project.isShared && (
                        <div className="absolute bottom-1.5 right-1.5 bg-green-500 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Upload className="h-2.5 w-2.5" />
                          Shared
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      <p className="text-xs mb-1 truncate">{project.location || "Urban Space"}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTimestamp(project.timestamp)}</span>
                        {!project.isShared && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-0 px-1 text-[10px] text-purple-600 hover:text-purple-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareToFeed(project.id);
                            }}
                          >
                            Share
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* List view with larger before/after */}
          <TabsContent value="list" className="px-4 pb-20 mt-0">
            {userProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Camera className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-gray-600 mb-2">No Projects Yet</h3>
                <p className="text-sm text-gray-500 mb-6">Start creating urban redesigns to see them here</p>
                <Button onClick={onNewCapture} className="bg-purple-600 hover:bg-purple-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {userProjects.map((project) => (
                  <div 
                    key={project.id} 
                    className="bg-white rounded-xl overflow-hidden border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigateToFeed()}
                  >
                    {/* Before image */}
                    <div className="relative aspect-video">
                      <ImageWithFallback
                        src={project.beforeImage}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        Before
                      </div>
                    </div>

                    {/* After image */}
                    <div className="relative aspect-video border-t-2 border-purple-200">
                      <ImageWithFallback
                        src={project.afterImage}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                        After AI
                      </div>
                      {project.isShared && (
                        <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          Shared
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="mb-1">{project.location || "Urban Space"}</p>
                          <p className="text-sm text-gray-600">{formatTimestamp(project.timestamp)}</p>
                        </div>
                        {!project.isShared ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShareToFeed(project.id);
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share to Feed
                          </Button>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 border-green-300">
                            <Upload className="h-3 w-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-2 bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-purple-900">
                          <strong>AI Changes:</strong> {project.aiChanges}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom tab bar */}
      <div className="bg-white border-t px-6 py-3 flex items-center justify-around">
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

      {/* Floating action button */}
      <Button
        onClick={onNewCapture}
        size="icon"
        className="absolute bottom-24 right-6 h-14 w-14 rounded-full bg-teal-500 hover:bg-teal-600 shadow-lg z-50"
      >
        <Camera className="h-6 w-6" />
      </Button>
    </div>
  );
}
