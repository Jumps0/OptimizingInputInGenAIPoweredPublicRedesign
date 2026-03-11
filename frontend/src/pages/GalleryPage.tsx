import { useState, useEffect, useRef } from 'react';
import { fetchEditHistory, fetchUsers, type EditHistory, type User, addComment } from '@/utils';
import { useAuth } from '@/context';
import { Heart,  Grid, Search, Camera, X } from 'lucide-react';
import ReactCompareImage from 'react-compare-image';

const GalleryPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<(EditHistory & { user?: User; commentsExpanded?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{[key: number]: string}>({});
  const [activeCommentId, setActiveCommentId] = useState<number | null>(null);
  
  // Ref for the scroll container to handle snap scrolling if needed
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, usersData] = await Promise.all([
          fetchEditHistory(),
          fetchUsers()
        ]);

        const combinedData = historyData.map(item => ({
          ...item,
          user: usersData.find(u => u.id === item.userId),
          commentsExpanded: false
        }));

        combinedData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setItems(combinedData);
      } catch (error) {
        console.error("Failed to load gallery data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // const handleLike = (itemId: number) => {
  //   if (!user) return;
  //   const updatedLikes = toggleLike(itemId, user.id);
  //   setItems(prev => prev.map(item => 
  //     item.id === itemId ? { ...item, likes: updatedLikes } : item
  //   ));
  // };

  // const handleCommentToggle = (itemId: number) => {
  //   setActiveCommentId(activeCommentId === itemId ? null : itemId);
  // };

  const handleCommentSubmit = (itemId: number) => {
    if (!user || !commentText[itemId]?.trim()) return;
    
    const text = commentText[itemId].trim();
    const updatedComments = addComment(itemId, user.id, text);
    
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, comments: updatedComments } : item
    ));
    
    setCommentText(prev => ({ ...prev, [itemId]: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black text-white">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="text-gray-400 font-medium">Loading feed...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] md:h-[calc(100vh-8rem)] bg-black text-white flex flex-col md:rounded-2xl overflow-hidden shadow-2xl">
      {/* Header - Transparent Floating (Mobile Only) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent md:hidden">
        <div className="flex items-center gap-2">
            <Grid size={24} className="text-white drop-shadow-md" />
            <span className="text-lg font-bold text-white drop-shadow-md tracking-wide">Community</span>
        </div>
        <div className="flex gap-4">
            <Search size={24} className="text-white drop-shadow-md cursor-pointer hover:text-emerald-400 transition-colors" />
            <Camera size={24} className="text-white drop-shadow-md cursor-pointer hover:text-emerald-400 transition-colors" />
        </div>
      </div>

      {/* Snap Scroll Feed */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide h-full w-full"
        style={{ scrollBehavior: 'smooth' }}
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start h-full w-full relative flex items-center justify-center bg-gray-900 overflow-hidden">
             
             {/* Background Blur Effect for different aspect ratios */}
             <div 
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110"
                style={{ backgroundImage: `url(${item.outputImage})` }}
             />

             {/* Main Image Content */}
             <div className="relative w-full h-full max-w-md md:max-w-xl mx-auto flex items-center justify-center z-10">
                <div className="w-full h-full md:h-auto md:aspect-[9/16] relative flex items-center">
                    <ReactCompareImage 
                      leftImage={item.inputImage} 
                      rightImage={item.outputImage}
                      leftImageLabel="Original"
                      rightImageLabel="Edited"
                      sliderLineWidth={2}
                      handleSize={30}
                      sliderLineColor="rgba(255, 255, 255, 0.8)"
                    />
                </div>
             </div>

             {/* Overlay Gradient */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90 pointer-events-none z-10" />

          

             {/* Bottom Info Area */}
             <div className={`absolute bottom-4 md:bottom-8 left-4 z-20 text-left ${user?.role === 'admin' ? 'right-16' : 'right-4'}`}>
                <div className="flex items-center gap-3 mb-3">
                    {item.user?.avatar ? (
                        <img src={item.user.avatar} alt={item.user.username} className="w-10 h-10 rounded-full border-2 border-white/20" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold border-2 border-white/20">
                            {item.user?.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base shadow-black drop-shadow-md">{item.user?.username || 'Unknown'}</span>
                            {/* <button className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full font-medium backdrop-blur-sm transition-colors">Follow</button> */}
                        </div>
                        <span className="text-xs text-gray-300 drop-shadow-sm">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <p className="text-sm text-gray-100 line-clamp-2 drop-shadow-md pr-4">
                    {item.prompt}
                </p>
                
                <div className="flex items-center gap-2 mt-2">
                    <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        ✨ AI Edited
                    </div>
                </div>
             </div>

             {/* Comments Overlay - Per Item (Rendered if active) */}
             {activeCommentId === item.id && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
                    <div 
                        className="bg-gray-900 w-full md:w-[480px] md:h-[600px] h-[75vh] rounded-t-2xl md:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Comments Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10">
                            <h3 className="text-white font-bold text-lg">Comments ({item.comments?.length || 0})</h3>
                            <button 
                                onClick={() => setActiveCommentId(null)}
                                className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Comments List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {item.comments?.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    No comments yet. Be the first!
                                </div>
                            ) : (
                                item.comments?.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-300">
                                            U{comment.userId}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold text-gray-200 text-sm">User #{comment.userId}</span>
                                                <span className="text-xs text-gray-500">2h</span>
                                            </div>
                                            <p className="text-gray-300 text-sm mt-0.5">{comment.text}</p>
                                        </div>
                                        <button className="text-gray-500 hover:text-red-500 transition-colors self-start pt-1">
                                            <Heart size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Comment Input */}
                        {user ? (
                            <div className="p-4 border-t border-gray-800 bg-gray-900 sticky bottom-0">
                                <div className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2 border border-gray-700 focus-within:border-emerald-500 transition-colors">
                                    <input
                                        type="text"
                                        value={commentText[item.id] || ''}
                                        onChange={(e) => setCommentText({...commentText, [item.id]: e.target.value})}
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 text-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(item.id)}
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => handleCommentSubmit(item.id)}
                                        disabled={!commentText[item.id]?.trim()}
                                        className="text-emerald-500 disabled:text-gray-600 font-medium text-sm transition-colors"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-t border-gray-800 text-center">
                                <p className="text-sm text-gray-400">Log in to comment</p>
                            </div>
                        )}
                    </div>
                    {/* Backdrop click to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setActiveCommentId(null)} />
                </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;