import { Sparkles } from "lucide-react";
import type { SuggestionItem } from "@/utils/suggestionImages";

interface SuggestionGalleryProps {
  suggestions: SuggestionItem[];
  onSelect: (imageUrl: string) => void;
  title?: string;
}

const SuggestionGallery = ({ suggestions, onSelect, title = "Suggestions" }: SuggestionGalleryProps) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden />
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {suggestions.map((item, idx) => (
          <button
            key={`${item.url}-${idx}`}
            type="button"
            onClick={() => onSelect(item.url)}
            className="group relative aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden border border-gray-200/90 bg-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200/80 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-left"
          >
            <img
              src={item.url}
              alt={`${item.title}. ${item.description}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-95" />
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 pt-8 sm:pt-10">
              <p className="text-[13px] sm:text-sm font-semibold text-white leading-snug tracking-tight drop-shadow-sm line-clamp-2">
                {item.title}
              </p>
              <p className="mt-1 text-[11px] sm:text-xs text-white/85 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>
            <div className="absolute top-2 right-2 rounded-full bg-white/15 backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/95 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              Use this
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestionGallery;
