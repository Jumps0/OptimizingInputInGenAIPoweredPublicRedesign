import { useState } from "react";
import { CameraScreen } from "./components/CameraScreen";
import { EditScreen } from "./components/EditScreen";
import { RefinementScreen } from "./components/RefinementScreen";
import { FeedScreen } from "./components/FeedScreen";
import "./styles/globals.css";

type Screen =
  | "camera"
  | "edit"
  | "refinement"
  | "feed"
  | "profile";

export interface UserProject {
  id: string;
  beforeImage: string;
  afterImage: string;
  timestamp: Date;
  aiChanges: string;
  location?: string;
  isShared: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] =
    useState<Screen>("camera");
  const [capturedImage, setCapturedImage] =
    useState<string>("");
  const [userProjects, setUserProjects] = useState<
    UserProject[]
  >([]);
  const [initialUserInput, setInitialUserInput] =
    useState<string>("");
  const [inputMethod, setInputMethod] = useState<string>("");

  const handleCapture = (image: string) => {
    setCapturedImage(image);
    setCurrentScreen("edit");
  };

  const handleGenerationComplete = (
    userInput: string,
    method: string,
  ) => {
    setInitialUserInput(userInput);
    setInputMethod(method);
    setCurrentScreen("refinement");
  };

  const handleRefinementComplete = (
    afterImage: string,
    aiChanges: string,
    location?: string,
  ) => {
    // Save to user projects
    const newProject: UserProject = {
      id: Date.now().toString(),
      beforeImage: capturedImage,
      afterImage,
      timestamp: new Date(),
      aiChanges,
      location,
      isShared: false,
    };
    setUserProjects((prev) => [newProject, ...prev]);
    setCurrentScreen("profile");
  };

  const handleBackToEdit = () => {
    setCurrentScreen("edit");
  };

  const handleShareToFeed = (projectId: string) => {
    setUserProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, isShared: true } : p,
      ),
    );
  };

  const handleBackToCamera = () => {
    setCurrentScreen("camera");
  };

  const handleNewCapture = () => {
    setCurrentScreen("camera");
  };

  const handleNavigateToFeed = () => {
    setCurrentScreen("feed");
  };

  const handleNavigateToProfile = () => {
    setCurrentScreen("profile");
  };

  return (
    <div className="h-screen max-w-md mx-auto bg-white shadow-2xl overflow-hidden">
      {currentScreen === "camera" && (
        <CameraScreen
          onCapture={handleCapture}
          onNavigateToFeed={handleNavigateToFeed}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}
      {currentScreen === "edit" && (
        <EditScreen
          originalImage={capturedImage}
          onBack={handleBackToCamera}
          onComplete={handleRefinementComplete}
          onGenerationComplete={handleGenerationComplete}
          onNavigateToFeed={handleNavigateToFeed}
          onNavigateToProfile={handleNavigateToProfile}
        />
      )}
      {currentScreen === "refinement" && (
        <RefinementScreen
          originalImage={capturedImage}
          initialUserInput={initialUserInput}
          inputMethod={inputMethod}
          onBack={handleBackToEdit}
          onComplete={handleRefinementComplete}
        />
      )}
      {currentScreen === "feed" && (
        <FeedScreen
          onNewCapture={handleNewCapture}
          onNavigateToProfile={handleNavigateToProfile}
          userProjects={userProjects}
          onShareToFeed={handleShareToFeed}
        />
      )}
      {currentScreen === "profile" && (
        <FeedScreen
          onNewCapture={handleNewCapture}
          onNavigateToProfile={handleNavigateToProfile}
          userProjects={userProjects}
          onShareToFeed={handleShareToFeed}
          initialTab="profile"
        />
      )}
    </div>
  );
}