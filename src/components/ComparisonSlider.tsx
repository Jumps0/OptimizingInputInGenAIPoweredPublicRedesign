"use client";

import ReactCompareImage from "react-compare-image";

interface ComparisonSliderProps {
  originalImage: string;
  editedImage: string;
}

const ComparisonSlider = ({
  originalImage,
  editedImage,
}: ComparisonSliderProps) => {
  if (!originalImage || !editedImage) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
        <p>Image not available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full max-w-full max-h-[80vh] overflow-hidden rounded-lg shadow-lg relative">
        <ReactCompareImage
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