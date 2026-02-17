import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialog } from './components/DialogProvider';
import {
    X, Minus, Square, Layout, Settings, Folder, Plus, History,
    FileCode, Clock, ArrowUp, AlertCircle, CheckCircle2, Search,
    Cpu, Zap, ChevronRight, ExternalLink, Copy, Trash2, Edit3,
    MoreHorizontal, PlusCircle, Terminal, Code2, Save, Bot
} from 'lucide-react';
import ProjectView from './ProjectView';

// ============================================================
// 通知提示组件
// ============================================================
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 border px-4 py-3 rounded-xl shadow-2xl animate-slide-in-right z-[100] ${type === 'error' ? 'bg-red-950/50 border-red-900' : 'bg-zinc-900 border-zinc-800'
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

// ============================================================
// 开关组件
// ============================================================
const Toggle = ({ enabled, onChange }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none ${enabled ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-700'
            }`}
    >
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-1'
            }`} />
    </button>
);

// ============================================================
// 真实文件夹浏览器（替代原来的模拟弹窗）
// ============================================================
const FolderBrowser = ({ onClose, onSelect, initialPath }) => {
    const [currentPath, setCurrentPath] = useState(initialPath || 'C:\\');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    // 读取当前目录内容
    const loadDirectory = useCallback(async (dirPath) => {
        setLoading(true);
        try {
            const items = await window.electronAPI.readDir(dirPath);
            setEntries(items);
            setCurrentPath(dirPath);
        } catch (err) {
            console.error('Failed to read directory:', err);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadDirectory(currentPath);
    }, []); // 只在初始加载时读取

    // 返回上级目录
    const goUp = () => {
        const parent = currentPath.replace(/\\[^\\]+$/, '') || currentPath.substring(0, 3); // Windows 盘符
        if (parent !== currentPath) {
            loadDirectory(parent);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center animate-fade-in">
            <div className="bg-[#1e1e1e] w-[650px] rounded-xl shadow-2xl border border-zinc-700 overflow-hidden flex flex-col max-h-[520px]">
                {/* 标题栏 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-[#252526]">
                    <span className="text-sm font-medium text-zinc-200">选择项目文件夹</span>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                {/* 路径工具栏 */}
                <div className="px-4 py-2 border-b border-zinc-700 flex gap-2 items-center bg-[#1e1e1e]">
                    <button
                        onClick={goUp}
                        className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 transition-colors"
                        title="返回上级目录"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <div className="flex-1 bg-[#2b2b2b] border border-zinc-600 rounded px-3 py-1.5 text-sm text-zinc-300 font-mono truncate">
                        {currentPath}
                    </div>
                </div>

                {/* 文件列表 */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
                            正在读取...
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
                            此文件夹为空
                        </div>
                    ) : (
                        entries.map(entry => (
                            <div
                                key={entry.path}
                                onClick={() => {
                                    if (entry.isDirectory) {
                                        loadDirectory(entry.path);
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer group ${entry.isDirectory
                                    ? 'hover:bg-[#2a2d2e]'
                                    : 'opacity-50 cursor-default'
                                    }`}
                            >
                                {entry.isDirectory ? (
                                    <Folder size={16} className="text-blue-400 flex-shrink-0" />
                                ) : (
                                    <FileCode size={16} className="text-zinc-500 flex-shrink-0" />
                                )}
                                <span className={`text-sm truncate ${entry.isDirectory
                                    ? 'text-zinc-300 group-hover:text-white'
                                    : 'text-zinc-500'
                                    }`}>
                                    {entry.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* 底部按钮 */}
                <div className="px-4 py-3 border-t border-zinc-700 bg-[#252526] flex justify-between items-center">
                    <span className="text-xs text-zinc-500 truncate max-w-[350px]">{currentPath}</span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={() => {
                                const folderName = currentPath.split('\\').pop() || currentPath;
                                onSelect(folderName, currentPath);
                            }}
                            className="px-4 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium shadow-sm"
                        >
                            选择此文件夹
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// 最近项目搜索面板
// ============================================================
const RecentProjectsModal = ({ onClose, onSelect, onOpenInCursor, projects }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filter, setFilter] = useState('');

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.path.toLowerCase().includes(filter.toLowerCase())
    );

    // 键盘导航
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredProjects.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Enter' && filteredProjects[selectedIndex]) {
                onOpenInCursor(filteredProjects[selectedIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, filteredProjects, selectedIndex, onOpenInCursor]);

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60] flex items-start justify-center pt-[20vh] animate-fade-in">
            <div className="bg-[#1e1e1e] w-[600px] rounded-lg shadow-2xl border border-zinc-700 overflow-hidden flex flex-col animate-slide-in-top">
                <div className="p-3 border-b border-zinc-700/50 flex items-center gap-3">
                    <Search size={18} className="text-zinc-400" />
                    <input
                        autoFocus
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setSelectedIndex(0); }}
                        placeholder="搜索最近的项目..."
                        className="bg-transparent border-none outline-none text-zinc-200 text-sm w-full placeholder:text-zinc-500"
                    />
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-xs bg-zinc-800 px-1.5 py-0.5 rounded">Esc</button>
                </div>
                <div className="py-2 min-h-[100px] max-h-[400px] overflow-y-auto">
                    <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">最近打开</div>

                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
                            <History size={24} className="opacity-20" />
                            <span className="text-xs">还没有打开过任何本地项目</span>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-zinc-500">没有匹配的项目</div>
                    ) : (
                        filteredProjects.map((project, idx) => (
                            <div
                                key={project.path}
                                onClick={() => onOpenInCursor(project)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                className={`px-4 py-2.5 flex items-center justify-between cursor-pointer group ${idx === selectedIndex ? 'bg-[#094771] text-white' : 'text-zinc-300 hover:bg-[#2a2d2e]'
                                    }`}
                            >
                                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        <Folder size={14} className="text-blue-400 flex-shrink-0" />
                                        {project.name}
                                    </span>
                                    <span className={`text-[10px] truncate max-w-[350px] ${idx === selectedIndex ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                        {project.path}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] ${idx === selectedIndex ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                        {new Date(project.lastOpened).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <ExternalLink size={12} className={`${idx === selectedIndex ? 'text-zinc-300' : 'text-zinc-700'}`} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// 自定义标题栏（绑定真实窗口控制）
// ============================================================
const TitleBar = () => {
    const [isMaximized, setIsMaximized] = useState(false);

    // 定期检查窗口状态
    useEffect(() => {
        const checkMaximized = async () => {
            if (window.electronAPI) {
                const maximized = await window.electronAPI.isMaximized();
                setIsMaximized(maximized);
            }
        };
        checkMaximized();
        const interval = setInterval(checkMaximized, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="titlebar-drag flex items-center justify-between h-10 px-4 bg-[#0b0b0b] border-b border-zinc-800/50 select-none z-50 relative">
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

            <div className="titlebar-no-drag flex items-center gap-0">
                <div className="flex items-center gap-1 mr-4 border-r border-zinc-800/50 pr-4">
                    <div className="p-1.5 hover:bg-zinc-800 rounded transition-colors cursor-default text-zinc-500 hover:text-zinc-300">
                        <Layout size={14} />
                    </div>
                </div>
                {/* 最小化 */}
                <div
                    onClick={() => window.electronAPI?.windowMinimize()}
                    className="px-3 h-10 flex items-center hover:bg-zinc-800 transition-colors cursor-default text-zinc-500"
                >
                    <Minus size={14} />
                </div>
                {/* 最大化/还原 */}
                <div
                    onClick={() => window.electronAPI?.windowToggleMaximize()}
                    className="px-3 h-10 flex items-center hover:bg-zinc-800 transition-colors cursor-default text-zinc-500"
                >
                    <Square size={isMaximized ? 10 : 12} />
                </div>
                {/* 关闭 */}
                <div
                    onClick={() => window.electronAPI?.windowClose()}
                    className="px-3 h-10 flex items-center hover:bg-red-600 group transition-colors cursor-default text-zinc-500"
                >
                    <X size={14} className="group-hover:text-white" />
                </div>
            </div>
        </div>
    );
};

// ============================================================
// 首页视图
// ============================================================
const HomeView = ({ onOpenSettings, addToast, recentProjects, onAddRecent, onOpenProject }) => {
    const [showRecentProjects, setShowRecentProjects] = useState(false);
    const [showFolderBrowser, setShowFolderBrowser] = useState(false);

    // 核心功能：打开本地文件夹（使用 Electron 原生对话框）
    const handleOpenLocalFolder = async () => {
        if (!window.electronAPI) {
            addToast('Electron API 不可用，请在桌面应用中运行', 'error');
            return;
        }

        const result = await window.electronAPI.openFolderDialog();
        if (!result) return; // 用户取消了选择

        const projectData = {
            name: result.name,
            path: result.path,
            lastOpened: Date.now(),
        };

        onAddRecent(projectData);
        // 选择文件夹后直接进入项目界面
        onOpenProject(projectData);
    };

    // 从浏览器中选择文件夹后的回调
    const handleBrowserFolderSelect = (name, folderPath) => {
        setShowFolderBrowser(false);
        const projectData = {
            name: name,
            path: folderPath,
            lastOpened: Date.now(),
        };
        onAddRecent(projectData);
        addToast(`已打开项目：${name}`);
    };

    // 打开项目：进入项目界面
    const handleOpenProject = (project) => {
        setShowRecentProjects(false);
        // 更新打开时间
        onAddRecent({ ...project, lastOpened: Date.now() });
        // 切换到项目界面
        onOpenProject({ ...project, lastOpened: Date.now() });
    };

    const handleAction = (label) => {
        if (label === 'New Project') {
            handleOpenLocalFolder();
        } else if (label === 'Browse Folder') {
            setShowFolderBrowser(true);
        } else if (label === 'Load Last Project') {
            setShowRecentProjects(true);
        }
    };

    const actions = [
        { icon: <Plus size={20} />, label: 'New Project', desc: '选择文件夹打开' },
        { icon: <History size={20} />, label: 'Load Last Project', desc: '浏览最近的项目' },
    ];

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-40px)] bg-[#0b0b0b] text-zinc-300 px-6 relative">
                {/* 弹窗层 */}
                {showFolderBrowser && (
                    <FolderBrowser
                        onClose={() => setShowFolderBrowser(false)}
                        onSelect={handleBrowserFolderSelect}
                        initialPath="C:\\"
                    />
                )}
                {showRecentProjects && (
                    <RecentProjectsModal
                        onClose={() => setShowRecentProjects(false)}
                        onSelect={(project) => {
                            setShowRecentProjects(false);
                            onAddRecent({ ...project, lastOpened: Date.now() });
                            addToast(`已选择：${project.name}`);
                        }}
                        onOpenInCursor={handleOpenProject}
                        projects={recentProjects}
                    />
                )}

                {/* Logo 区域 */}
                <div className="mb-14 flex flex-col items-start w-full max-w-[720px] animate-slide-in-top">
                    <div className="flex items-center gap-4 mb-2">
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

                {/* 操作卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[720px] mb-16">
                    {actions.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => handleAction(item.label)}
                            className="group flex flex-col items-start p-5 bg-[#141414] border border-zinc-800/40 rounded-xl hover:bg-[#1a1a1a] hover:border-zinc-700/60 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                        >
                            <div className="text-zinc-400 group-hover:text-zinc-200 mb-4 transition-colors">
                                {item.icon}
                            </div>
                            <div className="text-[15px] font-medium text-zinc-300 group-hover:text-white transition-colors">
                                {item.label}
                            </div>
                            <div className="text-[11px] text-zinc-600 mt-1">{item.desc}</div>
                        </div>
                    ))}
                </div>

                {/* 最近项目列表 */}
                <div className="w-full max-w-[720px] animate-slide-in-bottom">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.15em]">Recent projects</h2>
                    </div>
                    <div className="h-[1px] w-full bg-zinc-900" />

                    <div className="mt-4 flex flex-col gap-0.5">
                        {recentProjects.length > 0 ? recentProjects.slice(0, 5).map((proj, i) => (
                            <div
                                key={i}
                                className="group text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer flex items-center justify-between py-2 px-2 rounded hover:bg-zinc-900/50 transition-colors"
                                onClick={() => handleOpenProject(proj)}
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Folder size={13} className="text-blue-400/60 flex-shrink-0" />
                                    <span className="font-medium">{proj.name}</span>
                                    <span className="text-zinc-700 truncate text-[10px]">{proj.path}</span>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.electronAPI?.showInExplorer(proj.path);
                                        }}
                                        className="text-zinc-600 hover:text-zinc-300 p-1"
                                        title="在文件管理器中显示"
                                    >
                                        <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <span className="text-xs text-zinc-700 italic mt-2 px-2">还没有打开过项目，点击上方"New Project"开始吧！</span>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================================
// 设置视图 — 模型管理 + More
// ============================================================
const EMPTY_MODEL = {
    displayName: '', apiKey: '', baseUrl: '', modelName: '',
    sourceType: 'manual', rawSource: '', headers: '{}', extraBody: '{}',
};

const SettingsView = ({ onClose }) => {
    const dialog = useDialog();
    const [activeTab, setActiveTab] = useState('Model');
    const [models, setModels] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_MODEL });
    const [parseMode, setParseMode] = useState(null); // 'curl' | 'python' | null
    const [parseText, setParseText] = useState('');
    const [loading, setLoading] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [autoExecute, setAutoExecute] = useState(false);

    // 加载 Auto 执行配置
    useEffect(() => {
        (async () => {
            const r = await window.electronAPI?.modeConfigGet();
            if (r?.success) setAutoExecute(r.data?.taskExecution?.autoExecute ?? false);
        })();
    }, []);

    const toggleAutoExecute = useCallback(async (val) => {
        setAutoExecute(val);
        const r = await window.electronAPI?.modeConfigGet();
        const cfg = r?.success ? r.data : {};
        cfg.taskExecution = { ...(cfg.taskExecution || {}), autoExecute: val };
        await window.electronAPI?.modeConfigSave(cfg);
    }, []);

    // 加载模型列表
    const loadModels = useCallback(async () => {
        const r = await window.electronAPI?.modelList();
        if (r?.success) setModels(r.data || []);
    }, []);

    useEffect(() => { loadModels(); }, [loadModels]);

    // 选中模型
    const selectModel = (m) => {
        setSelectedId(m.id);
        setForm({
            displayName: m.displayName || '',
            apiKey: m.apiKey || '',
            baseUrl: m.baseUrl || '',
            modelName: m.modelName || '',
            sourceType: m.sourceType || 'manual',
            rawSource: m.rawSource || '',
            headers: typeof m.headers === 'string' ? m.headers : JSON.stringify(m.headers || {}, null, 2),
            extraBody: typeof m.extraBody === 'string' ? m.extraBody : JSON.stringify(m.extraBody || {}, null, 2),
        });
        setDirty(false);
        setParseMode(null);
    };

    // 新建模型
    const handleNew = () => {
        setSelectedId(null);
        setForm({ ...EMPTY_MODEL });
        setDirty(true);
        setParseMode(null);
    };

    // 保存模型
    const handleSave = async () => {
        if (!form.displayName.trim()) { await dialog.alert('显示名称不能为空'); return; }
        setLoading(true);
        let headersObj = {}, extraBodyObj = {};
        try { headersObj = JSON.parse(form.headers || '{}'); } catch (_) { await dialog.alert('请求头 JSON 格式错误'); setLoading(false); return; }
        try { extraBodyObj = JSON.parse(form.extraBody || '{}'); } catch (_) { await dialog.alert('额外请求体 JSON 格式错误'); setLoading(false); return; }
        const payload = { ...form, headers: headersObj, extraBody: extraBodyObj };
        let r;
        if (selectedId) {
            r = await window.electronAPI?.modelUpdate(selectedId, payload);
        } else {
            r = await window.electronAPI?.modelCreate(payload);
        }
        if (r?.success) {
            await loadModels();
            if (!selectedId && r.data?.id) setSelectedId(r.data.id);
            setDirty(false);
        } else {
            await dialog.alert('保存失败：' + (r?.error || '未知错误'));
        }
        setLoading(false);
    };

    // 删除
    const handleDelete = async () => {
        if (!selectedId) return;
        if (!(await dialog.confirm('确定要删除这个模型配置？'))) return;
        const r = await window.electronAPI?.modelDelete(selectedId);
        if (r?.success) {
            setSelectedId(null);
            setForm({ ...EMPTY_MODEL });
            setDirty(false);
            await loadModels();
        } else {
            await dialog.alert('删除失败：' + (r?.error || '未知错误'));
        }
    };

    // 复制
    const handleDuplicate = async () => {
        if (!selectedId) return;
        const r = await window.electronAPI?.modelDuplicate(selectedId);
        if (r?.success) {
            await loadModels();
            if (r.data) selectModel(r.data);
        } else {
            await dialog.alert('复制失败：' + (r?.error || '未知错误'));
        }
    };

    // 解析 cURL/Python
    const handleParse = async () => {
        if (!parseText.trim()) return;
        const r = await window.electronAPI?.modelParse(parseText, parseMode);
        if (r?.success && r.data) {
            setForm(prev => ({
                ...prev,
                baseUrl: r.data.baseUrl || prev.baseUrl,
                apiKey: r.data.apiKey || prev.apiKey,
                modelName: r.data.modelName || prev.modelName,
                sourceType: parseMode,
                rawSource: parseText,
                headers: Object.keys(r.data.headers || {}).length > 0 ? JSON.stringify(r.data.headers, null, 2) : prev.headers,
                extraBody: Object.keys(r.data.extraBody || {}).length > 0 ? JSON.stringify(r.data.extraBody, null, 2) : prev.extraBody,
            }));
            setDirty(true);
            setParseMode(null);
            setParseText('');
        } else {
            await dialog.alert('解析失败：' + (r?.error || '未能提取字段'));
        }
    };

    const updateField = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setDirty(true);
    };

    const InputRow = ({ label, field, type = 'text', mono = false }) => (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{label}</label>
            <input
                className={`bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors ${mono ? 'font-mono' : ''}`}
                type={type}
                value={form[field]}
                onChange={(e) => updateField(field, e.target.value)}
                spellCheck={false}
            />
        </div>
    );

    const menuItems = [
        { id: 'Model', label: 'Model', icon: <Bot size={16} /> },
        { id: 'TaskExecution', label: '任务执行', icon: <Zap size={16} /> },
        { id: 'More', label: '更多功能', icon: <MoreHorizontal size={16} /> },
    ];

    return (
        <div className="fixed inset-0 top-10 bg-[#0b0b0b] z-50 flex animate-fade-in">
            {/* 左侧菜单 */}
            <div className="w-52 border-r border-zinc-900 p-4 flex flex-col bg-[#0d0d0d]">
                <div className="flex items-center justify-between mb-8 px-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">设置</span>
                    <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-600 hover:text-zinc-200">
                        <X size={14} />
                    </button>
                </div>
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === item.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 flex overflow-hidden">
                {activeTab === 'Model' && (
                    <>
                        {/* 模型列表 */}
                        <div className="w-56 border-r border-zinc-900 flex flex-col bg-[#0c0c0c]">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">模型列表</span>
                                <button onClick={handleNew} className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
                                    <PlusCircle size={14} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {models.length === 0 && (
                                    <div className="px-3 py-8 text-center text-[10px] text-zinc-600">
                                        尚未配置模型。
                                        <br />点击 + 添加一个。
                                    </div>
                                )}
                                {models.map(m => (
                                    <div
                                        key={m.id}
                                        className={`px-3 py-2 cursor-pointer text-xs border-b border-zinc-900/50 transition-colors ${selectedId === m.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900/50'
                                            }`}
                                        onClick={() => selectModel(m)}
                                    >
                                        <div className="font-medium truncate">{m.displayName}</div>
                                        <div className="text-[10px] text-zinc-600 truncate mt-0.5">{m.modelName || m.baseUrl || '未配置端点'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 编辑表单 */}
                        <div className="flex-1 overflow-y-auto p-8 bg-[#0b0b0b]">
                            <div className="max-w-lg space-y-5">
                                {/* 标题 + 操作按钮 */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-zinc-100">
                                        {selectedId ? '编辑模型' : '新建模型'}
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        {selectedId && (
                                            <>
                                                <button onClick={handleDuplicate} className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 transition-colors" title="复制">
                                                    <Copy size={14} />
                                                </button>
                                                <button onClick={handleDelete} className="p-1.5 hover:bg-red-900/50 rounded text-zinc-500 hover:text-red-400 transition-colors" title="删除">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Parse 区域 */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setParseMode(parseMode === 'curl' ? null : 'curl'); setParseText(''); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${parseMode === 'curl' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/60 hover:text-zinc-300'
                                            }`}
                                    >
                                        <Terminal size={12} /> 通过 cURL 解析
                                    </button>
                                    <button
                                        onClick={() => { setParseMode(parseMode === 'python' ? null : 'python'); setParseText(''); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${parseMode === 'python' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800/60 hover:text-zinc-300'
                                            }`}
                                    >
                                        <Code2 size={12} /> 通过 Python 解析
                                    </button>
                                </div>

                                {/* Parse 输入区 */}
                                {parseMode && (
                                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-3 space-y-2">
                                        <textarea
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-zinc-600 resize-none h-28"
                                            placeholder={parseMode === 'curl' ? '在此粘贴 cURL 命令...' : '在此粘贴 Python 代码...'}
                                            value={parseText}
                                            onChange={(e) => setParseText(e.target.value)}
                                            spellCheck={false}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleParse}
                                                disabled={!parseText.trim()}
                                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[11px] font-medium rounded-lg transition-colors"
                                            >
                                                解析并填充
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 编辑字段 */}
                                <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 space-y-4">
                                    <InputRow label="显示名称" field="displayName" />
                                    <InputRow label="API Key" field="apiKey" type="password" mono />
                                    <InputRow label="Base URL" field="baseUrl" mono />
                                    <InputRow label="Model Name" field="modelName" mono />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">请求头 (JSON)</label>
                                        <textarea
                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-zinc-600 resize-none h-20"
                                            value={form.headers}
                                            onChange={(e) => updateField('headers', e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">额外请求体 (JSON)</label>
                                        <textarea
                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono outline-none focus:border-zinc-600 resize-none h-20"
                                            value={form.extraBody}
                                            onChange={(e) => updateField('extraBody', e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">原始文本</label>
                                        <textarea
                                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 font-mono outline-none focus:border-zinc-600 resize-none h-16 text-opacity-60"
                                            value={form.rawSource}
                                            onChange={(e) => updateField('rawSource', e.target.value)}
                                            placeholder="原始 cURL/Python 文本（解析器自动填充）"
                                            spellCheck={false}
                                        />
                                    </div>
                                </div>

                                {/* 保存按钮 */}
                                <button
                                    onClick={handleSave}
                                    disabled={loading || !dirty}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    <Save size={14} /> {loading ? '保存中...' : '保存模型'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'TaskExecution' && (
                    <div className="flex-1 p-12">
                        <div className="max-w-lg space-y-6">
                            <h2 className="text-lg font-bold text-zinc-100">任务执行配置</h2>
                            <p className="text-xs text-zinc-500">控制 Agent 模式下步骤的执行方式。</p>

                            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                            <Zap size={14} className="text-amber-400" />
                                            Auto 自动执行
                                        </div>
                                        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                            开启后，Agent 模式下所有文件写入和命令步骤将自动执行，<br />
                                            无需逐步手动确认。关闭则保留手动 Accept / Reject 流程。
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => toggleAutoExecute(!autoExecute)}
                                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${autoExecute ? 'bg-blue-600' : 'bg-zinc-700'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${autoExecute ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                {autoExecute && (
                                    <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg px-3 py-2 text-[10px] text-amber-300 flex items-start gap-2">
                                        <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                                        <span>自动执行已开启 — Agent 回复中的文件修改将立即写入磁盘，请确保你信任当前的 AI 输出。</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] text-zinc-600">配置将持久化保存，重启应用后仍然生效。</p>
                        </div>
                    </div>
                )}

                {activeTab === 'More' && (
                    <div className="flex-1 p-12">
                        <h2 className="text-lg font-bold text-zinc-100 mb-4">更多功能</h2>
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-6">
                            <p className="text-sm text-zinc-400">更多设置将在后续版本中提供。</p>
                            <p className="text-xs text-zinc-600 mt-2">Version 1.0.0 · cursor-launcher</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================
// 主应用组件
// ============================================================
export default function App() {
    const [view, setView] = useState('home'); // 'home' | 'settings' | 'project'
    const [prevView, setPrevView] = useState(null); // 记录进入设置前的视图
    const [toasts, setToasts] = useState([]);
    const [recentProjects, setRecentProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null); // 当前打开的项目
    const [savedProject, setSavedProject] = useState(null); // 进入设置时暂存项目

    // 启动时从本地存储加载最近项目
    useEffect(() => {
        const loadRecent = async () => {
            if (window.electronAPI) {
                const saved = await window.electronAPI.getRecentProjects();
                if (saved && saved.length > 0) {
                    setRecentProjects(saved);
                }
            }
        };
        loadRecent();
    }, []);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const handleAddRecent = async (project) => {
        setRecentProjects(prev => {
            const filtered = prev.filter(p => p.path !== project.path);
            const updated = [project, ...filtered].slice(0, 20);

            if (window.electronAPI) {
                window.electronAPI.saveRecentProjects(updated);
            }

            return updated;
        });
    };

    // 打开项目 → 切换到项目界面
    const handleOpenProject = (project) => {
        setCurrentProject(project);
        setView('project');
        setToasts([]); // 清空历史提示，避免残留
    };

    // 返回首页
    const handleBackToHome = () => {
        setCurrentProject(null);
        setView('home');
    };

    // 如果在项目视图，直接全屏渲染 ProjectView（有自己的标题栏）
    if (view === 'project' && currentProject) {
        return (
            <ProjectView
                project={currentProject}
                onBackToHome={handleBackToHome}
                onOpenSettings={() => { setSavedProject(currentProject); setPrevView('project'); setView('settings'); }}
            />
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30 overflow-hidden">
            <div className="flex flex-col h-screen bg-[#0b0b0b] overflow-hidden">
                <TitleBar />
                <main className="relative flex-1 overflow-hidden">
                    {view === 'home' ? (
                        <HomeView
                            onOpenSettings={() => { setPrevView('home'); setView('settings'); }}
                            addToast={addToast}
                            recentProjects={recentProjects}
                            onAddRecent={handleAddRecent}
                            onOpenProject={handleOpenProject}
                        />
                    ) : (
                        <SettingsView onClose={() => {
                            if (prevView === 'project' && savedProject) {
                                setCurrentProject(savedProject);
                                setSavedProject(null);
                                setView('project');
                            } else {
                                setView('home');
                            }
                            setPrevView(null);
                        }} />
                    )}
                </main>
                <div className="fixed bottom-0 right-0 p-6 flex flex-col gap-2 z-[100]">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
