import { Sparkles } from "lucide-react";

interface SuggestionGalleryProps {
  suggestions: string[];
  onSelect: (imageUrl: string) => void;
  title?: string;
}

const SuggestionGallery = ({ suggestions, onSelect, title = "Suggestions" }: SuggestionGalleryProps) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {suggestions.map((img, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(img)}
            className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <img 
              src={img} 
              alt={`Suggestion ${idx + 1}`} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-xs font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
              Try this
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionGallery;
