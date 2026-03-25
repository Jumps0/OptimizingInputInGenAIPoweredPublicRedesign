import ReactCompareImage from 'react-compare-image';

interface ComparisonSliderProps {
  originalImage: string;
  editedImage: string;
}

const ComparisonSlider = ({ originalImage, editedImage }: ComparisonSliderProps) => {
  if (!originalImage || !editedImage) {
      return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
              <p>Image not available</p>
          </div>
      );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full overflow-hidden relative">
        <ReactCompareImage 
          leftImage={originalImage} 
          rightImage={editedImage}
          leftImageLabel="Before Design"
          rightImageLabel="After Design"
          sliderLineWidth={2}
          handleSize={40}
        />
      </div>
    </div>
  );
};

export default ComparisonSlider;
