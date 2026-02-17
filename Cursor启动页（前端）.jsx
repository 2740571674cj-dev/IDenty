import React, { useState, useEffect } from 'react';
import { 
  X, 
  Minus, 
  Square, 
  Layout, 
  Settings, 
  Folder, 
  Download, 
  Terminal,
  Cpu,
  Zap,
  User,
  Keyboard,
  Globe,
  Ghost,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search,
  Command,
  Monitor,
  Plus,
  History,
  HardDrive,
  FileCode,
  Clock,
  ArrowUp,
  AlertCircle
} from 'lucide-react';

// --- 基础组件：通知系统 ---
const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 border px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-right duration-300 z-[100] ${
      type === 'error' ? 'bg-red-950/50 border-red-900' : 'bg-zinc-900 border-zinc-800'
    }`}>
      <div className={type === 'error' ? 'text-red-500' : 'text-emerald-500'}>
        {type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      </div>
      <span className="text-sm text-zinc-200">{message}</span>
      <button onClick={onClose} className="ml-2 text-zinc-600 hover:text-zinc-400">
        <X size={14} />
      </button>
    </div>
  );
};

// --- 基础组件：开关 ---
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange();
    }}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none ${
      enabled ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-700'
    }`}
  >
    <span
      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
        enabled ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

// --- 回退方案：模拟文件夹选择器 ---
const FolderPickerModal = ({ onClose, onSelect }) => {
  const [currentPath, setCurrentPath] = useState('~/Documents/Projects');
  const folders = ['ai-assistant', 'web-platform', 'cursor-clone', 'react-demo', 'notes-app'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] w-[600px] rounded-xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-[#252526]">
          <span className="text-sm font-medium text-zinc-200">Open Folder (Simulation Mode)</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        
        {/* Toolbar */}
        <div className="px-4 py-2 border-b border-zinc-700 flex gap-2 items-center bg-[#1e1e1e]">
          <button className="p-1 hover:bg-zinc-700 rounded text-zinc-400"><ArrowUp size={16} /></button>
          <div className="flex-1 bg-[#2b2b2b] border border-zinc-600 rounded px-3 py-1 text-sm text-zinc-300">
            {currentPath}
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-2">
          {folders.map(folder => (
            <div 
              key={folder}
              onClick={() => setCurrentPath(`${currentPath}/${folder}`)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#2a2d2e] rounded cursor-pointer group"
            >
              <Folder size={16} className="text-blue-400" />
              <span className="text-sm text-zinc-300 group-hover:text-white">{folder}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 opacity-50">
            <FileCode size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">readme.md</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-700 bg-[#252526] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSelect(currentPath.split('/').pop(), currentPath)}
            className="px-4 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium shadow-sm"
          >
            Open Folder
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 真实历史项目选择面板 ---
const RecentProjectsModal = ({ onClose, onSelect, projects }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filter, setFilter] = useState('');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.path.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-start justify-center pt-[20vh] animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] w-[600px] rounded-lg shadow-2xl border border-zinc-700 overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
        <div className="p-3 border-b border-zinc-700/50 flex items-center gap-3">
            <Search size={18} className="text-zinc-400" />
            <input 
                autoFocus
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search recent projects..." 
                className="bg-transparent border-none outline-none text-zinc-200 text-sm w-full placeholder:text-zinc-500"
            />
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">Esc</button>
        </div>
        <div className="py-2 min-h-[100px] max-h-[400px] overflow-y-auto">
            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Recent</div>
            
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
                    <History size={24} className="opacity-20" />
                    <span className="text-xs">No local projects opened yet</span>
                </div>
            ) : filteredProjects.length === 0 ? (
                 <div className="px-4 py-2 text-sm text-zinc-500">No matching projects found</div>
            ) : (
                filteredProjects.map((project, idx) => (
                    <div 
                        key={project.path}
                        onClick={() => onSelect(project)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`px-4 py-2 flex items-center justify-between cursor-pointer group ${
                            idx === selectedIndex ? 'bg-[#094771] text-white' : 'text-zinc-300 hover:bg-[#2a2d2e]'
                        }`}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium flex items-center gap-2">
                              {project.name}
                            </span>
                            <span className={`text-[10px] truncate max-w-[300px] ${idx === selectedIndex ? 'text-zinc-300' : 'text-zinc-500'}`}>
                              {project.path}
                            </span>
                        </div>
                        <span className={`text-[10px] ${idx === selectedIndex ? 'text-zinc-300' : 'text-zinc-600'}`}>
                          {new Date(project.lastOpened).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

// --- 顶部控制栏 ---
const TitleBar = ({ isMaximized, onToggleMaximize }) => (
  <div className="flex items-center justify-between h-10 px-4 bg-[#0b0b0b] border-b border-zinc-800/50 select-none z-50 relative">
    <div className="flex items-center gap-2 text-zinc-500 text-[11px] font-medium">
      <div className="w-3.5 h-3.5 flex items-center justify-center opacity-80">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
           <path d="m21 16-9 5-9-5V8l9-5 9 5v8z" />
           <path d="M12 21v-9" />
           <path d="m21 8-9 4-9-4" />
        </svg>
      </div>
      <span className="tracking-tight">Cursor</span>
    </div>
    
    <div className="flex items-center gap-0">
      <div className="flex items-center gap-1 mr-4 border-r border-zinc-800/50 pr-4">
        <div className="p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-default text-zinc-500 hover:text-zinc-300">
          <Layout size={14} />
        </div>
      </div>
      <div className="px-3 h-10 flex items-center hover:bg-zinc-800 transition-colors cursor-default text-zinc-500">
        <Minus size={14} />
      </div>
      <div 
        onClick={onToggleMaximize}
        className="px-3 h-10 flex items-center hover:bg-zinc-800 transition-colors cursor-default text-zinc-500"
      >
        <Square size={isMaximized ? 10 : 12} />
      </div>
      <div className="px-3 h-10 flex items-center hover:bg-red-600 group transition-colors cursor-default text-zinc-500">
        <X size={14} className="group-hover:text-white" />
      </div>
    </div>
  </div>
);

// --- 首页视图 ---
const HomeView = ({ onOpenSettings, addToast, recentProjects, onAddRecent }) => {
  const [showRecentProjects, setShowRecentProjects] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false); // 恢复模拟弹窗状态

  // 核心功能：打开本地文件夹（带回退保护）
  const handleOpenLocalFolder = async () => {
    try {
      // 1. 尝试检测 API 支持
      if (!window.showDirectoryPicker) {
        throw new Error('API_NOT_SUPPORTED');
      }

      // 2. 尝试原生调用
      const dirHandle = await window.showDirectoryPicker();
      
      const projectData = {
        name: dirHandle.name,
        path: `Local System/${dirHandle.name}`, 
        lastOpened: Date.now(),
        handle: dirHandle 
      };

      onAddRecent(projectData);
      addToast(`Opened local project: ${dirHandle.name}`);
      
    } catch (err) {
      // 用户主动取消，不报错
      if (err.name === 'AbortError') return;

      // 3. 捕获 SecurityError (iframe限制) 或 API 不支持错误，降级到模拟模式
      console.warn("File System Access API failed (likely iframe restriction), fallback to mock.", err);
      
      // 显示提示，但不是红色错误，而是作为一种信息提示
      addToast("Browser security restricted access. Switching to simulation mode.", 'error'); 
      setShowFolderPicker(true);
    }
  };

  const handleMockFolderSelect = (name, path) => {
    setShowFolderPicker(false);
    const projectData = {
        name: name,
        path: path,
        lastOpened: Date.now(),
        handle: null
    };
    onAddRecent(projectData);
    addToast(`Opened project: ${name}`);
  };

  const handleAction = (label) => {
    if (label === 'New Project') {
      handleOpenLocalFolder();
    } else if (label === 'Load Last Project') {
      setShowRecentProjects(true);
    }
  };

  const handleRecentSelect = (project) => {
    setShowRecentProjects(false);
    addToast(`Restoring workspace: ${project.name}`);
  };

  const actions = [
    { icon: <Plus size={20} />, label: 'New Project' },
    { icon: <History size={20} />, label: 'Load Last Project' }
  ];

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-40px)] bg-[#0b0b0b] text-zinc-300 px-6 relative">
        {/* Modals */}
        {showFolderPicker && (
          <FolderPickerModal 
            onClose={() => setShowFolderPicker(false)} 
            onSelect={handleMockFolderSelect} 
          />
        )}
        {showRecentProjects && (
          <RecentProjectsModal 
            onClose={() => setShowRecentProjects(false)} 
            onSelect={handleRecentSelect} 
            projects={recentProjects}
          />
        )}

        {/* 依照截图还原的 Logo 区域 */}
        <div className="mb-14 flex flex-col items-start w-full max-w-[720px] animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4 mb-2">
            {/* 六边形图标 */}
            <div className="w-12 h-12 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="white" />
                <path d="M12 22V12L21 7M12 12L3 7" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M12 12H12.01" stroke="black" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-[42px] font-black tracking-tight text-white leading-none">CURSOR</h1>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm ml-16 mt-[-4px]">
            <button 
              onClick={() => addToast("Pro features enabled")}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Pro
            </button>
            <span className="text-zinc-800 text-xs">•</span>
            <button 
              onClick={onOpenSettings}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>

        {/* 依照截图还原的卡片布局 - 修改为两列布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[720px] mb-16">
          {actions.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => handleAction(item.label)}
              className="group flex flex-col items-start p-5 bg-[#141414] border border-zinc-800/40 rounded-xl hover:bg-[#1a1a1a] hover:border-zinc-700/60 transition-all duration-200 cursor-pointer active:scale-[0.98]"
            >
              <div className="text-zinc-400 group-hover:text-zinc-200 mb-6 transition-colors">
                {item.icon}
              </div>
              <div className="text-[15px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-[720px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Recent projects</h2>
          </div>
          <div className="h-[1px] w-full bg-zinc-900" />
          
          {/* 简易的最近项目列表展示 (首页底部) */}
          <div className="mt-4 flex flex-col gap-1">
            {recentProjects.length > 0 ? recentProjects.slice(0, 3).map((proj, i) => (
               <div key={i} className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer flex items-center gap-2 py-1" onClick={() => addToast(`Reopening ${proj.name}`)}>
                  <Folder size={12} />
                  <span>{proj.name}</span>
               </div>
            )) : (
              <span className="text-xs text-zinc-700 italic mt-2">No recent local projects.</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// --- 设置视图 ---
const SettingsView = ({ onClose, addToast }) => {
  const [activeTab, setActiveTab] = useState('General');
  const [toggles, setToggles] = useState({
    telemetry: true,
    updates: true,
    gpu: false,
    crashReports: true
  });

  const toggleState = (key) => {
    const newState = !toggles[key];
    setToggles(prev => ({ ...prev, [key]: newState }));
    addToast(`${key} toggled`);
  };

  const menuItems = [
    { id: 'General', icon: <Settings size={16} />, label: 'General' },
    { id: 'Models', icon: <Cpu size={16} />, label: 'Models' },
    { id: 'Beta', icon: <Zap size={16} />, label: 'Beta' },
  ];

  return (
    <div className="fixed inset-0 top-10 bg-[#0b0b0b] z-50 flex animate-in fade-in zoom-in duration-300">
      <div className="w-60 border-r border-zinc-900 p-4 flex flex-col bg-[#0d0d0d]">
        <div className="flex items-center justify-between mb-8 px-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Settings</span>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-200">
            <X size={14} />
          </button>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === item.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-12 bg-[#0b0b0b]">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold text-zinc-100 mb-8">{activeTab} Settings</h1>
          <div className="space-y-6">
            <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl divide-y divide-zinc-800/40 overflow-hidden">
               <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Crash Reporting</p>
                    <p className="text-xs text-zinc-500">Automatically send reports.</p>
                  </div>
                  <Toggle enabled={toggles.crashReports} onChange={() => toggleState('crashReports')} />
               </div>
               <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Usage Telemetry</p>
                    <p className="text-xs text-zinc-500">Help improve the platform.</p>
                  </div>
                  <Toggle enabled={toggles.telemetry} onChange={() => toggleState('telemetry')} />
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 主应用组件 ---
export default function App() {
  const [view, setView] = useState('home'); 
  const [isMaximized, setIsMaximized] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleAddRecent = (project) => {
    setRecentProjects(prev => {
        const filtered = prev.filter(p => p.name !== project.name);
        return [project, ...filtered];
    });
  };

  return (
    <div className={`min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-hidden transition-all duration-500 ${isMaximized ? 'p-0' : 'p-0 md:p-2'}`}>
      <div className={`flex flex-col h-full bg-[#0b0b0b] overflow-hidden transition-all duration-500 ${isMaximized ? 'rounded-none shadow-none' : 'rounded-2xl shadow-2xl border border-zinc-800/30'}`}>
        <TitleBar isMaximized={isMaximized} onToggleMaximize={() => setIsMaximized(!isMaximized)} />
        <main className="relative flex-1 overflow-hidden">
          {view === 'home' ? (
            <HomeView 
                onOpenSettings={() => setView('settings')} 
                addToast={addToast} 
                recentProjects={recentProjects}
                onAddRecent={handleAddRecent}
            />
          ) : (
            <SettingsView onClose={() => setView('home')} addToast={addToast} />
          )}
        </main>
        <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-2 z-[100]">
          {toasts.map(toast => (
            <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-in { animation-fill-mode: forwards; }
        .slide-in-from-right { animation: slideInRight 0.3s ease-out; }
        body { background: #000; height: 100vh; }
      `}} />
    </div>
  );
}