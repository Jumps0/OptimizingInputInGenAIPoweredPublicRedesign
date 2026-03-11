import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { AVATARS, METHODS } from '@/utils/constants';
import {
  User,
  Mic,
  Type,
  Paintbrush,
  MousePointer2,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

type MethodType = typeof METHODS[number];

type MethodConfig = {
  icon: LucideIcon;
  label: string;
  color: string;
  description: string;
};

const METHOD_CONFIG: Record<MethodType, MethodConfig> = {
  voice: {
    icon: Mic,
    label: 'Voice Command',
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    description: 'Control the interface using voice commands.'
  },
  text: {
    icon: Type,
    label: 'Text Input',
    color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    description: 'Type natural language instructions to edit.'
  },
  inpainting: {
    icon: Paintbrush,
    label: 'Inpainting',
    color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    description: 'Paint over areas to regenerate them.'
  },
  dragdrop: {
    icon: MousePointer2,
    label: 'Drag & Drop',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    description: 'Drag elements directly to manipulate the scene.'
  }
};

const CreateAccount = () => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const avatarIndex = AVATARS.indexOf(selectedAvatar);
  const assignedMethodKey = METHODS[avatarIndex % METHODS.length];
  // const assignedMethod = METHOD_CONFIG[assignedMethodKey];

  // const AssignedIcon = assignedMethod.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);
    setError('');

    await new Promise((resolve) => setTimeout(resolve, 800));

    const success = await signup(username, selectedAvatar, assignedMethodKey);

    if (success) {
      navigate('/');
    } else {
      setError('Username already exists. Please choose another one.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4 relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Avatar Selection */}
          <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-slate-900/30">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              Choose Your Avatar
            </h2>

            <div className="grid grid-cols-5 gap-3 mb-6">
              {AVATARS.map((avatar, index) => {
                const isSelected = selectedAvatar === avatar;
                const methodKey = METHODS[index % METHODS.length];
                const MethodIcon = METHOD_CONFIG[methodKey].icon;

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative group aspect-square rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 scale-110 z-10 bg-white/10'
                        : 'hover:bg-white/5 hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full rounded-xl object-cover p-1"
                    />

                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div className="absolute bottom-0 right-0 p-0.5 rounded-tl-md bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <MethodIcon className="w-3 h-3 text-white/70" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* <div className={`mt-6 p-4 rounded-xl border ${assignedMethod.color}`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white/10 shrink-0">
                  <AssignedIcon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-1">
                    Assigned Ability: {assignedMethod.label}
                  </h3>
                  <p className="text-xs opacity-80">
                    {assignedMethod.description}
                  </p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Form */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Join the Citizenry
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="text-sm text-slate-200">Username</label>

                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Initialize Identity
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Login here
                </Link>
              </p>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateAccount;