import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Folder, 
  FolderOpen, 
  Search, 
  GitGraph, 
  Menu, 
  Settings, 
  X, 
  ChevronRight, 
  ChevronDown, 
  Terminal, 
  Play, 
  MoreHorizontal,
  MessageSquare,
  Copy,
  Check,
  LayoutTemplate,
  Bug,
  Files,
  Command,
  Hash,
  Send,
  Infinity, // Agent icon
  ListTree, // Plan icon
  Globe, // Web icon
  Image as ImageIcon, // Image icon
  Mic, // Voice icon
  Brain, // Model icon
  Loader2, // Loading icon
  Cpu,
  ChevronUp,
  Circle // For the loading circle placeholder
} from 'lucide-react';

// --- Types & Data ---

type FileType = 'file' | 'folder';

interface FileNode {
  id: string;
  name: string;
  type: FileType;
  children?: FileNode[];
  content?: string; // Mock content for the file
  language?: string;
  isOpen?: boolean; // For folders
}

// 模拟视频中的文件结构
const initialFileTree: FileNode[] = [
  {
    id: 'root',
    name: 'Dream',
    type: 'folder',
    isOpen: true,
    children: [
      { id: 'folder-cursor', name: '.cursor', type: 'folder', children: [] },
      { 
        id: 'folder-dist', 
        name: 'dist', 
        type: 'folder', 
        children: [
           { id: 'assets', name: 'assets', type: 'folder', children: [] },
           { id: 'index.html', name: 'index.html', type: 'file', language: 'html', content: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Dream Project</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>' }
        ] 
      },
      { id: 'file-commandRunner', name: 'commandRunner.js', type: 'file', language: 'javascript', content: `import { ipcMain } from 'electron';\n\n// Command Runner Service\n// Handles execution of system commands via Electron IPC\n\nexport const commandRunnerService = {\n  init() {\n    ipcMain.handle('run-command', async (event, command) => {\n      console.log(\`Executing command: \${command}\`);\n      return { success: true, output: 'Command executed successfully' };\n    });\n  },\n\n  /**\n   * Cleans up listeners\n   */\n  dispose() {\n    ipcMain.removeHandler('run-command');\n  }\n};\n\n// Start the service\ncommandRunnerService.init();` },
      { id: 'file-preload', name: 'preload.js', type: 'file', language: 'javascript', content: `const { contextBridge, ipcRenderer } = require('electron');\n\ncontextBridge.exposeInMainWorld('electronAPI', {\n  runCommand: (cmd) => ipcRenderer.invoke('run-command', cmd)\n});` },
      { id: 'folder-node_modules', name: 'node_modules', type: 'folder', children: [] },
      { id: 'folder-release', name: 'release', type: 'folder', children: [] },
      { id: 'folder-resources', name: 'resources', type: 'folder', children: [] },
      { id: 'file-gitignore', name: '.gitignore', type: 'file', language: 'plaintext', content: 'node_modules\ndist\n.DS_Store' },
      { id: 'file-eslint', name: 'eslint.config.mjs', type: 'file', language: 'javascript', content: 'export default [\n  { rules: { "no-console": "off" } }\n];' },
      { id: 'file-pkg-lock', name: 'package-lock.json', type: 'file', language: 'json', content: '{\n  "name": "dream-project",\n  "version": "1.0.0",\n  "lockfileVersion": 3\n}' },
      { id: 'file-pkg', name: 'package.json', type: 'file', language: 'json', content: '{\n  "name": "dream-project",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module",\n  "scripts": {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  }\n}' },
      { id: 'file-tsconfig-app', name: 'tsconfig.app.json', type: 'file', language: 'json', content: '{}' },
      { id: 'file-tsconfig-node', name: 'tsconfig.node.json', type: 'file', language: 'json', content: '{}' },
      { id: 'file-vite', name: 'vite.config.ts', type: 'file', language: 'typescript', content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n});` },
    ]
  }
];

// 模拟聊天记录
const initialChatHistory = [
  {
    id: 1,
    role: 'user',
    text: '进入下一步: M6 (终端/任务/Git 集成)\n把: "run_command" 从点发变成真\n正终端执行, 将赋给输出, 带 0 列错'
  },
  {
    id: 2,
    role: 'ai',
    text: 'CommandRunnerService, 开始监听 window.electronAPI 的调用。\n\n```typescript\n// TS ringBuffer.ts (new)\n\nreturn { lines, append, getRecent, clear }\n```\n\n```typescript\n// TS ...mandRunnerService.desktop.ts (new)\n/**\n * ...\n */\n```'
  }
];

// --- Utilities ---

const getFileIcon = (filename: string) => {
  if (filename.endsWith('.js')) return <span className="text-yellow-400 font-bold text-xs mr-2">JS</span>;
  if (filename.endsWith('.ts')) return <span className="text-blue-400 font-bold text-xs mr-2">TS</span>;
  if (filename.endsWith('.json')) return <span className="text-yellow-200 font-bold text-xs mr-2">{}</span>;
  if (filename.endsWith('.html')) return <span className="text-orange-500 font-bold text-xs mr-2">&lt;&gt;</span>;
  if (filename.endsWith('.css')) return <span className="text-blue-300 font-bold text-xs mr-2">#</span>;
  if (filename.startsWith('.git')) return <span className="text-red-400 font-bold text-xs mr-2">git</span>;
  return <FileText size={14} className="text-gray-400 mr-2" />;
};

// --- Helper Components ---

// Tooltip Component
const WithTooltip = ({ 
  children, 
  text, 
  side = 'right',
  offset = 8
}: { 
  children: React.ReactNode; 
  text: string; 
  side?: 'top' | 'right' | 'bottom' | 'left';
  offset?: number;
}) => {
  const positionClasses = {
    top: `bottom-full left-1/2 -translate-x-1/2 mb-2`,
    bottom: `top-full left-1/2 -translate-x-1/2 mt-2`,
    left: `right-full top-1/2 -translate-y-1/2 mr-2`,
    right: `left-full top-1/2 -translate-y-1/2 ml-2`,
  };

  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className={`
        absolute ${positionClasses[side]} 
        hidden group-hover:flex 
        bg-[#202020] border border-[#454545] text-[#cccccc] text-[11px] 
        px-2 py-1 rounded shadow-xl whitespace-nowrap z-[100]
        pointer-events-none select-none
      `}>
        {text}
      </div>
    </div>
  );
};

const BrainIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="text-gray-500"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
);

// --- Components ---

const ActivityBar = () => (
  <div className="w-12 bg-[#333333] flex flex-col items-center py-2 text-[#858585] border-r border-[#1e1e1e] select-none z-20">
    <WithTooltip text="资源管理器 (Ctrl+Shift+E)">
      <div className="p-3 text-white border-l-2 border-white cursor-pointer"><Files size={24} /></div>
    </WithTooltip>
    <WithTooltip text="搜索 (Ctrl+Shift+F)">
      <div className="p-3 hover:text-white cursor-pointer"><Search size={24} /></div>
    </WithTooltip>
    <WithTooltip text="源代码管理 (Ctrl+Shift+G)">
      <div className="p-3 hover:text-white cursor-pointer"><GitGraph size={24} /></div>
    </WithTooltip>
    <WithTooltip text="运行和调试 (Ctrl+Shift+D)">
      <div className="p-3 hover:text-white cursor-pointer"><Bug size={24} /></div>
    </WithTooltip>
    <WithTooltip text="扩展 (Ctrl+Shift+X)">
      <div className="p-3 hover:text-white cursor-pointer"><LayoutTemplate size={24} /></div>
    </WithTooltip>
    <div className="mt-auto">
      <WithTooltip text="管理">
        <div className="p-3 hover:text-white cursor-pointer"><Settings size={24} /></div>
      </WithTooltip>
    </div>
  </div>
);

const SidebarItem = ({ 
  node, 
  depth, 
  onToggle, 
  onSelect, 
  activeFileId 
}: { 
  node: FileNode; 
  depth: number; 
  onToggle: (id: string) => void;
  onSelect: (node: FileNode) => void;
  activeFileId: string | null;
}) => {
  const isSelected = activeFileId === node.id;
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-[#2a2d2e] ${isSelected ? 'bg-[#37373d] text-white' : 'text-[#cccccc]'}`}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        onClick={() => {
          if (node.type === 'folder') onToggle(node.id);
          else onSelect(node);
        }}
      >
        {node.type === 'folder' && (
          <span className="mr-1 text-gray-400">
            {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        {node.type === 'file' && getFileIcon(node.name)}
        <span className="text-[13px] truncate">{node.name}</span>
      </div>
      {node.type === 'folder' && node.isOpen && node.children && (
        <div>
          {node.children.map(child => (
            <SidebarItem 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              onToggle={onToggle}
              onSelect={onSelect}
              activeFileId={activeFileId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ 
  fileTree, 
  onToggle, 
  onSelect, 
  activeFileId 
}: { 
  fileTree: FileNode[]; 
  onToggle: (id: string) => void; 
  onSelect: (node: FileNode) => void;
  activeFileId: string | null;
}) => (
  <div className="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e] h-full text-[#cccccc]">
    <div className="px-4 py-2 text-xs font-bold tracking-wider flex justify-between items-center group cursor-pointer hover:text-white">
      <span>EXPLORER</span>
      <MoreHorizontal size={16} className="opacity-0 group-hover:opacity-100" />
    </div>
    
    <div className="overflow-y-auto flex-1 custom-scrollbar">
      {/* Project Root Header (Simulated Accordion) */}
      <div className="px-1 py-1 font-bold text-xs flex items-center cursor-pointer hover:bg-[#2a2d2e]">
        <ChevronDown size={14} className="mr-1" />
        DREAM
      </div>
      {fileTree[0].children?.map(node => (
        <SidebarItem 
          key={node.id} 
          node={node} 
          depth={1} 
          onToggle={onToggle} 
          onSelect={onSelect}
          activeFileId={activeFileId}
        />
      ))}
    </div>
  </div>
);

const EditorTabs = ({ 
  files, 
  activeId, 
  onSelect, 
  onClose 
}: { 
  files: FileNode[]; 
  activeId: string | null; 
  onSelect: (id: string) => void; 
  onClose: (e: React.MouseEvent, id: string) => void; 
}) => (
  <div className="flex bg-[#252526] overflow-x-auto no-scrollbar h-9">
    {files.map(file => (
      <div 
        key={file.id} 
        className={`
          flex items-center px-3 min-w-[120px] max-w-[200px] text-[13px] border-r border-[#1e1e1e] cursor-pointer group select-none
          ${activeId === file.id ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007fd4]' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#252526]'}
        `}
        onClick={() => onSelect(file.id)}
      >
        <span className="mr-2">{getFileIcon(file.name)}</span>
        <span className="truncate flex-1">{file.name}</span>
        <WithTooltip text="关闭" side="bottom">
          <span 
            className={`ml-2 p-0.5 rounded-md hover:bg-[#444] ${activeId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            onClick={(e) => onClose(e, file.id)}
          >
            <X size={14} />
          </span>
        </WithTooltip>
      </div>
    ))}
  </div>
);

const CodeEditor = ({ file }: { file: FileNode | undefined }) => {
  if (!file) return <div className="flex-1 bg-[#1e1e1e] flex items-center justify-center text-gray-500">No file open</div>;

  const lines = (file.content || '').split('\n');

  return (
    <div className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[14px] overflow-auto relative">
      {/* Breadcrumbs */}
      <div className="sticky top-0 left-0 right-0 bg-[#1e1e1e] px-4 py-1 text-xs text-[#969696] flex items-center shadow-sm z-10">
        <span>Dream</span>
        <ChevronRight size={12} className="mx-1" />
        <span>src</span>
        <ChevronRight size={12} className="mx-1" />
        <span className="text-white">{file.name}</span>
      </div>

      <div className="flex min-h-full p-4 pt-2">
        {/* Line Numbers */}
        <div className="flex flex-col items-end pr-4 text-[#858585] select-none min-w-[40px] text-right">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>
        
        {/* Code Content */}
        <div className="flex-1 whitespace-pre">
          {lines.map((line, i) => (
            <div key={i} className="leading-6 hover:bg-[#262626] w-full">
              {/* Simple Syntax Highlighting Simulation */}
              {line.split(' ').map((word, j) => {
                 let color = '#d4d4d4';
                 if (['import', 'from', 'export', 'const', 'let', 'return', 'async', 'await', 'function', 'class'].includes(word)) color = '#c586c0';
                 else if (['true', 'false', 'null', 'undefined'].includes(word)) color = '#569cd6';
                 else if (word.includes("'") || word.includes('"') || word.includes('`')) color = '#ce9178';
                 else if (word.match(/^[A-Z]/)) color = '#4ec9b0';
                 else if (word.startsWith('//')) color = '#6a9955';
                 else if (word.includes('(') || word.includes(')')) color = '#dcdcaa';
                 
                 // Override for comments (basic)
                 if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
                   return <span key={j} style={{ color: '#6a9955' }}>{word} </span>;
                 }

                 return <span key={j} style={{ color }}>{word} </span>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatMessage = ({ msg }: { msg: { role: string; text: string } }) => {
  const isAi = msg.role === 'ai';
  return (
    <div className={`mb-6 ${isAi ? '' : ''}`}>
      <div className="flex items-center mb-1">
        <div className={`w-5 h-5 rounded flex items-center justify-center mr-2 text-[10px] font-bold ${isAi ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'}`}>
          {isAi ? 'AI' : 'U'}
        </div>
        <span className="font-bold text-xs text-[#cccccc]">{isAi ? 'Cursor' : 'User'}</span>
      </div>
      <div className="pl-7 text-[13px] leading-relaxed text-[#cccccc] markdown-body">
         {/* Simple formatting for demo */}
         {msg.text.split('\n').map((line, i) => {
           if (line.startsWith('```')) return <div key={i} className="bg-[#1e1e1e] p-2 rounded my-2 border border-[#333] font-mono text-xs text-[#9cdcfe]">{line.replace(/```\w*/, '')}</div>;
           return <p key={i} className="min-h-[1em]">{line}</p>;
         })}
      </div>
    </div>
  );
};

const AIPanel = ({ 
  visible, 
  history, 
  onSend,
  onClose
}: { 
  visible: boolean; 
  history: any[]; 
  onSend: (text: string) => void; 
  onClose: () => void;
}) => {
  const [input, setInput] = useState('');
  const [askMenuOpen, setAskMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [currentModel, setCurrentModel] = useState('GPT-5.2');
  const [mode, setMode] = useState<'chat' | 'agent'>('chat'); // 'chat' is default, 'agent' shows review header
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const askMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, visible]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (askMenuRef.current && !askMenuRef.current.contains(event.target as Node)) {
        setAskMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!visible) return null;

  return (
    <div className="w-[350px] bg-[#252526] border-l border-[#1e1e1e] flex flex-col h-full shadow-xl relative z-40">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-[#1e1e1e] bg-[#252526]">
        <span className="text-[11px] uppercase font-bold text-[#cccccc] tracking-wider">UI界面设计文件查询</span>
        <div className="flex items-center gap-2">
           <WithTooltip text="更多操作" side="bottom">
              <MoreHorizontal size={14} className="text-[#cccccc] cursor-pointer hover:text-white" />
           </WithTooltip>
           <WithTooltip text="关闭" side="bottom">
              <X size={14} className="text-[#cccccc] cursor-pointer hover:text-white" onClick={onClose} />
           </WithTooltip>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {history.map(msg => <ChatMessage key={msg.id} msg={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#252526]">
        
        {/* Input Container */}
        <div className="bg-[#1e1e1e] rounded-xl border border-[#333] flex flex-col focus-within:border-[#444] transition-colors shadow-lg">
            
           {/* Top Review Actions (Agent Mode Only) */}
           {mode === 'agent' && (
             <div className="flex justify-end px-3 py-1.5 gap-3 border-b border-[#2a2a2a] items-center">
                <span className="text-[11px] text-[#858585] cursor-pointer hover:text-white transition-colors">Undo All</span>
                <span className="text-[11px] text-[#858585] cursor-pointer hover:text-white transition-colors">Keep All</span>
                <button 
                  className="text-[11px] bg-[#333] text-white px-2 py-0.5 rounded cursor-pointer hover:bg-[#444] border border-[#444]"
                  onClick={() => setMode('chat')} // Allow exiting agent mode
                >
                  Review
                </button>
             </div>
           )}

           {/* Textarea */}
           <textarea 
            className="bg-transparent border-none outline-none text-[13px] text-[#cccccc] resize-none h-16 p-3 placeholder-[#555]"
            placeholder="Plan, @ for context, / for commands"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) {
                  onSend(input);
                  setInput('');
                }
              }
            }}
          />

          {/* Bottom Toolbar */}
          <div className="flex justify-between items-center px-2 py-2">
            
            {/* Left: Mode & Model Selectors */}
            <div className="flex items-center gap-2 relative">
               
               {/* ASK Button & Menu */}
               <div className="relative" ref={askMenuRef}>
                 <WithTooltip text="切换模式" side="top">
                    <button 
                      className="flex items-center gap-1 bg-[#1a2b20] hover:bg-[#203326] px-2 py-1 rounded-md transition-colors border border-[#1e3a29] group"
                      onClick={() => setAskMenuOpen(!askMenuOpen)}
                    >
                      <span className="text-[#4cc38a] font-medium text-[11px] flex items-center gap-1">
                        {mode === 'agent' ? <Infinity size={11} className="text-[#4cc38a]" /> : <MessageSquare size={11} className="text-[#4cc38a]" />}
                        {mode === 'agent' ? 'Agent' : 'Ask'}
                      </span>
                      <ChevronDown size={12} className="text-[#4cc38a] opacity-70" />
                    </button>
                 </WithTooltip>

                 {/* Ask Dropdown */}
                 {askMenuOpen && (
                   <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                      <div 
                        className="flex items-center gap-2 px-3 py-2 text-[#cccccc] hover:bg-[#007fd4] hover:text-white cursor-pointer group"
                        onClick={() => { setMode('agent'); setAskMenuOpen(false); }}
                      >
                        <Infinity size={14} className="text-gray-400 group-hover:text-white" />
                        <div className="flex flex-col">
                           <span className="text-[12px]">Agent</span>
                        </div>
                        <span className="ml-auto text-[10px] text-gray-500 group-hover:text-white opacity-50">Ctrl+I</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 text-[#cccccc] hover:bg-[#007fd4] hover:text-white cursor-pointer group">
                        <ListTree size={14} className="text-gray-400 group-hover:text-white" />
                        <span className="text-[12px]">Plan</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 text-[#cccccc] hover:bg-[#007fd4] hover:text-white cursor-pointer group">
                        <Bug size={14} className="text-gray-400 group-hover:text-white" />
                        <span className="text-[12px]">Debug</span>
                      </div>
                      <div 
                        className="flex items-center gap-2 px-3 py-2 text-[#cccccc] cursor-pointer hover:bg-[#007fd4] hover:text-white"
                        onClick={() => { setMode('chat'); setAskMenuOpen(false); }}
                      >
                        <MessageSquare size={14} className="text-gray-400 group-hover:text-white" />
                        <span className="text-[12px]">Ask</span>
                        {mode === 'chat' && <Check size={12} className="ml-auto text-white" />}
                      </div>
                   </div>
                 )}
               </div>

               {/* Model Selector */}
               <div className="relative" ref={modelMenuRef}>
                 <WithTooltip text="选择模型" side="top">
                    <button 
                      className="flex items-center gap-1 hover:bg-[#2a2a2a] px-2 py-1 rounded transition-colors text-[#858585]"
                      onClick={() => setModelMenuOpen(!modelMenuOpen)}
                    >
                      <span className="text-[11px] text-[#999]">{currentModel}</span>
                      <ChevronDown size={12} />
                    </button>
                 </WithTooltip>

                 {/* Model Dropdown */}
                 {modelMenuOpen && (
                   <div className="absolute bottom-full left-0 mb-2 w-60 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
                      {/* Search */}
                      <div className="p-2 border-b border-[#333]">
                         <input type="text" placeholder="Search models" className="w-full bg-[#1e1e1e] border border-[#333] rounded px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#555] placeholder-[#555]" />
                      </div>
                      {/* Toggles */}
                      <div className="px-3 py-2 border-b border-[#333]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[11px] text-[#ccc]">Auto</span>
                          <div className="w-7 h-4 bg-[#333] rounded-full relative cursor-pointer"><div className="w-3 h-3 bg-[#888] rounded-full absolute left-0.5 top-0.5"></div></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-[#ccc]">MAX Mode</span>
                          <div className="w-7 h-4 bg-[#333] rounded-full relative cursor-pointer"><div className="w-3 h-3 bg-[#888] rounded-full absolute left-0.5 top-0.5"></div></div>
                        </div>
                      </div>
                      {/* Models List */}
                      <div className="py-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                         {['Opus 4.6', 'Opus 4.5', 'Sonnet 4.5', 'GPT-5.3 Codex', 'GPT-5.2', 'Gemini 3 Pro'].map(m => (
                           <div 
                             key={m}
                             className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#007fd4] hover:text-white cursor-pointer group"
                             onClick={() => {
                               setCurrentModel(m);
                               setModelMenuOpen(false);
                             }}
                           >
                              <span className="text-[12px] flex-1 flex items-center gap-2 text-[#ccc] group-hover:text-white">
                                {m} 
                                <BrainIcon />
                              </span>
                              {currentModel === m && <Check size={12} className="text-white" />}
                           </div>
                         ))}
                      </div>
                      {/* Footer */}
                      <div className="p-2 border-t border-[#333] text-[11px] text-[#ccc] hover:bg-[#2a2a2a] cursor-pointer flex justify-between items-center">
                        <span>Add Models</span>
                        <ChevronRight size={12} />
                      </div>
                   </div>
                 )}
               </div>

            </div>

            {/* Right: Action Icons */}
            <div className="flex items-center gap-3">
               <WithTooltip text="加载状态" side="top">
                 <div className="relative group cursor-pointer">
                    <div className="w-3 h-3 rounded-full border-2 border-[#555] border-t-transparent animate-spin opacity-50 hover:opacity-100"></div>
                 </div>
               </WithTooltip>
               <WithTooltip text="从 URL 添加上下文" side="top">
                 <Globe size={14} className="text-[#666] hover:text-[#ccc] cursor-pointer transition-colors" />
               </WithTooltip>
               <WithTooltip text="添加图片" side="top">
                 <ImageIcon size={14} className="text-[#666] hover:text-[#ccc] cursor-pointer transition-colors" />
               </WithTooltip>
               <WithTooltip text="语音输入" side="top">
                 <div className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center cursor-pointer hover:bg-[#444] transition-colors">
                   <Mic size={12} className="text-[#ccc]" />
                 </div>
               </WithTooltip>
            </div>

          </div>
        </div>
        
        <div className="text-[10px] text-[#555] mt-2 text-center select-none">
          AI generated content may be incorrect.
        </div>
      </div>
    </div>
  );
};

const CommandPalette = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  if (!visible) return null;
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center pt-2" onClick={onClose}>
      <div className="w-[600px] h-fit bg-[#252526] rounded-md shadow-2xl border border-[#454545] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-3 py-2 border-b border-[#333]">
           <span className="text-gray-400 mr-2"><ChevronRight size={16} /></span>
           <input 
             autoFocus 
             className="bg-transparent border-none outline-none flex-1 text-white placeholder-gray-500" 
             placeholder="Search files by name..."
           />
        </div>
        <div className="py-2">
          <div className="px-3 py-1 text-xs text-gray-500">recently opened</div>
          <div className="px-3 py-2 hover:bg-[#37373d] cursor-pointer flex justify-between group">
             <span className="text-white text-sm">commandRunner.js</span>
             <span className="text-gray-500 text-xs">src</span>
          </div>
          <div className="px-3 py-2 hover:bg-[#37373d] cursor-pointer flex justify-between group">
             <span className="text-white text-sm">index.html</span>
             <span className="text-gray-500 text-xs">root</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function CursorClone() {
  const [fileTree, setFileTree] = useState(initialFileTree);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([
    initialFileTree[0].children![2] // commandRunner.js default
  ]);
  const [activeFileId, setActiveFileId] = useState<string | null>('file-commandRunner');
  const [chatVisible, setChatVisible] = useState(true);
  const [chatHistory, setChatHistory] = useState(initialChatHistory);
  const [cmdPaletteVisible, setCmdPaletteVisible] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setCmdPaletteVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFolder = (id: string) => {
    const toggleRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) return { ...node, isOpen: !node.isOpen };
        if (node.children) return { ...node, children: toggleRecursive(node.children) };
        return node;
      });
    };
    setFileTree(toggleRecursive(fileTree));
  };

  const openFile = (node: FileNode) => {
    if (!openFiles.find(f => f.id === node.id)) {
      setOpenFiles([...openFiles, node]);
    }
    setActiveFileId(node.id);
  };

  const closeFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f.id !== id);
    setOpenFiles(newOpenFiles);
    if (activeFileId === id) {
      setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null);
    }
  };

  const handleSendMessage = (text: string) => {
    const newMsg = { id: Date.now(), role: 'user', text };
    setChatHistory(prev => [...prev, newMsg]);
    
    // Fake AI Response
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: `I've received your request about: "${text}". \n\nLooking into the codebase...`
      }]);
    }, 1000);
  };

  const activeFile = openFiles.find(f => f.id === activeFileId);

  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#cccccc] overflow-hidden font-sans selection:bg-[#264f78]">
      {/* Top Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <ActivityBar />

        {/* Sidebar */}
        <FileExplorer 
          fileTree={fileTree} 
          onToggle={toggleFolder} 
          onSelect={openFile}
          activeFileId={activeFileId}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {openFiles.length > 0 ? (
            <>
              <EditorTabs 
                files={openFiles} 
                activeId={activeFileId} 
                onSelect={setActiveFileId} 
                onClose={closeFile} 
              />
              <CodeEditor file={activeFile} />
            </>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
               <Command size={64} className="mb-4 opacity-20" />
               <p className="text-sm">Select a file to start editing</p>
               <div className="text-xs mt-4 flex gap-4">
                 <span><span className="bg-[#333] px-1 rounded">Ctrl</span> + <span className="bg-[#333] px-1 rounded">P</span> to search files</span>
               </div>
             </div>
          )}
        </div>

        {/* Right AI Panel */}
        <AIPanel 
          visible={chatVisible} 
          history={chatHistory} 
          onSend={handleSendMessage}
          onClose={() => setChatVisible(false)}
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-xs select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded">
             <GitGraph size={12} />
             <span>main*</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded">
             <X size={12} />
             <span>0</span>
             <div className="w-[1px] h-3 bg-white/40 mx-1"></div>
             <Bug size={12} />
             <span>0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">Ln 12, Col 45</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">UTF-8</span>
          <span className="cursor-pointer hover:bg-white/20 px-1 rounded">{activeFile?.language === 'javascript' ? 'JavaScript' : activeFile?.language === 'typescript' ? 'TypeScript' : 'Plain Text'}</span>
          <div 
             className="cursor-pointer hover:bg-white/20 px-1 rounded flex items-center gap-1"
             onClick={() => setChatVisible(!chatVisible)}
          >
             <MessageSquare size={12} />
             <span>AI Chat</span>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <CommandPalette visible={cmdPaletteVisible} onClose={() => setCmdPaletteVisible(false)} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #424242; 
          border-radius: 5px;
          border: 2px solid #252526;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4f4f4f; 
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}