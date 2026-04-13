import { useState, useEffect } from 'react';
import { fetchPromptHistories, type EditHistory } from '@/utils';
import { useAuth } from '@/context';
import { Camera, X, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ComparisonSlider from '@/components/ComparisonSlider';

const GalleryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<EditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EditHistory | null>(null);

  const getSelectedOutputImage = (entry: EditHistory): string => {
    const outputs = Array.isArray(entry.outputImages) ? entry.outputImages.filter(Boolean) : [];
    if (outputs.length === 0) {
      return entry.outputImage;
    }

    const selectedIndex = Number.isFinite(entry.selectedOutputIndex)
      ? Math.max(0, Math.min(Number(entry.selectedOutputIndex), outputs.length - 1))
      : 0;

    return outputs[selectedIndex] || outputs[0] || entry.outputImage;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          setItems([]);
          return;
        }
        const historyData = await fetchPromptHistories();
        const mine = historyData
          .filter((item) => item.userId === user.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setItems(mine);
      } catch (error) {
        console.error("Failed to load gallery data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white text-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-gray-500 font-medium">Loading gallery...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[70vh] pb-24 pt-1 md:pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 px-1">Gallery</h1>
        <button
          onClick={() => navigate("/editor")}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Camera size={16} />
          Modify New Image
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 md:p-12 text-center text-gray-500">
          No edited images yet. Create one from the editor.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="aspect-square overflow-hidden rounded-2xl border border-gray-200 hover:border-emerald-300 transition-colors shadow-sm active:scale-[0.99]"
            >
              <img src={getSelectedOutputImage(item)} alt={item.prompt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="bg-white w-full md:max-w-3xl md:rounded-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Image Detail</h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-md hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <ComparisonSlider originalImage={selectedItem.inputImage} editedImage={getSelectedOutputImage(selectedItem)} />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Prompt used</p>
                <p className="text-gray-900">{selectedItem.prompt || "No prompt provided."}</p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500">Editing method used</p>
                <p className="text-gray-900 capitalize">{user?.assignedMethod ?? "text"}</p>
              </div>
              <button
                onClick={() => navigate("/editor")}
                className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                Modify New Image
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedItem(null)} />
        </div>
      )}

      <div className="fixed bottom-22 right-4 md:bottom-6 md:right-6 flex items-center gap-3">
        <p className="text-xs md:text-sm font-semibold text-blue-700 leading-tight max-w-[170px] bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-200">
          Complete post-study form to finish
        </p>
        <div className="relative">
          <span
            className="absolute -inset-2 rounded-full border border-emerald-500 opacity-60 animate-pulse -z-10"
            style={{ animationDuration: "2s" }}
          />
          <button
            onClick={() => navigate("/post-study-form")}
            className="relative w-14 h-14 rounded-full bg-gray-900 text-white shadow-xl flex items-center justify-center hover:bg-black transition-colors"
            aria-label="Open post-study form"
          >
            <ClipboardList size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;