import { useState, useEffect, useMemo, useRef } from 'react';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { useAuth } from '@/context';
import {
  fetchUsers,
  fetchEditHistory,
  fetchResultFeedbacks,
  removeUser,
  renameUser,
  createNewUser,
  type User,
  type EditHistory,
  type ResultFeedback
} from '@/utils';
import { 
  Shield, 
  Users, 
  Database, 
  Search, 
  LayoutDashboard, 
  Activity, 
  Calendar, 
  ArrowUpRight,
  Filter,
  Download,
  MoreHorizontal,
  Clock,
  LayoutGrid,
  List,
  ArrowRight,
  MessageSquareQuote
} from 'lucide-react';

import runflux from '../runflux.py?raw';

// Helper for conditional classes
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<EditHistory[]>([]);
  const [feedbacks, setFeedbacks] = useState<ResultFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'prompts' | 'feedback'>('users');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate a slight delay for smoother loading experience
        await new Promise(resolve => setTimeout(resolve, 800));
        const [usersData, historyData, feedbackData] = await Promise.all([
          fetchUsers(),
          fetchEditHistory(),
          fetchResultFeedbacks(),
        ]);
        setUsers(usersData);
        setHistory(historyData);
        setFeedbacks(
          [...feedbackData].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalEdits = history.length;
    const activeUsersCount = new Set(history.map(h => h.userId)).size;
    const avgEditsPerUser = totalUsers ? (totalEdits / totalUsers).toFixed(1) : '0';

    return [
      { 
        label: 'Total Users', 
        value: totalUsers, 
        icon: Users, 
        color: 'text-blue-600', 
        bg: 'bg-blue-50',
        trend: '+12% from last month' 
      },
      { 
        label: 'Total Edits', 
        value: totalEdits, 
        icon: Database, 
        color: 'text-purple-600', 
        bg: 'bg-purple-50',
        trend: '+24% from last month'
      },
      { 
        label: 'Active Users', 
        value: activeUsersCount, 
        icon: Activity, 
        color: 'text-green-600', 
        bg: 'bg-green-50',
        trend: '+5% from last month'
      },
      { 
        label: 'Avg. Edits/User', 
        value: avgEditsPerUser, 
        icon: LayoutDashboard, 
        color: 'text-orange-600', 
        bg: 'bg-orange-50',
        trend: 'Stable'
      },
    ];
  }, [users, history]);

  const filteredUsers = useMemo(() => 
    users.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [users, searchTerm]);

  const filteredHistory = useMemo(() => 
    history.filter(h => 
      h.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  [history, searchTerm]);

  const filteredFeedbacks = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return feedbacks.filter((f) => {
      if (!q) return true;
      return (
        f.message.toLowerCase().includes(q) ||
        f.prompt.toLowerCase().includes(q) ||
        String(f.userId).includes(q) ||
        (f.historyId != null && String(f.historyId).includes(q))
      );
    });
  }, [feedbacks, searchTerm]);

  const userNameById = useMemo(() => {
    const m = new Map<number, string>();
    users.forEach((u) => m.set(u.id, u.username));
    return m;
  }, [users]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50/50">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-500 mb-6">
            You do not have the necessary permissions to view this dashboard. Please contact your administrator.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium w-full"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>Dashboard</span>
                <span>/</span>
                <span className="text-gray-900 font-medium">Overview</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-7 h-7 text-emerald-600" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Signed in as <span className="font-semibold text-gray-800">{user.username}</span>
                <span className="mx-2 text-gray-300">·</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-e-50 text-e-700 px-2 py-0.5 text-xs font-medium">
                  Administrator
                </span>
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-600">
                <Calendar size={14} />
                <span>Last 30 Days</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-e-600 text-white rounded-lg hover:bg-e-700 transition-all shadow-sm hover:shadow text-sm font-medium">
                <Download size={16} />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={cn(
                "bg-white p-6 rounded-xl shadow-sm border border-gray-200 transition-all hover:shadow-md",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-100 rounded"></div>
                  <div className="h-8 w-16 bg-gray-100 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <stat.icon size={20} className={stat.color} />
                    </div>
                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <ArrowUpRight size={12} className="mr-1" />
                      {stat.trend}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">

          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50"> {/*Toolbar with Tabs & Search*/}

            <div className="flex bg-gray-200/50 p-1 rounded-lg"> {/*Tabs for Users, Prompts History, and Result Feedback*/}
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === 'users' 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                <Users size={16} />
                Users & Methods
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === 'prompts' 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                <Database size={16} />
                Prompts History
              </button>
              <button
                onClick={() => setActiveTab('feedback')}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                  activeTab === 'feedback'
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                <MessageSquareQuote size={16} />
                Result feedback
              </button>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto"> {/*Add User button*/}
              {(() => {
                const [showAddMenu, setShowAddMenu] = useState(false);
                const [newUsername, setNewUsername] = useState('');
                const [selectedMethod, setSelectedMethod] = useState("0");

                return (
                  <div className="relative">
                    <button 
                      onClick={() => setShowAddMenu(!showAddMenu)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow text-sm font-medium"
                    >
                      Add User
                    </button>

                    {showAddMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-4 space-y-4">
                        <input
                          type="text"
                          placeholder="New username"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:outline-none"
                        />

                        <select
                          value={selectedMethod}
                          onChange={(e) => setSelectedMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 focus:outline-none bg-white"
                        >
                          <option value="0">Text</option>
                          <option value="1">Voice</option>
                          <option value="2">Inpainting</option>
                          <option value="3">Drag-and-Drop</option>
                        </select>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddMenu(false);
                              setNewUsername('');
                              setSelectedMethod("0");
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              console.log(newUsername, selectedMethod);
                              createNewUser(newUsername, selectedMethod, false);
                              console.log(11);
                              setShowAddMenu(false);
                              console.log(12);
                              setNewUsername('');
                              console.log(13);
                              setSelectedMethod(selectedMethod);
                              console.log(14);
                              window.location.reload();
                            }}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {(() => {
                const [isPyodideReady, setIsPyodideReady] = useState<boolean>(false);
                const [loading, setLoading] = useState<boolean>(false);
                const pyodideRef = useRef<PyodideInterface | null>(null);

                useEffect(() => {
                  const initializePyodide = async () => {
                    try {
                      const pyodide = await loadPyodide({
                        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/" /* https://pyodide.org/en/stable/usage/quickstart.html */
                      });
                      
                      await pyodide.loadPackage("micropip") // Install micropip first so we can actually use it
                      pyodide.FS.writeFile('/home/pyodide/runflux.py', runflux);
        
                      // Install required packages using micropip
                      // Note: This must be done BEFORE importing them in the script
                      await pyodide.runPythonAsync(`
                        import micropip

                        # Install packages - this downloads and installs them from PyPI
                        # Pillow (PIL) and requests are available as pure Python wheels
                        await micropip.install('pillow')
                        await micropip.install('requests')

                        print("✓ Packages installed successfully")
                      `);
                      
                      // Now write and import runflux.py
                      pyodide.FS.writeFile('runflux.py', runflux);
                      
                      await pyodide.runPythonAsync(`
                        import runflux

                        # Store reference to the function
                        testprint = runflux.testprint
                        print("✓ Script loaded")
                      `);

                      pyodideRef.current = pyodide;
                      setIsPyodideReady(true);
                    } catch (error) {
                      console.error('Failed to initialize Pyodide:', error);
                    }
                  };

                  initializePyodide();
                }, []);

                const callPythonFunction = async (inputString: string): Promise<string | null> => {
                  if (!pyodideRef.current) {
                    console.error('Pyodide not ready');
                    return null;
                  }

                  try {
                    setLoading(true);
                    const escapedInput = inputString.replace(/"/g, '\\"');
      
                    const result = pyodideRef.current.runPython(`
                      import runflux
                      result = runflux.testprint("${escapedInput}")
                      result
                    `);
                    
                    console.log(`Input: "${inputString}" → Output: "${result}"`);
                    return result;
                  } catch (error) {
                    console.error('Error calling Python function:', error);
                    return null;
                  } finally {
                    setLoading(false);
                  }
                };

                const handleProcessString = async (): Promise<void> => {
                  const testString = "Hello, world ";
                  const result = await callPythonFunction(testString);
                  console.log('Final result:', result);
                };

                return (
                  <div>
                    <button 
                      onClick={handleProcessString}
                      disabled={!isPyodideReady || loading}
                    >
                      (pytest)
                    </button>
                  </div>
                );
              }
              )()}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto"> {/*Search bar*/}
              {activeTab === 'prompts' && (
                <div className="flex bg-gray-200/50 p-1 rounded-lg mr-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      viewMode === 'list' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    )}
                    title="List View"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-2 rounded-md transition-all",
                      viewMode === 'grid' 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-900"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              )}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-e-500/20 focus:border-e-500 focus:outline-none transition-all"
                />
              </div>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200 bg-white">
                <Filter size={16} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-100 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'users' ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        <th className="p-4">User Details</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Method</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-gray-100 object-cover ring-2 ring-white shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-e-100 text-e-700 flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm">
                                      {user.username.slice(0, 2).toUpperCase()} {/*Shortened User PFP*/}
                                    </div>
                                  )}
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{user.username}</div> {/*Username*/}
                                  <div className="text-xs text-gray-500 font-mono">ID: #{user.id}</div> {/*User ID*/}
                                </div>
                              </div>
                            </td>
                            <td className="p-4"> {/*USER ROLE*/}
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                user.role === 'admin' 
                                  ? "bg-purple-50 text-purple-700 border-purple-100" 
                                  : "bg-gray-50 text-gray-600 border-gray-100"
                              )}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2"> {/*METHOD*/}
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  user.assignedMethod === 'text' ? "bg-blue-500" :
                                  user.assignedMethod === 'voice' ? "bg-green-500" :
                                  user.assignedMethod === 'inpainting' ? "bg-orange-500" : "bg-pink-500"
                                )}></span>
                                <span className="text-sm text-gray-700 capitalize font-medium">
                                  {user.assignedMethod}
                                </span>
                              </div>
                            </td>
                            <td className="p-4"> {/*Active/In-active (Does nothing)*/}
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                                Active
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="relative group">
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                  <MoreHorizontal size={16} />
                                  <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                                    <button 
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                                    onClick={() => {
                                      const newName = prompt('Input new name for user');
                                      if (newName) {
                                      renameUser(user, newName);
                                      window.location.reload();
                                      }
                                    }}
                                    >
                                    Rename User
                                    </button>
                                  <button className="w-full text-left px-4 py-2 bg-red-600 text-sm text-gray-700 hover:bg-gray-50 rounded-lg hover:bg-red-700" onClick={() => {removeUser(user);window.location.reload()}}> {/*Remove User & Reload this window*/}
                                    Remove User
                                  </button>
                                </div>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <Users className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                            <p className="text-gray-500 mt-1">Try adjusting your search terms</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  activeTab === 'prompts' ? (
                  viewMode === 'list' ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                          <th className="p-4">Timestamp</th>
                          <th className="p-4">User</th>
                          <th className="p-4">Prompt Details</th>
                          <th className="p-4">Transformation</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredHistory.length > 0 ? (
                          filteredHistory.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 align-top">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-e-100 text-e-600 flex items-center justify-center text-xs font-bold">
                                    {item.userId.toString().charAt(0)}
                                  </div>
                                  <span className="text-sm text-gray-600 font-mono">#{item.userId}</span>
                                </div>
                              </td>
                              <td className="p-4 max-w-md align-top">
                                <div className="flex flex-col gap-1">
                                  <p className="text-sm text-gray-900 font-medium leading-relaxed">
                                    "{item.prompt}"
                                  </p>
                                  <span className="inline-flex self-start items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                    v{item.version}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 align-top">
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={item.inputImage || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={cn(
                                      "relative group/img w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100 block",
                                      !item.inputImage && "pointer-events-none cursor-default"
                                    )}
                                  >
                                    {item.inputImage ? (
                                      <img src={item.inputImage} alt="input" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                    )}
                                    {item.inputImage && (
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                        View
                                      </div>
                                    )}
                                  </a>
                                  <ArrowRight size={16} className="text-gray-400" />
                                  <a 
                                    href={item.outputImage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative group/img w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100 block"
                                  >
                                    <img src={item.outputImage} alt="output" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                      View
                                    </div>
                                  </a>
                                </div>
                              </td>
                              <td className="p-4 text-right align-top">
                                <a 
                                  href={item.outputImage} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-e-700 bg-e-50 hover:bg-e-100 rounded-md transition-colors"
                                >
                                  View Full
                                  <ArrowUpRight size={12} />
                                </a>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-12 text-center">
                              <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Database className="text-gray-300" size={32} />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900">No history found</h3>
                              <p className="text-gray-500 mt-1">No prompts match your search</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6">
                      {filteredHistory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {filteredHistory.map(item => (
                            <div key={item.id} className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                              <div className="relative aspect-[2/1] bg-gray-100 flex">
                                <div className="flex-1 relative border-r border-white/20 group/input">
                                  {item.inputImage ? (
                                    <>
                                      <img src={item.inputImage} alt="input" className="w-full h-full object-cover" />
                                      <a 
                                        href={item.inputImage}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/input:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer z-10"
                                      >
                                        <ArrowUpRight size={20} />
                                      </a>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                  )}
                                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none z-20">
                                    Original
                                  </div>
                                </div>
                                <div className="flex-1 relative group/output">
                                  <img src={item.outputImage} alt="output" className="w-full h-full object-cover" />
                                  <a 
                                    href={item.outputImage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/output:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer z-10"
                                  >
                                    <ArrowUpRight size={20} />
                                  </a>
                                  <div className="absolute top-2 right-2 bg-e-600/90 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm pointer-events-none z-20">
                                    Result
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4 flex-1 flex flex-col">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-e-50 text-e-600 flex items-center justify-center text-xs font-bold border border-e-100">
                                      {item.userId.toString().charAt(0)}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">User #{item.userId}</span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                                    v{item.version}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-900 font-medium leading-relaxed mb-4 line-clamp-3 flex-1" title={item.prompt}>
                                  "{item.prompt}"
                                </p>
                                
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(item.timestamp).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Database className="text-gray-300" size={32} />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">No history found</h3>
                          <p className="text-gray-500 mt-1">No prompts match your search</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                        <th className="p-4 w-[140px]">Submitted</th>
                        <th className="p-4 w-[160px]">User</th>
                        <th className="p-4 w-[100px]">Round</th>
                        <th className="p-4 w-[90px]">History ID</th>
                        <th className="p-4 min-w-[180px]">Prompt</th>
                        <th className="p-4 min-w-[240px]">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredFeedbacks.length > 0 ? (
                        filteredFeedbacks.map((f) => (
                          <tr key={f.id} className="hover:bg-gray-50/50 align-top">
                            <td className="p-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(f.createdAt).toLocaleDateString()}
                              </span>
                              <span className="block text-xs text-gray-500 mt-0.5">
                                {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium text-gray-900">
                                {userNameById.get(f.userId) ?? `User #${f.userId}`}
                              </span>
                              <span className="block text-xs text-gray-500 font-mono">ID {f.userId}</span>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold">
                                Round {f.round}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-sm text-gray-600">
                              {f.historyId ?? '—'}
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="text-sm text-gray-700 line-clamp-4" title={f.prompt}>
                                {f.prompt || '—'}
                              </p>
                            </td>
                            <td className="p-4 max-w-md">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-12 text-center">
                            <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                              <MessageSquareQuote className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No feedback yet</h3>
                            <p className="text-gray-500 mt-1 max-w-md mx-auto">
                              Submissions from the editor result screen (Give feedback) will appear here.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )
              )}
              </>
            )}
          </div>
          
          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">1</span> to{' '}
              <span className="font-medium text-gray-900">
                {activeTab === 'users'
                  ? filteredUsers.length
                  : activeTab === 'prompts'
                    ? filteredHistory.length
                    : filteredFeedbacks.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-900">
                {activeTab === 'users' ? users.length : activeTab === 'prompts' ? history.length : feedbacks.length}
              </span>{' '}
              results
            </span>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 text-sm text-gray-400 bg-white border border-gray-200 rounded shadow-sm cursor-not-allowed">Previous</button>
              <button disabled className="px-3 py-1 text-sm text-gray-400 bg-white border border-gray-200 rounded shadow-sm cursor-not-allowed">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
