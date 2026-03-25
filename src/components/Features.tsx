import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Wand2, Sparkles, Layers, Zap } from 'lucide-react';
import ComparisonSlider from './ComparisonSlider';

// Import images
import original1 from '@/assets/images/original1.webp';
import edited1 from '@/assets/images/edited1_v2.jpg';
import original2 from '@/assets/images/original2.jpg';
import edited2 from '@/assets/images/edited2_v2.jpg';
import original3 from '@/assets/images/original3.webp';
import edited3 from '@/assets/images/edited3_v2.jpg';
import original4 from '@/assets/images/original4.jpg';
import edited4 from '@/assets/images/edited4_v2.jpg';

const FEATURES_DATA = [
  {
    id: 1,
    title: "AI-Powered Enhancement",
    description: "Instantly improve lighting, color, and details with our advanced AI algorithms.",
    original: original1,
    edited: edited1,
    icon: Wand2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10"
  },
  {
    id: 2,
    title: "Smart Object Removal Advanced",
    description: "Remove unwanted objects cleanly while preserving the background texture.",
    original: original2,
    edited: edited2,
    icon: Layers,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  {
    id: 3,
    title: "Professional Color Grading",
    description: "Apply cinematic color grading to give your photos a professional look.",
    original: original3,
    edited: edited3,
    icon: Sparkles,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10"
  },
  {
    id: 4,
    title: "Detail Restoration Optimization",
    description: "Bring back lost details and sharpen blurry images automatically.",
    original: original4,
    edited: edited4,
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10"
  }
];

const Features = () => {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {

    let interval: ReturnType<typeof setInterval>;

    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % FEATURES_DATA.length);
      }, 6000);
    }

    return () => clearInterval(interval);

  }, [isAutoPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % FEATURES_DATA.length);
    setIsAutoPlaying(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + FEATURES_DATA.length) % FEATURES_DATA.length);
    setIsAutoPlaying(false);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const currentFeature = FEATURES_DATA[currentIndex];

  return (
    <div className="w-full py-32 bg-gradient-to-br from-emerald-950 via-emerald-950 to-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-900/50 to-transparent"></div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="text-center mb-20">

          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-4 py-1 rounded-full text-xs tracking-wider uppercase inline-block mb-6 backdrop-blur-md">
            Best In Class
          </span>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            PHOTO EDITING AND DESIGN <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              REIMAGINED
            </span>
          </h2>

          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Over the last few years, we have maintained our position as the top design service. Our commitment to pioneering innovation remains unwavering.
          </p>
        </div>

        {/* Slider */}
        <div className="relative bg-neutral-900/40 border border-white/10 rounded-[2rem] p-6 md:p-12 backdrop-blur-sm shadow-2xl">

          <div className="flex flex-col xl:flex-row gap-16 items-center">

            {/* Text Section */}

            <div className="w-full xl:w-1/3 space-y-10">

              <div className="space-y-6 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">

                <div className={`inline-flex p-4 rounded-2xl ${currentFeature.bgColor} border border-white/5 shadow-lg`}>
                  <currentFeature.icon className={`w-8 h-8 ${currentFeature.color}`} />
                </div>

                <h3 className="text-4xl font-bold text-white leading-tight animate-[fadeIn_0.6s]">
                  {currentFeature.title}
                </h3>

                <p className="text-gray-400 text-xl leading-relaxed font-light animate-[fadeIn_0.8s]">
                  {currentFeature.description}
                </p>

              </div>

              {/* Indicators */}

              <div className="flex gap-3 pt-4">

                {FEATURES_DATA.map((_, idx) => (

                  <button
                    key={idx}
                    onClick={() => handleDotClick(idx)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      idx === currentIndex
                        ? 'w-12 bg-emerald-500'
                        : 'w-3 bg-white/10 hover:bg-white/30'
                    }`}
                  />

                ))}
              </div>
              {/* Nav Buttons */}

              <div className="flex gap-4 pt-4">

                <button
                  onClick={handlePrev}
                  className="p-4 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300 group"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={handleNext}
                  className="p-4 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300 group"
                >
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Image Slider */}

            <div className="w-full xl:w-2/3">

              <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black/50 group">

                <div
                  className="absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transform: `scale(${1 + currentIndex * 0.02})`
                  }}
                >

                  <div key={currentFeature.id} className="w-full h-full animate-[fadeIn_0.7s]">
                    <ComparisonSlider
                      originalImage={currentFeature.original}
                      editedImage={currentFeature.edited}
                    />
                  </div>

                </div>

                {/* Labels */}

                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm text-white border border-white/10 pointer-events-none z-10">
                  Before Editing
                </div>

                <div className="absolute top-6 right-6 bg-emerald-900/80 backdrop-blur-md px-4 py-2 rounded-full text-sm text-emerald-100 border border-emerald-500/30 pointer-events-none z-10">
                  After Editing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );

};

export default Features;