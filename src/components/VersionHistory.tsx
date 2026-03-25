import { useState, useEffect } from 'react';
import { fetchEditHistory, fetchUsers } from '@/utils';
import type { EditHistory, User } from '@/utils';
import { Clock, MessageSquare, ChevronRight, User as UserIcon } from 'lucide-react';

interface VersionHistoryProps {
  projectId?: number; // Optional: if provided, filters by project
  userId?: number;    // Optional: if provided, filters by user
  className?: string;
}

const VersionHistory = ({ projectId, userId, className = '' }: VersionHistoryProps) => {
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, usersData] = await Promise.all([
          fetchEditHistory(),
          fetchUsers()
        ]);

        let filteredHistory = historyData;

        if (projectId) {
          filteredHistory = filteredHistory.filter(h => h.projectId === projectId);
        }

        if (userId) {
          filteredHistory = filteredHistory.filter(h => h.userId === userId);
        }

        // Sort by timestamp descending (newest first)
        filteredHistory.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setHistory(filteredHistory);
        setUsers(usersData);
      } catch (error) {
        console.error("Failed to load history data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId, userId]);

  const getUser = (uid: number) => users.find(u => u.id === uid);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200 ${className}`}>
        No edit history found.
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Clock size={18} className="text-gray-500" />
          Version History
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {history.map((item, index) => {
          const user = getUser(item.userId);
          const isLatest = index === 0;

          return (
            <div 
              key={item.id} 
              className="p-4 hover:bg-gray-50 transition-colors group relative"
            >
              {/* Timeline connector line */}
              {index !== history.length - 1 && (
                <div className="absolute left-[27px] top-[48px] bottom-0 w-px bg-gray-200 group-hover:bg-gray-300" />
              )}

              <div className="flex gap-4">
                {/* Avatar / Icon */}
                <div className="flex-shrink-0 relative z-10">
                  {user ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      title={user.username}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-sm">
                      <UserIcon size={20} className="text-gray-500" />
                    </div>
                  )}
                  {isLatest && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" title="Latest Version" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-medium text-gray-900 text-sm">
                        {user?.username || 'Unknown User'}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                        v{item.version}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <div className="mt-2 bg-gray-50 p-3 rounded-md border border-gray-200 group-hover:border-gray-300 transition-colors">
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare size={14} className="text-gray-400 mt-1 flex-shrink-0" />
                      <p className="text-sm text-gray-700 italic">"{item.prompt}"</p>
                    </div>
                    
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        <div className="relative group/image cursor-pointer">
                            <img 
                                src={item.inputImage} 
                                alt="Input" 
                                className="h-16 w-16 object-cover rounded border border-gray-200" 
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded flex items-center justify-center text-white text-[10px]">
                                Input
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 self-center" />
                        <div className="relative group/image cursor-pointer">
                            <img 
                                src={item.outputImage} 
                                alt="Output" 
                                className="h-16 w-16 object-cover rounded border border-gray-200 bg-gray-100" 
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity rounded flex items-center justify-center text-white text-[10px]">
                                Output
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VersionHistory;
