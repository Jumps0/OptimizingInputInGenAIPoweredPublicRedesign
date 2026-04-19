"use client";

import { useEffect, useState } from "react";

interface ComparisonSliderProps {
  originalImage: string;
  editedImage: string;
}

const ComparisonSlider = ({
  originalImage,
  editedImage,
}: ComparisonSliderProps) => {
  const [CompareImage, setCompareImage] = useState<
    React.ComponentType<{
      leftImage: string;
      rightImage: string;
      leftImageLabel?: string;
      rightImageLabel?: string;
      sliderLineWidth?: number;
      handleSize?: number;
    }>
    | null
  >(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!(window as any).TouchEvent) {
      (window as any).TouchEvent = class TouchEvent extends Event {};
    }

    import("react-compare-image")
      .then((module) => {
        const Imported = (module as any).default ?? module;
        setCompareImage(() => Imported ?? null);
      })
      .catch(() => {
        setCompareImage(null);
      });
  }, []);

  if (!originalImage || !editedImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <p>Image not available</p>
      </div>
    );
  }

  if (!CompareImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <p>Loading image…</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-full max-h-[80vh] overflow-hidden rounded-lg shadow-lg relative">
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md bg-black/40 px-3 py-1.5 text-center text-medium font-medium text-white shadow-sm sm:text-sm">
          Tap or drag over the image to move the slider
        </div>
        <CompareImage
          leftImage={originalImage}
          rightImage={editedImage}
          leftImageLabel="Before"
          rightImageLabel="After"
          sliderLineWidth={3}
          handleSize={44}
        />
      </div>
    </div>
  );
};

export default ComparisonSlider;