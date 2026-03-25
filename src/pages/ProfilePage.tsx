import { useState, useEffect } from "react";
import { fetchEditHistory, type EditHistory } from "@/utils";
import { useAuth } from "@/context";
import { LayoutGrid, Camera, Settings, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<EditHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const history = await fetchEditHistory();
        setItems(history.filter((h) => h.userId === user.id));
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-tr from-emerald-400 to-emerald-600">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full rounded-full object-cover border-4 border-white"
              />
            </div>

            <button className="absolute bottom-0 right-0 p-2 bg-white border shadow-md rounded-full hover:bg-gray-50 transition">
              <Settings size={16} />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">{user.username}</h1>

            {/* Stats */}
            <div className="flex items-center justify-center md:justify-start gap-8 text-sm text-gray-600 mb-4">
              <div>
                <p className="font-bold text-gray-900 text-lg">{items.length}</p>
                <p>Projects</p>
              </div>

              <div>
                <p className="font-bold text-gray-900 text-lg">124</p>
                <p>Likes</p>
              </div>

              <div>
                <p className="font-bold text-gray-900 text-lg">12</p>
                <p>Following</p>
              </div>
            </div>

            <p className="text-gray-600 max-w-md">
              Passionate about redesigning public spaces and creating better
              urban experiences through creative ideas.
            </p>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LayoutGrid size={20} className="text-emerald-600" />
            My Projects
          </h2>

          <button
            onClick={() => navigate("/editor")}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          
          {/* Loading */}
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 rounded-xl animate-pulse"
              />
            ))}

          {/* Projects */}
          {!loading &&
            items.map((item) => (
              <div
                key={item.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition"
              >
                <img
                  src={item.outputImage}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-4">
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {item.prompt}
                  </p>

                  <span className="text-gray-300 text-xs mt-1">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-gray-300 rounded-xl bg-white">
              <Camera
                size={48}
                className="mx-auto text-gray-300 mb-4"
              />

              <p className="text-gray-500 mb-4">
                You haven't created any redesign projects yet.
              </p>

              <button
                onClick={() => navigate("/editor")}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Create Your First Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Button */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => navigate("/editor")}
          className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xl hover:bg-emerald-700 active:scale-95 transition"
        >
          <Camera size={22} />
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;