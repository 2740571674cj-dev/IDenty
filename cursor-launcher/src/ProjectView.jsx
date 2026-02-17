import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useDialog } from './components/DialogProvider';
import { isProjectRelated } from './components/RichAnswerRenderer';
import AskMessageCard from './components/AskMessageCard';
import './styles/chat-theme.css';
import './styles/ask-theme.css';
import {
    FileText, Folder, FolderOpen, Search, GitGraph, Settings, X,
    ChevronRight, ChevronDown, Terminal, Play, MoreHorizontal,
    MessageSquare, Copy, Check, LayoutTemplate, Bug, Files,
    Command, Send, ChevronUp, Minus, Square, Layout, Plus, Clock,
    Loader2, Infinity, Globe, Image as ImageIcon, Mic, ListTree, Brain,
    PanelLeft, PanelBottom, PanelRight, Activity, Download, Filter,
    AlertTriangle, Info, Trash2, FileDown, ClipboardCopy, Edit3, FileCode
} from 'lucide-react';

// ============================================================
// 自定义 SVG 图标（精确匹配 Cursor 布局按钮）
// ============================================================

// 左侧栏布局图标 — 24×24, 1.5px 线宽, 左 1/3 填充
const LayoutSidebarLeftIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.5" stroke={active ? '#c8c8c8' : '#5a5a5a'} strokeWidth="1.5" fill="none" />
        <rect x="3.5" y="5.5" width="5.5" height="13" rx="0.75" fill={active ? '#7a7a7a' : '#3a3a3a'} />
    </svg>
);

// 底部面板布局图标 — 24×24, 1.5px 细线框, 底部 1/3 填充实心色块
const LayoutPanelBottomIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.5" stroke={active ? '#c8c8c8' : '#5a5a5a'} strokeWidth="1.5" fill="none" />
        <rect x="3.5" y="14.5" width="17" height="4" rx="0.75" fill={active ? '#7a7a7a' : '#3a3a3a'} />
    </svg>
);

// 右侧栏布局图标 — 24×24, 1.5px 线宽, 右 1/3 填充
const LayoutSidebarRightIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="1.5" stroke={active ? '#c8c8c8' : '#5a5a5a'} strokeWidth="1.5" fill="none" />
        <rect x="15" y="5.5" width="5.5" height="13" rx="0.75" fill={active ? '#7a7a7a' : '#3a3a3a'} />
    </svg>
);

// BrainIcon 用于模型选择器
const BrainIcon = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#555] inline">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
);

// ============================================================
// 工具函数
// ============================================================

const getFileIcon = (filename) => {
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return <span className="text-yellow-400 font-semibold text-[10px] mr-1.5">JS</span>;
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return <span className="text-blue-400 font-semibold text-[10px] mr-1.5">TS</span>;
    if (filename.endsWith('.json')) return <span className="text-yellow-200 font-semibold text-[10px] mr-1.5">{'{}'}</span>;
    if (filename.endsWith('.html')) return <span className="text-orange-500 font-semibold text-[10px] mr-1.5">&lt;&gt;</span>;
    if (filename.endsWith('.css') || filename.endsWith('.scss')) return <span className="text-blue-300 font-semibold text-[10px] mr-1.5">#</span>;
    if (filename.endsWith('.md')) return <span className="text-gray-300 font-semibold text-[10px] mr-1.5">MD</span>;
    if (filename.endsWith('.py')) return <span className="text-green-400 font-semibold text-[10px] mr-1.5">PY</span>;
    if (filename.startsWith('.git')) return <span className="text-red-400 font-semibold text-[10px] mr-1.5">git</span>;
    return <FileText size={12} className="text-gray-500 mr-1.5 flex-shrink-0" />;
};

const getLanguageDisplay = (filename) => {
    if (!filename) return 'Plain Text';
    const ext = filename.split('.').pop()?.toLowerCase();
    const map = {
        js: 'JavaScript', jsx: 'JavaScript React', ts: 'TypeScript', tsx: 'TypeScript React',
        json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS',
        md: 'Markdown', py: 'Python', yaml: 'YAML', yml: 'YAML',
        xml: 'XML', svg: 'XML', sh: 'Shell Script', bat: 'Batch',
    };
    return map[ext] || 'Plain Text';
};

// 精简 Tooltip
const WithTooltip = ({ children, text, side = 'right' }) => {
    const pos = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
        left: 'right-full top-1/2 -translate-y-1/2 mr-1',
        right: 'left-full top-1/2 -translate-y-1/2 ml-1',
    };
    return (
        <div className="group relative flex items-center justify-center">
            {children}
            <div className={`absolute ${pos[side]} hidden group-hover:flex bg-[#1a1a1a] border border-[#3a3a3a] text-[#bbb] text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-[100] pointer-events-none select-none`}>
                {text}
            </div>
        </div>
    );
};

// ============================================================
// 可拖拽分隔条
// ============================================================
const Resizer = ({ onResize, direction = 'horizontal' }) => {
    const handleMouseDown = (e) => {
        e.preventDefault();
        const startPos = direction === 'horizontal' ? e.clientX : e.clientY;

        const handleMouseMove = (moveEvent) => {
            const delta = (direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY) - startPos;
            onResize(delta, moveEvent);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`${direction === 'horizontal' ? 'w-[3px] cursor-col-resize hover:bg-[#007fd4]' : 'h-[3px] cursor-row-resize hover:bg-[#007fd4]'} bg-transparent transition-colors duration-150 flex-shrink-0 z-30`}
            onMouseDown={handleMouseDown}
        />
    );
};

// ============================================================
// 全局日志服务 (单例 — 挂载到 window 防止 HMR 重复创建)
// ============================================================
if (!window.__globalLogger) {
    let logs = [];
    let listeners = [];
    let idCounter = 0;
    const log = (level, source, message, detail = '') => {
        const entry = { id: ++idCounter, timestamp: new Date(), level, source, message, detail };
        logs.push(entry);
        if (logs.length > 5000) logs = logs.slice(-4000);
        listeners.forEach(fn => fn(entry));
        return entry;
    };
    window.__globalLogger = {
        info: (src, msg, d) => log('info', src, msg, d),
        warn: (src, msg, d) => log('warn', src, msg, d),
        error: (src, msg, d) => log('error', src, msg, d),
        debug: (src, msg, d) => log('debug', src, msg, d),
        success: (src, msg, d) => log('success', src, msg, d),
        getLogs: () => [...logs],
        clear: () => { logs = []; listeners.forEach(fn => fn(null)); },
        subscribe: (fn) => { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; },
    };
    window.__globalLogger.info('System', '应用已启动', new Date().toLocaleString('zh-CN'));
}
const globalLogger = window.__globalLogger;
const notImplemented = (source, action, detail = '') => {
    globalLogger.warn(source, `${action} — 功能未实现，返回空值`, detail);
    return null;
};

// ============================================================
// 全局监测面板
// ============================================================
const MonitorPanel = ({ onClose }) => {
    const [logs, setLogs] = useState(globalLogger.getLogs());
    const [filter, setFilter] = useState('all');
    const [keyword, setKeyword] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
    const [selectMode, setSelectMode] = useState(false);
    const logEndRef = useRef(null);

    useEffect(() => {
        const unsub = globalLogger.subscribe(() => setLogs(globalLogger.getLogs()));
        return unsub;
    }, []);

    useEffect(() => {
        if (autoScroll && logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs, autoScroll]);

    const filteredLogs = logs.filter(l => {
        if (filter !== 'all' && l.level !== filter) return false;
        if (keyword) {
            const kw = keyword.toLowerCase();
            if (!l.message.toLowerCase().includes(kw) && !l.source.toLowerCase().includes(kw) && !(l.detail || '').toLowerCase().includes(kw)) return false;
        }
        return true;
    });

    const getSelectedLogs = () => {
        if (!selectedRange.start || !selectedRange.end) return filteredLogs;
        const s = filteredLogs.findIndex(l => l.id === selectedRange.start);
        const e = filteredLogs.findIndex(l => l.id === selectedRange.end);
        if (s === -1 || e === -1) return filteredLogs;
        const [a, b] = s <= e ? [s, e] : [e, s];
        return filteredLogs.slice(a, b + 1);
    };

    const fmtLogs = (arr) => arr.map(l => {
        const ts = l.timestamp.toLocaleString('zh-CN', { hour12: false });
        return `[${ts}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.detail ? ' | ' + l.detail : ''}`;
    }).join('\n');

    const dlBlob = (blob, name) => {
        const u = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = u; a.download = name; document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(u);
    };

    const handleCopy = () => {
        const t = getSelectedLogs();
        navigator.clipboard?.writeText(fmtLogs(t));
        globalLogger.info('Monitor', `已复制 ${t.length} 条日志`);
    };

    const exportTxt = () => {
        const t = getSelectedLogs();
        dlBlob(new Blob([fmtLogs(t)], { type: 'text/plain;charset=utf-8' }), `logs_${Date.now()}.txt`);
        globalLogger.info('Monitor', `已导出 TXT (${t.length} 条)`);
    };

    const exportPdf = () => {
        const t = getSelectedLogs();
        const html = `<html><head><meta charset="utf-8"><title>日志</title><style>body{font:11px Consolas,monospace;background:#1e1e1e;color:#ccc;padding:20px}.error{color:#f44747}.warn{color:#cca700}.info{color:#3794ff}.debug{color:#888}.success{color:#4ec9b0}h1{font-size:15px;color:#fff;border-bottom:1px solid #333;padding-bottom:6px}.e{padding:2px 0;border-bottom:1px solid #2a2a2a}</style></head><body><h1>IDenty 日志 — ${new Date().toLocaleString('zh-CN')}</h1><p style="color:#888">${t.length} 条</p>${t.map(l => `<div class="e ${l.level}"><span style="color:#666">[${l.timestamp.toLocaleString('zh-CN', { hour12: false })}]</span> <b>[${l.level.toUpperCase()}]</b> <span style="color:#dcdcaa">[${l.source}]</span> ${l.message}${l.detail ? ` | <span style="color:#888">${l.detail}</span>` : ''}</div>`).join('')}</body></html>`;
        const w = window.open('', '_blank');
        w.document.write(html); w.document.close();
        w.onload = () => w.print();
        globalLogger.info('Monitor', `已打开 PDF 打印 (${t.length} 条)`);
    };

    const exportWord = () => {
        const t = getSelectedLogs();
        const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body style="font:10pt Consolas,monospace"><h2>IDenty 日志 — ${new Date().toLocaleString('zh-CN')}</h2><table border="1" cellpadding="3" cellspacing="0" style="border-collapse:collapse;font-size:9pt;width:100%"><tr style="background:#333;color:#fff"><th>时间</th><th>级别</th><th>来源</th><th>消息</th><th>详情</th></tr>${t.map(l => `<tr style="color:${l.level === 'error' ? '#f44747' : l.level === 'warn' ? '#cca700' : '#333'}"><td>${l.timestamp.toLocaleString('zh-CN', { hour12: false })}</td><td>${l.level.toUpperCase()}</td><td>${l.source}</td><td>${l.message}</td><td>${l.detail || ''}</td></tr>`).join('')}</table></body></html>`;
        dlBlob(new Blob([html], { type: 'application/msword' }), `logs_${Date.now()}.doc`);
        globalLogger.info('Monitor', `已导出 Word (${t.length} 条)`);
    };

    const handleLogClick = (id) => {
        if (!selectMode) return;
        if (!selectedRange.start) setSelectedRange({ start: id, end: null });
        else { setSelectedRange(p => ({ ...p, end: id })); setSelectMode(false); }
    };

    const isInRange = (id) => {
        if (!selectedRange.start || !selectedRange.end) return false;
        const ids = filteredLogs.map(l => l.id);
        const s = ids.indexOf(selectedRange.start), e = ids.indexOf(selectedRange.end), i = ids.indexOf(id);
        const [a, b] = s <= e ? [s, e] : [e, s];
        return i >= a && i <= b;
    };

    const lc = { info: { t: 'text-[#3794ff]', bg: 'bg-[#3794ff]/10', i: <Info size={11} /> }, warn: { t: 'text-[#cca700]', bg: 'bg-[#cca700]/10', i: <AlertTriangle size={11} /> }, error: { t: 'text-[#f44747]', bg: 'bg-[#f44747]/15', i: <Bug size={11} /> }, debug: { t: 'text-[#888]', bg: 'bg-[#888]/5', i: <Terminal size={11} /> }, success: { t: 'text-[#4ec9b0]', bg: 'bg-[#4ec9b0]/10', i: <Check size={11} /> } };
    const sts = { total: logs.length, error: logs.filter(l => l.level === 'error').length, warn: logs.filter(l => l.level === 'warn').length, info: logs.filter(l => l.level === 'info').length };
    const fbs = [
        { k: 'all', lb: '全部', c: logs.length },
        { k: 'error', lb: '错误', c: sts.error, cl: 'text-[#f44747]' },
        { k: 'warn', lb: '警告', c: sts.warn, cl: 'text-[#cca700]' },
        { k: 'info', lb: '信息', c: sts.info, cl: 'text-[#3794ff]' },
        { k: 'debug', lb: '调试', c: logs.filter(l => l.level === 'debug').length, cl: 'text-[#888]' },
        { k: 'success', lb: '成功', c: logs.filter(l => l.level === 'success').length, cl: 'text-[#4ec9b0]' },
    ];

    return (
        <div className="flex-1 flex flex-col bg-[#1e1e1e] h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#1e1e1e] flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#4ec9b0]" />
                    <span className="text-[12px] font-semibold text-white">全局监测</span>
                    <span className="text-[10px] text-[#666] ml-1">共 {sts.total} 条</span>
                </div>
                <div className="flex items-center gap-1">
                    <WithTooltip text="清空日志"><div className="p-1 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={() => { globalLogger.clear(); setSelectedRange({ start: null, end: null }); }}><Trash2 size={12} /></div></WithTooltip>
                    <WithTooltip text="关闭"><div className="p-1 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={onClose}><X size={12} /></div></WithTooltip>
                </div>
            </div>

            {/* 统计 */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] border-b border-[#2a2a2a] flex-shrink-0">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f44747]/10 text-[#f44747] text-[10px] font-mono"><Bug size={10} /> {sts.error} 错误</div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#cca700]/10 text-[#cca700] text-[10px] font-mono"><AlertTriangle size={10} /> {sts.warn} 警告</div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#3794ff]/10 text-[#3794ff] text-[10px] font-mono"><Info size={10} /> {sts.info} 信息</div>
                <div className="text-[10px] text-[#555] ml-auto font-mono">显示 {filteredLogs.length}/{logs.length}</div>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center gap-1 px-3 py-1 bg-[#252526] border-b border-[#2a2a2a] flex-shrink-0 flex-wrap">
                <div className="flex items-center gap-0.5 mr-2">
                    {fbs.map(fb => (
                        <button key={fb.k} className={`px-1.5 py-[2px] rounded text-[10px] transition-colors ${filter === fb.k ? 'bg-[#04395e] text-white' : `bg-[#2a2a2a] ${fb.cl || 'text-[#aaa]'} hover:bg-[#333]`}`} onClick={() => setFilter(fb.k)}>
                            {fb.lb}{fb.c > 0 && <span className="opacity-60 ml-0.5">{fb.c}</span>}
                        </button>
                    ))}
                </div>
                <div className="w-px h-4 bg-[#333] mx-1" />
                <div className="flex items-center bg-[#2a2a2a] rounded px-1.5 py-[2px] border border-[#3a3a3a] flex-1 min-w-[120px] max-w-[220px]">
                    <Search size={10} className="text-[#666] mr-1 flex-shrink-0" />
                    <input type="text" className="bg-transparent text-[10px] text-[#ccc] outline-none w-full placeholder-[#555]" placeholder="搜索日志..." value={keyword} onChange={e => setKeyword(e.target.value)} />
                    {keyword && <X size={9} className="text-[#666] cursor-pointer hover:text-white ml-1" onClick={() => setKeyword('')} />}
                </div>
                <div className="w-px h-4 bg-[#333] mx-1" />
                <WithTooltip text={selectMode ? '点击两条日志选择范围' : '选择范围'}>
                    <button className={`px-1.5 py-[2px] rounded text-[10px] ${selectMode ? 'bg-[#04395e] text-white' : 'bg-[#2a2a2a] text-[#aaa] hover:bg-[#333]'}`} onClick={() => { setSelectMode(!selectMode); setSelectedRange({ start: null, end: null }); }}>
                        <ListTree size={10} className="inline mr-0.5" />{selectMode ? '选择中...' : '选择范围'}
                    </button>
                </WithTooltip>
                {selectedRange.start && selectedRange.end && <span className="text-[9px] text-[#4ec9b0]">已选 {getSelectedLogs().length} 条</span>}
                <div className="w-px h-4 bg-[#333] mx-1" />
                <div className="flex items-center gap-0.5">
                    <button className="px-1.5 py-[2px] rounded text-[10px] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white" onClick={handleCopy}><ClipboardCopy size={10} className="inline mr-0.5" />复制</button>
                    <button className="px-1.5 py-[2px] rounded text-[10px] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white" onClick={exportTxt}><FileDown size={10} className="inline mr-0.5" />TXT</button>
                    <button className="px-1.5 py-[2px] rounded text-[10px] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white" onClick={exportPdf}><FileDown size={10} className="inline mr-0.5" />PDF</button>
                    <button className="px-1.5 py-[2px] rounded text-[10px] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white" onClick={exportWord}><FileDown size={10} className="inline mr-0.5" />Word</button>
                </div>
                <div className="ml-auto">
                    <button className={`px-1.5 py-[2px] rounded text-[10px] ${autoScroll ? 'bg-[#04395e] text-white' : 'bg-[#2a2a2a] text-[#666]'}`} onClick={() => setAutoScroll(!autoScroll)}>↓ Auto</button>
                </div>
            </div>

            {/* 日志列表 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#555]"><Activity size={32} className="mb-2 opacity-20" /><span className="text-[11px]">暂无日志</span></div>
                ) : (
                    filteredLogs.map(log => {
                        const c = lc[log.level] || lc.info;
                        const ts = log.timestamp.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const ms = String(log.timestamp.getMilliseconds()).padStart(3, '0');
                        const inR = isInRange(log.id);
                        const isEp = log.id === selectedRange.start || log.id === selectedRange.end;
                        return (
                            <div key={log.id} className={`flex items-start px-3 py-[2px] border-b border-[#1e1e1e] hover:bg-[#2a2d2e] cursor-default ${log.level === 'error' ? 'bg-[#f44747]/8' : ''} ${inR ? 'bg-[#04395e]/30' : ''} ${isEp ? 'ring-1 ring-[#007fd4]' : ''} ${selectMode ? 'cursor-pointer' : ''}`} onClick={() => handleLogClick(log.id)}>
                                <span className="text-[#555] w-[70px] flex-shrink-0 text-[10px]">{ts}.{ms}</span>
                                <span className={`w-[18px] flex-shrink-0 ${c.t}`}>{c.i}</span>
                                <span className={`w-[52px] flex-shrink-0 px-1 rounded text-[9px] font-bold uppercase ${c.t} ${c.bg} text-center leading-[16px]`}>{log.level}</span>
                                <span className="text-[#dcdcaa] w-[90px] flex-shrink-0 truncate text-[10px] px-1">{log.source}</span>
                                <span className={`flex-1 ${log.level === 'error' ? 'text-[#f44747]' : 'text-[#ccc]'}`}>{log.message}</span>
                                {log.detail && <span className="text-[#666] ml-2 text-[10px] truncate max-w-[200px]">{log.detail}</span>}
                            </div>
                        );
                    })
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

// ============================================================
// 左侧活动栏 (高密度 + 监测按钮 + 资源管理器三态)
// ============================================================
const ActivityBar = ({ monitorActive, onToggleMonitor, explorerActive, onExplorerClick, onOpenSettings }) => (
    <div className="w-11 bg-[#333333] flex flex-col items-center py-1 text-[#858585] border-r border-[#1e1e1e] select-none z-20 flex-shrink-0">
        <WithTooltip text="资源管理器 (Ctrl+Shift+E)">
            <div
                className={`p-2.5 cursor-pointer transition-colors ${explorerActive ? 'text-white border-l-2 border-white' : 'hover:text-white'}`}
                onClick={onExplorerClick}
            >
                <Files size={20} />
            </div>
        </WithTooltip>
        <WithTooltip text="搜索 (Ctrl+Shift+F)">
            <div className="p-2.5 hover:text-white cursor-pointer" onClick={() => globalLogger.warn('ActivityBar', '搜索 — 功能未实现，返回空值')}><Search size={20} /></div>
        </WithTooltip>
        <WithTooltip text="源代码管理 (Ctrl+Shift+G)">
            <div className="p-2.5 hover:text-white cursor-pointer" onClick={() => globalLogger.warn('ActivityBar', '源代码管理 — 功能未实现，返回空值')}><GitGraph size={20} /></div>
        </WithTooltip>
        <WithTooltip text="运行和调试 (Ctrl+Shift+D)">
            <div className="p-2.5 hover:text-white cursor-pointer" onClick={() => globalLogger.warn('ActivityBar', '运行和调试 — 功能未实现，返回空值')}><Bug size={20} /></div>
        </WithTooltip>
        <WithTooltip text="扩展 (Ctrl+Shift+X)">
            <div className="p-2.5 hover:text-white cursor-pointer" onClick={() => globalLogger.warn('ActivityBar', '扩展 — 功能未实现，返回空值')}><LayoutTemplate size={20} /></div>
        </WithTooltip>
        <WithTooltip text="全局监测">
            <div className={`p-2.5 cursor-pointer transition-colors ${monitorActive ? 'text-[#4ec9b0] border-l-2 border-[#4ec9b0]' : 'hover:text-white'}`} onClick={onToggleMonitor}>
                <Activity size={20} />
            </div>
        </WithTooltip>
        <div className="mt-auto">
            <WithTooltip text="管理">
                <div className="p-2.5 hover:text-white cursor-pointer" onClick={() => { globalLogger.info('ActivityBar', '打开设置页'); onOpenSettings?.(); }}><Settings size={20} /></div>
            </WithTooltip>
        </div>
    </div>
);

// ============================================================
// 右键上下文菜单
// ============================================================
const ContextMenu = ({ x, y, items, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('contextmenu', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('contextmenu', handler);
        };
    }, [onClose]);

    // 自动调整位置防止溢出
    useEffect(() => {
        if (!menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        if (rect.right > window.innerWidth) menuRef.current.style.left = `${window.innerWidth - rect.width - 4}px`;
        if (rect.bottom > window.innerHeight) menuRef.current.style.top = `${window.innerHeight - rect.height - 4}px`;
    }, [x, y]);

    return (
        <div
            ref={menuRef}
            className="fixed bg-[#252526] border border-[#3a3a3a] rounded-[3px] shadow-2xl py-[3px] z-[200] min-w-[200px] select-none"
            style={{ left: x, top: y }}
        >
            {items.map((item, i) => {
                if (item.type === 'separator') {
                    return <div key={i} className="h-[1px] bg-[#3a3a3a] my-[3px] mx-2" />;
                }
                return (
                    <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-[3px] text-[12px] cursor-pointer transition-colors ${item.disabled
                            ? 'text-[#555] cursor-default'
                            : 'text-[#ccc] hover:bg-[#04395e] hover:text-white'
                            }`}
                        onClick={() => {
                            if (item.disabled) {
                                globalLogger.warn('ContextMenu', `${item.label} — 当前为禁用状态，返回空值`);
                                return;
                            }
                            if (typeof item.action === 'function') {
                                item.action();
                            } else {
                                notImplemented('ContextMenu', item.label);
                            }
                            onClose();
                        }}
                    >
                        <span>{item.label}</span>
                        {item.shortcut && (
                            <span className={`text-[11px] ml-6 ${item.disabled ? 'text-[#444]' : 'text-[#888]'}`}>{item.shortcut}</span>
                        )}
                    </div>
                );

            })}
        </div>
    );
};

// 文件夹右键菜单项 — 绑定真实 Electron API
const getFolderContextMenu = (node, { onRefresh, projectPath, onOpenFile, onStartRename, dialog }) => {
    const dirPath = node.path || node.id;
    return [
        {
            label: '新建文件...', action: async () => {
                const name = await dialog.prompt('请输入新文件名：');
                if (!name) return;
                globalLogger.info('ContextMenu', '新建文件', name);
                const sep = dirPath.includes('/') ? '/' : '\\';
                const filePath = dirPath + sep + name;
                window.electronAPI?.createFile(filePath).then(r => {
                    if (r.success) { globalLogger.success('FileSystem', '文件创建成功', filePath); onRefresh(); }
                    else { globalLogger.error('FileSystem', '文件创建失败', r.error); dialog.alert('创建失败：' + r.error); }
                });
            }
        },
        {
            label: '新建文件夹...', action: async () => {
                const name = await dialog.prompt('请输入新文件夹名：');
                if (!name) return;
                globalLogger.info('ContextMenu', '新建文件夹', name);
                const sep = dirPath.includes('/') ? '/' : '\\';
                const folderPath = dirPath + sep + name;
                window.electronAPI?.createFolder(folderPath).then(r => {
                    if (r.success) { globalLogger.success('FileSystem', '文件夹创建成功', folderPath); onRefresh(); }
                    else { globalLogger.error('FileSystem', '文件夹创建失败', r.error); dialog.alert('创建失败：' + r.error); }
                });
            }
        },
        { type: 'separator' },
        {
            label: 'Reveal in File Explorer', shortcut: 'Shift+Alt+R',
            action: () => { globalLogger.info('ContextMenu', 'Reveal in Explorer', dirPath); window.electronAPI?.showInExplorer(dirPath); }
        },
        {
            label: '在集成终端中打开',
            action: () => { globalLogger.info('ContextMenu', '在终端中打开', dirPath); window.electronAPI?.openTerminal(dirPath); }
        },
        { type: 'separator' },
        { label: 'Add Directory to Cursor Chat', action: () => { globalLogger.warn('ContextMenu', 'Add Directory to Cursor Chat — 功能未实现，返回空值'); } },
        { label: 'Add Directory to New Cursor Chat', action: () => { globalLogger.warn('ContextMenu', 'Add Directory to New Cursor Chat — 功能未实现，返回空值'); } },
        { type: 'separator' },
        { label: '在文件夹中查找...', shortcut: 'Shift+Alt+F', action: () => { globalLogger.warn('ContextMenu', '在文件夹中查找 — 功能未实现，返回空值'); } },
        { type: 'separator' },
        {
            label: '剪切', shortcut: 'Ctrl+X',
            action: () => { globalLogger.info('ContextMenu', '剪切路径', dirPath); navigator.clipboard?.writeText(dirPath); }
        },
        {
            label: '复制', shortcut: 'Ctrl+C',
            action: () => { globalLogger.info('ContextMenu', '复制路径', dirPath); navigator.clipboard?.writeText(dirPath); }
        },
        { label: '粘贴', shortcut: 'Ctrl+V', disabled: true, action: () => { globalLogger.warn('ContextMenu', '粘贴 — 功能未实现，返回空值'); } },
        { type: 'separator' },
        {
            label: '复制路径', shortcut: 'Shift+Alt+C',
            action: () => { globalLogger.info('ContextMenu', '复制绝对路径', dirPath); navigator.clipboard?.writeText(dirPath); }
        },
        {
            label: '复制相对路径', shortcut: 'Ctrl+M Ctrl+Shift+C',
            action: () => {
                const rel = projectPath && dirPath.startsWith(projectPath) ? dirPath.slice(projectPath.length + 1) : dirPath;
                globalLogger.info('ContextMenu', '复制相对路径', rel);
                navigator.clipboard?.writeText(rel);
            }
        },
        { type: 'separator' },
        {
            label: '重命名...', shortcut: 'F2',
            action: () => {
                globalLogger.info('ContextMenu', '触发内联重命名', node.name);
                onStartRename?.(node);
            }
        },
        {
            label: '删除', shortcut: 'Delete',
            action: async () => {
                if (!(await dialog.confirm('确定要删除文件夹 "' + node.name + '" 及其所有内容？'))) return;
                globalLogger.info('ContextMenu', '删除文件夹', node.name);
                window.electronAPI?.deleteItem(dirPath).then(async r => {
                    if (r.success) { globalLogger.success('FileSystem', '文件夹删除成功', node.name); onRefresh(); }
                    else { globalLogger.error('FileSystem', '删除失败', r.error); await dialog.alert('删除失败：' + r.error); }
                });
            }
        },
    ];
};

// 文件右键菜单项 — 绑定真实 Electron API
const getFileContextMenu = (node, { onRefresh, projectPath, onOpenFile, onStartRename, dialog }) => {
    const filePath = node.path || node.id;
    return [
        {
            label: '在侧边打开', shortcut: 'Ctrl+↩',
            action: () => { globalLogger.info('ContextMenu', '在侧边打开文件', node.name); onOpenFile?.(node); }
        },
        { label: '打开方式...', action: () => { globalLogger.warn('ContextMenu', '打开方式 — 功能未实现，返回空值'); } },
        {
            label: 'Reveal in File Explorer', shortcut: 'Shift+Alt+R',
            action: () => { globalLogger.info('ContextMenu', 'Reveal in Explorer', filePath); window.electronAPI?.showInExplorer(filePath); }
        },
        {
            label: '在集成终端中打开',
            action: () => {
                const sep = filePath.includes('/') ? '/' : '\\';
                const parentDir = filePath.substring(0, filePath.lastIndexOf(sep));
                globalLogger.info('ContextMenu', '在终端中打开', parentDir);
                window.electronAPI?.openTerminal(parentDir);
            }
        },
        { type: 'separator' },
        { label: '选择以进行比较', action: () => { globalLogger.warn('ContextMenu', '选择以进行比较 — 功能未实现，返回空值'); } },
        { type: 'separator' },
        { label: 'Add File to Cursor Chat', action: () => { globalLogger.warn('ContextMenu', 'Add File to Cursor Chat — 功能未实现，返回空值'); } },
        { label: 'Add File to New Cursor Chat', action: () => { globalLogger.warn('ContextMenu', 'Add File to New Cursor Chat — 功能未实现，返回空值'); } },
        { type: 'separator' },
        { label: '打开时间线', action: () => { globalLogger.warn('ContextMenu', '打开时间线 — 功能未实现，返回空值'); } },
        { type: 'separator' },
        {
            label: '剪切', shortcut: 'Ctrl+X',
            action: () => { globalLogger.info('ContextMenu', '剪切文件路径', filePath); navigator.clipboard?.writeText(filePath); }
        },
        {
            label: '复制', shortcut: 'Ctrl+C',
            action: () => { globalLogger.info('ContextMenu', '复制文件路径', filePath); navigator.clipboard?.writeText(filePath); }
        },
        { type: 'separator' },
        {
            label: '复制路径', shortcut: 'Shift+Alt+C',
            action: () => { globalLogger.info('ContextMenu', '复制文件绝对路径', filePath); navigator.clipboard?.writeText(filePath); }
        },
        {
            label: '复制相对路径', shortcut: 'Ctrl+M Ctrl+Shift+C',
            action: () => {
                const rel = projectPath && filePath.startsWith(projectPath) ? filePath.slice(projectPath.length + 1) : filePath;
                globalLogger.info('ContextMenu', '复制文件相对路径', rel);
                navigator.clipboard?.writeText(rel);
            }
        },
        { type: 'separator' },
        {
            label: '重命名...', shortcut: 'F2',
            action: () => {
                globalLogger.info('ContextMenu', '触发内联重命名', node.name);
                onStartRename?.(node);
            }
        },
        {
            label: '删除', shortcut: 'Delete',
            action: async () => {
                if (!(await dialog.confirm('确定要删除文件 "' + node.name + '"？'))) return;
                globalLogger.info('ContextMenu', '删除文件', node.name);
                window.electronAPI?.deleteItem(filePath).then(async r => {
                    if (r.success) { globalLogger.success('FileSystem', '文件删除成功', node.name); onRefresh(); }
                    else { globalLogger.error('FileSystem', '文件删除失败', r.error); await dialog.alert('删除失败：' + r.error); }
                });
            }
        },
    ];
};

// ============================================================
// 非法文件名字符校验
// ============================================================
const INVALID_NAME_CHARS = /[\\/:*?"<>|]/;
const validateFileName = (name) => {
    if (!name || !name.trim()) return '名称不能为空';
    if (INVALID_NAME_CHARS.test(name)) return '名称包含非法字符 (\\/:*?"<>|)';
    if (name.trim() !== name) return '名称首尾不能有空格';
    return null;
};

// ============================================================
// 文件树节点 (高密度 + 内联重命名)
// ============================================================
const SidebarItem = ({ node, depth, onToggle, onSelect, activeFileId, onRefresh, projectPath }) => {
    const dialog = useDialog();
    const isSelected = activeFileId === node.id;
    const [contextMenu, setContextMenu] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef(null);

    // 启动内联重命名
    const startRename = useCallback((targetNode) => {
        setIsRenaming(true);
        // 文件名：默认选中不含扩展名的部分
        setRenameValue(targetNode.name);
        globalLogger.debug('Rename', '进入编辑态', targetNode.name);
    }, []);

    // 确认重命名 — 完整校验 + 真实 IPC
    const confirmRename = useCallback(async () => {
        const newName = renameValue.trim();
        const nodePath = node.path || node.id;
        const sep = nodePath.includes('/') ? '/' : '\\';
        const parentDir = nodePath.substring(0, nodePath.lastIndexOf(sep));

        // 校验：同名跳过
        if (newName === node.name) {
            globalLogger.debug('Rename', '名称未变更，取消重命名', node.name);
            setIsRenaming(false);
            return;
        }

        // 校验：格式检查
        const err = validateFileName(newName);
        if (err) {
            globalLogger.error('Rename', `校验失败：${err}`, newName);
            // 输入框闪红提示但不退出编辑态，让用户可以修正
            if (renameInputRef.current) {
                renameInputRef.current.style.outline = '1px solid #f44';
                setTimeout(() => {
                    if (renameInputRef.current) renameInputRef.current.style.outline = '1px solid #007acc';
                }, 800);
            }
            return;
        }

        const newPath = parentDir + sep + newName;
        globalLogger.info('Rename', `提交重命名：${node.name} → ${newName}`, nodePath);

        try {
            const r = await window.electronAPI?.rename(nodePath, newPath);
            if (r?.success) {
                globalLogger.success('Rename', `重命名成功：${node.name} → ${newName}`, newPath);
                setIsRenaming(false);
                onRefresh();
            } else {
                const codeMap = { E_EXISTS: '目标已存在', E_NOT_FOUND: '源文件不存在', E_LOCKED: '文件被占用' };
                const msg = codeMap[r?.code] || r?.error || '未知错误';
                globalLogger.error('Rename', `重命名失败 [${r?.code || 'E_UNKNOWN'}]`, msg);
                if (renameInputRef.current) {
                    renameInputRef.current.style.outline = '1px solid #f44';
                    setTimeout(() => {
                        if (renameInputRef.current) renameInputRef.current.style.outline = '1px solid #007acc';
                    }, 1200);
                }
            }
        } catch (ex) {
            globalLogger.error('Rename', 'IPC 异常', ex?.message || String(ex));
            setIsRenaming(false);
        }
    }, [renameValue, node, onRefresh]);

    // 取消重命名
    const cancelRename = useCallback(() => {
        globalLogger.debug('Rename', '取消重命名', node.name);
        setIsRenaming(false);
        setRenameValue('');
    }, [node.name]);

    // 键盘事件
    const handleRenameKeyDown = useCallback((e) => {
        if (e.key === 'Enter') { e.preventDefault(); confirmRename(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
    }, [confirmRename, cancelRename]);

    // 编辑框挂载后自动选中文件名(不含扩展名)
    useEffect(() => {
        if (isRenaming && renameInputRef.current) {
            renameInputRef.current.focus();
            const dotIndex = node.type === 'file' ? renameValue.lastIndexOf('.') : -1;
            if (dotIndex > 0) {
                renameInputRef.current.setSelectionRange(0, dotIndex);
            } else {
                renameInputRef.current.select();
            }
        }
    }, [isRenaming, renameValue, node.type]);

    const ctx = { onRefresh, projectPath, onOpenFile: onSelect, onStartRename: startRename, dialog };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const items = node.type === 'folder' ? getFolderContextMenu(node, ctx) : getFileContextMenu(node, ctx);
        setContextMenu({ x: e.clientX, y: e.clientY, items });
    };

    return (
        <div className="select-none">
            <div
                className={`flex items-center py-[2px] px-1 cursor-pointer hover:bg-[#2a2d2e] ${isSelected ? 'bg-[#37373d] text-white' : 'text-[#ccc]'}`}
                style={{ paddingLeft: `${depth * 10 + 8}px` }}
                onClick={() => {
                    if (isRenaming) return; // 编辑态下不触发常规点击
                    if (node.type === 'folder') onToggle(node.id);
                    else onSelect(node);
                }}
                onContextMenu={handleContextMenu}
                onDoubleClick={(e) => {
                    if (node.type === 'file') { e.stopPropagation(); startRename(node); }
                }}
            >
                {node.type === 'folder' && (
                    <span className="mr-0.5 text-gray-500">
                        {node.isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                )}
                {node.type === 'file' && getFileIcon(node.name)}

                {isRenaming ? (
                    <input
                        ref={renameInputRef}
                        className="text-[12px] leading-tight bg-[#3c3c3c] text-white px-1 py-0 border-0 rounded-sm flex-1 min-w-0"
                        style={{ outline: '1px solid #007acc', fontFamily: 'inherit' }}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={cancelRename}
                        onClick={(e) => e.stopPropagation()}
                        spellCheck={false}
                    />
                ) : (
                    <span className="text-[12px] truncate leading-tight">{node.name}</span>
                )}
            </div>
            {node.type === 'folder' && node.isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <SidebarItem key={child.id} node={child} depth={depth + 1} onToggle={onToggle} onSelect={onSelect} activeFileId={activeFileId} onRefresh={onRefresh} projectPath={projectPath} />
                    ))}
                </div>
            )}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenu.items}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

// ============================================================
// 文件资源管理器 (含标题栏菜单)
// ============================================================
const FileExplorer = ({ fileTree, onToggle, onSelect, activeFileId, projectName, style, onRefresh, projectPath, onCollapseAll, onNewFile, onNewFolder }) => {
    const dialog = useDialog();
    const [menuOpen, setMenuOpen] = useState(false);
    const [rootCollapsed, setRootCollapsed] = useState(false);
    const menuBtnRef = useRef(null);

    const explorerMenuItems = [
        {
            label: '新建文件...', action: async () => {
                const name = await dialog.prompt('请输入新文件名：');
                if (!name) return;
                globalLogger.info('ExplorerMenu', '新建文件', name);
                onNewFile?.(name);
            }
        },
        {
            label: '新建文件夹...', action: async () => {
                const name = await dialog.prompt('请输入新文件夹名：');
                if (!name) return;
                globalLogger.info('ExplorerMenu', '新建文件夹', name);
                onNewFolder?.(name);
            }
        },
        { type: 'separator' },
        {
            label: '刷新文件树', action: () => {
                globalLogger.info('ExplorerMenu', '刷新文件树');
                onRefresh?.();
            }
        },
        {
            label: '全部折叠', action: () => {
                globalLogger.info('ExplorerMenu', '全部折叠');
                onCollapseAll?.();
            }
        },
    ];

    return (
        <div className="bg-[#252526] flex flex-col border-r border-[#1e1e1e] h-full text-[#ccc] overflow-hidden flex-shrink-0" style={style}>
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider flex justify-between items-center group cursor-pointer hover:text-white uppercase">
                <span>Explorer</span>
                <div ref={menuBtnRef} onClick={(e) => { e.stopPropagation(); setMenuOpen(true); globalLogger.info('Explorer', '打开标题栏菜单'); }}>
                    <MoreHorizontal size={14} className="opacity-0 group-hover:opacity-100 hover:text-white" />
                </div>
            </div>
            {menuOpen && menuBtnRef.current && (
                <ContextMenu
                    x={menuBtnRef.current.getBoundingClientRect().right}
                    y={menuBtnRef.current.getBoundingClientRect().bottom + 2}
                    items={explorerMenuItems}
                    onClose={() => setMenuOpen(false)}
                />
            )}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div
                    className="px-1 py-0.5 font-bold text-[10px] flex items-center cursor-pointer hover:bg-[#2a2d2e] uppercase tracking-wide"
                    onClick={() => { setRootCollapsed(prev => !prev); globalLogger.info('Explorer', rootCollapsed ? '展开项目根' : '折叠项目根', projectName); }}
                >
                    {rootCollapsed ? <ChevronRight size={12} className="mr-0.5" /> : <ChevronDown size={12} className="mr-0.5" />}
                    {projectName}
                </div>
                {!rootCollapsed && fileTree.length > 0 && fileTree[0].children?.map(node => (
                    <SidebarItem key={node.id} node={node} depth={1} onToggle={onToggle} onSelect={onSelect} activeFileId={activeFileId} onRefresh={onRefresh} projectPath={projectPath} />
                ))}
            </div>
        </div>
    );
};

// ============================================================
// 编辑器标签栏 (紧凑)
// ============================================================
const EditorTabs = ({ files, activeId, onSelect, onClose }) => (
    <div className="flex bg-[#252526] overflow-x-auto h-[30px]" style={{ scrollbarWidth: 'none' }}>
        {files.map(file => (
            <div
                key={file.id}
                className={`flex items-center px-2.5 min-w-[100px] max-w-[180px] text-[11px] border-r border-[#1e1e1e] cursor-pointer group select-none
                    ${activeId === file.id ? 'bg-[#1e1e1e] text-white border-t border-t-[#007fd4]' : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#252526]'}`}
                onClick={() => onSelect(file.id)}
            >
                <span className="mr-1.5">{getFileIcon(file.name)}</span>
                <span className="truncate flex-1 text-[11px]">{file.name}</span>
                <span
                    className={`ml-1.5 p-0.5 rounded hover:bg-[#444] ${activeId === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => onClose(e, file.id)}
                >
                    <X size={12} />
                </span>
            </div>
        ))}
    </div>
);

// ============================================================
// 代码编辑器 (高密度，行高更紧凑)
// ============================================================
const CodeEditor = ({ file, content, projectName }) => {
    if (!file) {
        return (
            <div className="flex-1 bg-[#1e1e1e] flex flex-col items-center justify-center text-gray-600">
                <Command size={48} className="mb-3 opacity-15" />
                <p className="text-[11px]">选择一个文件开始编辑</p>
                <div className="text-[10px] mt-3 flex gap-3 text-gray-700">
                    <span><span className="bg-[#333] px-1 rounded text-[9px]">Ctrl</span> + <span className="bg-[#333] px-1 rounded text-[9px]">P</span> 搜索文件</span>
                </div>
            </div>
        );
    }

    const lines = (content || '').split('\n');

    const highlightLine = (line) => {
        return line.split(' ').map((word, j) => {
            let color = '#d4d4d4';
            if (['import', 'from', 'export', 'const', 'let', 'var', 'return', 'async', 'await', 'function', 'class', 'if', 'else', 'for', 'while', 'new', 'try', 'catch', 'throw', 'default', 'switch', 'case', 'break', 'continue'].includes(word)) color = '#c586c0';
            else if (['true', 'false', 'null', 'undefined', 'NaN'].includes(word)) color = '#569cd6';
            else if (word.includes("'") || word.includes('"') || word.includes('`')) color = '#ce9178';
            else if (word.match(/^[A-Z]/)) color = '#4ec9b0';
            else if (word.startsWith('//')) color = '#6a9955';
            else if (word.includes('(') || word.includes(')')) color = '#dcdcaa';
            if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.trim().startsWith('/*')) {
                return <span key={j} style={{ color: '#6a9955' }}>{word} </span>;
            }
            return <span key={j} style={{ color }}>{word} </span>;
        });
    };

    const breadcrumbs = file.path ? file.path.split('\\').slice(-3) : [file.name];

    return (
        <div className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[12px] overflow-auto relative">
            {/* 面包屑导航 */}
            <div className="sticky top-0 left-0 right-0 bg-[#1e1e1e] px-3 py-0.5 text-[10px] text-[#969696] flex items-center z-10 border-b border-[#1e1e1e]">
                {breadcrumbs.map((part, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <ChevronRight size={10} className="mx-0.5 text-[#555]" />}
                        <span className={i === breadcrumbs.length - 1 ? 'text-[#ccc]' : ''}>{part}</span>
                    </React.Fragment>
                ))}
            </div>
            <div className="flex min-h-full p-2 pt-1">
                <div className="flex flex-col items-end pr-3 text-[#5a5a5a] select-none min-w-[32px] text-right text-[11px]">
                    {lines.map((_, i) => (
                        <div key={i} className="leading-[18px]">{i + 1}</div>
                    ))}
                </div>
                <div className="flex-1 whitespace-pre overflow-x-auto">
                    {lines.map((line, i) => (
                        <div key={i} className="leading-[18px] hover:bg-[#262626] w-full">
                            {highlightLine(line)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// 历史会话面板
// ============================================================
const HistoryPanel = ({ sessions, activeId, onSelect, onRename, onDelete, onClose }) => {
    const dialog = useDialog();
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
    const handleRenameStart = (s) => { setEditingId(s.id); setEditTitle(s.title); };
    const handleRenameConfirm = () => { if (editTitle.trim() && editingId) onRename(editingId, editTitle.trim()); setEditingId(null); };
    return (
        <div className="absolute inset-0 bg-[#1e1e1e] z-50 flex flex-col animate-fade-in">
            <div className="h-[28px] flex items-center justify-between px-2 border-b border-[#333] flex-shrink-0">
                <span className="text-[10px] uppercase font-semibold text-[#999] tracking-wider">历史会话</span>
                <div className="p-[3px] rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={onClose}><X size={14} /></div>
            </div>
            <div className="px-2 py-1.5">
                <input type="text" className="w-full bg-[#141414] border border-[#2a2a2a] rounded px-2 py-1 text-[10px] text-[#ccc] outline-none focus:border-[#444] placeholder-[#444]" placeholder="搜索会话..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filtered.length === 0 ? (
                    <div className="px-3 py-6 text-center text-[10px] text-[#555]">{search ? '未找到匹配的会话' : '暂无历史会话'}</div>
                ) : filtered.map(s => (
                    <div key={s.id} className={`px-2 py-1.5 flex items-center gap-1 border-b border-[#252525] cursor-pointer transition-colors group ${s.id === activeId ? 'bg-[#2a2d2e]' : 'hover:bg-[#252525]'}`} onClick={() => { onSelect(s.id); onClose(); }}>
                        <div className="flex-1 min-w-0">
                            {editingId === s.id ? (
                                <input className="w-full bg-[#141414] border border-[#444] rounded px-1 py-0.5 text-[10px] text-[#ccc] outline-none" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={handleRenameConfirm} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setEditingId(null); }} onClick={(e) => e.stopPropagation()} autoFocus />
                            ) : (
                                <>
                                    <div className="text-[10px] text-[#bbb] truncate">{s.title}</div>
                                    <div className="text-[9px] text-[#555] mt-0.5 flex gap-2"><span>{s.messageCount || 0} 条消息</span><span>{new Date(s.updatedAt).toLocaleDateString('zh-CN')}</span></div>
                                </>
                            )}
                        </div>
                        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="p-0.5 rounded hover:bg-[#333] text-[#666] hover:text-[#aaa] cursor-pointer" onClick={() => handleRenameStart(s)}><Edit3 size={10} /></div>
                            <div className="p-0.5 rounded hover:bg-[#3a1a1a] text-[#666] hover:text-red-400 cursor-pointer" onClick={async () => { if (await dialog.confirm(`确定删除会话「${s.title}」？`)) onDelete(s.id); }}><Trash2 size={10} /></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================
// 更多操作菜单
// ============================================================
const MoreActionsMenu = ({ onRename, onClear, onExportJSON, onExportTXT, onDelete, onClose }) => {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);
    const items = [
        { label: '重命名会话', icon: <Edit3 size={12} />, action: onRename },
        { label: '清空消息', icon: <Trash2 size={12} />, action: onClear, warn: true },
        { divider: true },
        { label: '导出为 JSON', icon: <FileCode size={12} />, action: onExportJSON },
        { label: '导出为 TXT', icon: <FileText size={12} />, action: onExportTXT },
        { divider: true },
        { label: '删除此会话', icon: <Trash2 size={12} />, action: onDelete, danger: true },
    ];
    return (
        <div ref={ref} className="absolute top-[28px] right-1 w-[160px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-xl z-50 py-0.5 animate-fade-in">
            {items.map((item, i) => item.divider ? (
                <div key={i} className="border-t border-[#252525] my-0.5" />
            ) : (
                <div key={i} className={`flex items-center gap-2 px-2.5 py-[5px] cursor-pointer text-[10px] transition-colors ${item.danger ? 'text-red-400 hover:bg-red-900/30' : item.warn ? 'text-yellow-400 hover:bg-yellow-900/20' : 'text-[#bbb] hover:bg-[#252525] hover:text-white'}`} onClick={() => { item.action(); onClose(); }}>
                    {item.icon}<span>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

// ============================================================
// AI 聊天面板 (精致弹窗，紧凑排版)
// ============================================================
const AIPanel = ({ history, onSend, onClose, sessionTitle, onNewChat, onOpenHistory, onOpenMoreActions, historyOpen, moreActionsOpen, sessions, activeSessionId, onSelectSession, onRenameSession, onDeleteSession, onCloseHistory, onCloseMoreActions, onRenameCurrentSession, onClearMessages, onExportJSON, onExportTXT, onDeleteCurrentSession, chatMode, onModeChange, isGenerating, generatingStartTime, onStopGeneration, projectPath, autoExecute, onStepApplied, onEditMessage }) => {
    const [input, setInput] = useState('');
    const [askMenuOpen, setAskMenuOpen] = useState(false);
    const [modelMenuOpen, setModelMenuOpen] = useState(false);
    const [savedModels, setSavedModels] = useState([]);
    const [currentModel, setCurrentModel] = useState(null);
    const mode = chatMode || 'agent';
    const setMode = (m) => { if (typeof onModeChange === 'function') onModeChange(m); };

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const userScrolledUp = useRef(false);
    const askMenuRef = useRef(null);
    const modelMenuRef = useRef(null);
    const textareaRef = useRef(null);

    const MODES = {
        agent: { label: 'Agent', icon: Infinity, shortcut: 'Ctrl I', desc: '执行代码修改和任务' },
        plan: { label: 'Plan', icon: ListTree, shortcut: '', desc: '架构设计与方案规划' },
        debug: { label: 'Debug', icon: Bug, shortcut: '', desc: '错误诊断与修复建议' },
        chat: { label: 'Ask', icon: MessageSquare, shortcut: 'Ctrl L', desc: '只读分析与问答' },
    };
    const CurrentModeIcon = MODES[mode]?.icon || MessageSquare;

    const MODE_PLACEHOLDERS = {
        chat: '向 Ask 提问（只读模式，分析项目与代码）...',
        debug: '描述你遇到的错误或异常行为...',
        plan: '描述你想要规划或设计的功能...',
        agent: '描述你想要执行的代码修改...',
    };

    const MODE_EMPTY = {
        chat: { icon: MessageSquare, text: '向 Ask 提问关于代码的任何问题', sub: '只读模式 · 分析代码 · 解释概念' },
        debug: { icon: Bug, text: '描述遇到的 Bug 或错误信息', sub: '诊断模式 · 定位问题 · 修复建议' },
        plan: { icon: ListTree, text: '描述需要规划的功能或架构', sub: '规划模式 · 方案设计 · 权衡分析' },
        agent: { icon: Infinity, text: '描述需要执行的代码修改', sub: '执行模式 · 编写代码 · 文件操作' },
    };

    useEffect(() => {
        if (!userScrolledUp.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [history, isGenerating]);

    const handleScroll = useCallback(() => {
        const el = messagesContainerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
        userScrolledUp.current = !atBottom;
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (askMenuRef.current && !askMenuRef.current.contains(e.target)) setAskMenuOpen(false);
            if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) setModelMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const loadModels = async () => {
            const r = await window.electronAPI?.modelList();
            if (r?.success && r.data?.length > 0) {
                setSavedModels(r.data);
                if (!currentModel) setCurrentModel(r.data[0]);
            }
        };
        loadModels();
    }, []);

    const autoResize = (el) => {
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    };

    const emptyState = MODE_EMPTY[mode] || MODE_EMPTY.chat;
    const EmptyIcon = emptyState.icon;

    return (
        <div className="bg-[#252526] flex flex-col h-full relative z-40 overflow-hidden">
            {/* Header */}
            <div className="h-[28px] flex items-center justify-between px-2 border-b border-[#1e1e1e] bg-[#252526] flex-shrink-0">
                <span className="text-[10px] uppercase font-semibold text-[#999] tracking-wider truncate" title={sessionTitle}>{sessionTitle || 'Chat'}</span>
                <div className="flex items-center gap-0.5">
                    <WithTooltip text="新对话" side="bottom">
                        <div className="p-[3px] rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={onNewChat}>
                            <Plus size={14} />
                        </div>
                    </WithTooltip>
                    <WithTooltip text="历史会话" side="bottom">
                        <div className="p-[3px] rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={onOpenHistory}>
                            <Clock size={14} />
                        </div>
                    </WithTooltip>
                    <WithTooltip text="更多操作" side="bottom">
                        <div className="p-[3px] rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={onOpenMoreActions}>
                            <MoreHorizontal size={14} />
                        </div>
                    </WithTooltip>
                </div>
            </div>

            {historyOpen && (
                <HistoryPanel sessions={sessions} activeId={activeSessionId} onSelect={onSelectSession} onRename={onRenameSession} onDelete={onDeleteSession} onClose={onCloseHistory} />
            )}

            {moreActionsOpen && (
                <MoreActionsMenu onRename={onRenameCurrentSession} onClear={onClearMessages} onExportJSON={onExportJSON} onExportTXT={onExportTXT} onDelete={onDeleteCurrentSession} onClose={onCloseMoreActions} />
            )}

            {/* Chat Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar"
                style={{ background: 'var(--chat-bg)' }}
                onScroll={handleScroll}
            >
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full select-none" style={{ color: 'var(--chat-text-dim)' }}>
                        <EmptyIcon size={28} className="mb-3 opacity-15" />
                        <p className="text-[11px] text-[#666] font-medium">{emptyState.text}</p>
                        <p className="text-[9px] text-[#444] mt-1">{emptyState.sub}</p>
                    </div>
                ) : (
                    history.map((msg, idx) => (
                        <AskMessageCard
                            key={msg.id}
                            msg={msg}
                            isGenerating={isGenerating && idx === history.length - 1 && msg.role === 'ai'}
                            generatingStartTime={generatingStartTime}
                            chatMode={msg.mode || mode}
                            onModeSwitch={setMode}
                            projectPath={projectPath}
                            autoExecute={autoExecute}
                            onStepApplied={onStepApplied}
                            onEditMessage={(editMsg, text) => {
                                setInput(text);
                                onEditMessage?.(editMsg);
                                // 聚焦输入框
                                setTimeout(() => textareaRef.current?.focus(), 50);
                            }}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-2 pb-2 bg-[#252526] flex-shrink-0">
                {/* Stop Generation Button */}
                {isGenerating && (
                    <div className="flex justify-center mb-1.5">
                        <button
                            onClick={onStopGeneration}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2a2a2a] border border-[#3a3a3a] text-[10px] text-[#bbb] hover:bg-[#333] hover:text-white transition-colors"
                        >
                            <Square size={8} className="fill-current" />
                            <span>停止生成</span>
                        </button>
                    </div>
                )}
                {/* Agent Review Bar（仅 Agent 模式，非生成时显示） */}
                {mode === 'agent' && !isGenerating && history.length > 0 && (
                    <div className="flex items-center justify-end gap-3 px-1 py-1 mb-1">
                        <span className="text-[10px] text-[#666] cursor-pointer hover:text-[#ccc] transition-colors">Undo All</span>
                        <span className="text-[10px] text-[#666] cursor-pointer hover:text-[#ccc] transition-colors">Keep All</span>
                        <button className="text-[10px] bg-[#2a2a2a] text-[#bbb] px-2 py-0.5 rounded border border-[#3a3a3a] cursor-pointer hover:bg-[#333] hover:text-white transition-colors">
                            Review
                        </button>
                    </div>
                )}

                <div className={`bg-[#181818] rounded-lg border flex flex-col transition-colors duration-200 shadow-md ${mode === 'agent' ? 'border-[#1e2e45] focus-within:border-[#2a4060]' :
                    mode === 'plan' ? 'border-[#3a2e1e] focus-within:border-[#4a3e2e]' :
                        mode === 'debug' ? 'border-[#3a1e1e] focus-within:border-[#4a2e2e]' :
                            'border-[#1e3a29] focus-within:border-[#2e4a39]'
                    }`}>
                    <textarea
                        ref={textareaRef}
                        className="bg-transparent border-none outline-none text-[11px] text-[#ccc] resize-none overflow-hidden h-auto min-h-[36px] max-h-[160px] px-2.5 py-2 placeholder-[#4a4a4a] w-full leading-[16px]"
                        placeholder={MODE_PLACEHOLDERS[mode] || MODE_PLACEHOLDERS.chat}
                        value={input}
                        disabled={isGenerating}
                        onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (input.trim() && !isGenerating) { onSend(input, currentModel); setInput(''); if (textareaRef.current) textareaRef.current.style.height = '36px'; }
                            }
                        }}
                    />

                    {/* Bottom Toolbar */}
                    <div className="flex justify-between items-center px-1.5 py-1 border-t border-[#222]">
                        <div className="flex items-center gap-1 relative z-20">
                            {/* Mode Switcher */}
                            <div className="relative" ref={askMenuRef}>
                                <button
                                    className={`flex items-center gap-1 px-1.5 py-[2px] rounded text-[10px] transition-colors border ${mode === 'chat' ? 'bg-[#162b1f] border-[#1e3a29] text-[#4cc38a] hover:bg-[#1d3326]' :
                                        mode === 'agent' ? 'bg-[#162030] border-[#1e2e45] text-[#4ca0e0] hover:bg-[#1d2a3d]' :
                                            mode === 'plan' ? 'bg-[#2b2318] border-[#3a2e1e] text-[#d4a24c] hover:bg-[#332a1d]' :
                                                mode === 'debug' ? 'bg-[#2b1a1a] border-[#3a1e1e] text-[#e06060] hover:bg-[#331d1d]' :
                                                    'bg-[#1a1a1a] border-[#2a2a2a] text-[#999] hover:bg-[#252525]'
                                        }`}
                                    onClick={() => setAskMenuOpen(!askMenuOpen)}
                                >
                                    <CurrentModeIcon size={10} />
                                    <span className="font-medium">{MODES[mode]?.label || 'Ask'}</span>
                                    <ChevronDown size={8} className="opacity-60" />
                                </button>

                                {askMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-1.5 w-[180px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-xl overflow-hidden py-0.5">
                                        {Object.entries(MODES).map(([key, config]) => {
                                            const Icon = config.icon;
                                            const modeColors = {
                                                chat: 'text-[#4cc38a]', agent: 'text-[#4ca0e0]',
                                                plan: 'text-[#d4a24c]', debug: 'text-[#e06060]'
                                            };
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-1.5 px-2.5 py-[5px] text-[#bbb] hover:bg-[#04395e] hover:text-white cursor-pointer group ${mode === key ? 'bg-[#04395e]/40' : ''}`}
                                                    onClick={() => { setMode(key); setAskMenuOpen(false); }}
                                                >
                                                    <Icon size={12} className={`${mode === key ? modeColors[key] : 'text-[#666]'} group-hover:text-white flex-shrink-0`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] font-medium">{config.label}</div>
                                                        <div className="text-[8px] text-[#555] group-hover:text-[#999] truncate">{config.desc}</div>
                                                    </div>
                                                    {config.shortcut && <span className="text-[8px] text-[#555] group-hover:text-[#aaa] whitespace-nowrap">{config.shortcut}</span>}
                                                    {mode === key && <Check size={9} className="text-white flex-shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Model Selector */}
                            <div className="relative" ref={modelMenuRef}>
                                <button
                                    className="flex items-center gap-0.5 hover:bg-[#252525] px-1.5 py-[2px] rounded transition-colors text-[#666]"
                                    onClick={() => setModelMenuOpen(!modelMenuOpen)}
                                >
                                    <span className="text-[10px] text-[#777] max-w-[100px] truncate">{currentModel?.displayName || 'No Model'}</span>
                                    <ChevronDown size={8} />
                                </button>

                                {modelMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-1.5 w-[200px] bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-xl overflow-hidden flex flex-col">
                                        <div className="py-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {savedModels.length === 0 ? (
                                                <div className="px-3 py-3 text-[10px] text-[#555] text-center">
                                                    No models configured.<br />Go to Settings → Model to add one.
                                                </div>
                                            ) : (
                                                savedModels.map(m => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center gap-1.5 px-2 py-[4px] hover:bg-[#04395e] hover:text-white cursor-pointer group"
                                                        onClick={() => { setCurrentModel(m); setModelMenuOpen(false); }}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-[10px] text-[#bbb] group-hover:text-white truncate block">{m.displayName}</span>
                                                            <span className="text-[9px] text-[#555] group-hover:text-[#aaa] truncate block">{m.modelName}</span>
                                                        </div>
                                                        {currentModel?.id === m.id && <Check size={9} className="text-white flex-shrink-0" />}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Send or attachment icons */}
                        <div className="flex items-center gap-1.5 z-20">
                            {input.trim() && !isGenerating ? (
                                <button
                                    onClick={() => { if (input.trim()) { onSend(input, currentModel); setInput(''); if (textareaRef.current) textareaRef.current.style.height = '36px'; } }}
                                    className="w-[20px] h-[20px] rounded flex items-center justify-center bg-[#4ca0e0] hover:bg-[#5cb0f0] transition-colors"
                                >
                                    <Send size={10} className="text-white" />
                                </button>
                            ) : (
                                <>
                                    <Globe size={11} className="text-[#555] hover:text-[#aaa] cursor-pointer transition-colors" />
                                    <ImageIcon size={11} className="text-[#555] hover:text-[#aaa] cursor-pointer transition-colors" />
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-[9px] text-[#444] mt-1 text-center select-none">AI generated content may be incorrect.</div>
            </div>
        </div>
    );
};

// ============================================================
// 命令面板
// ============================================================
const CommandPalette = ({ visible, onClose, fileTree, onOpenFile }) => {
    const [query, setQuery] = useState('');
    const getAllFiles = useCallback((nodes) => {
        let files = [];
        for (const node of nodes) {
            if (node.type === 'file') files.push(node);
            if (node.children) files = files.concat(getAllFiles(node.children));
        }
        return files;
    }, []);

    if (!visible) return null;

    const allFiles = getAllFiles(fileTree);
    const filtered = query ? allFiles.filter(f => f.name.toLowerCase().includes(query.toLowerCase())) : allFiles.slice(0, 10);

    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 z-50 flex justify-center pt-2" onClick={onClose}>
            <div className="w-[480px] h-fit bg-[#1e1e1e] rounded-md shadow-2xl border border-[#3a3a3a] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center px-2 py-1.5 border-b border-[#2a2a2a]">
                    <ChevronRight size={12} className="text-gray-500 mr-1.5" />
                    <input
                        autoFocus
                        className="bg-transparent border-none outline-none flex-1 text-[#ccc] placeholder-[#555] text-[11px]"
                        placeholder="搜索文件..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="py-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                    <div className="px-2 py-0.5 text-[9px] text-[#666] uppercase tracking-wide">{query ? '搜索结果' : '最近打开'}</div>
                    {filtered.map(file => (
                        <div
                            key={file.id}
                            className="px-2 py-1 hover:bg-[#2a2d2e] cursor-pointer flex justify-between"
                            onClick={() => {
                                if (typeof onOpenFile === 'function') {
                                    onOpenFile(file);
                                    onClose();
                                    return;
                                }
                                notImplemented('CommandPalette', `打开文件：${file.name}`);
                            }}
                        >
                            <span className="text-[#ccc] text-[11px] flex items-center gap-1.5">{getFileIcon(file.name)}{file.name}</span>
                            <span className="text-[#555] text-[9px] truncate max-w-[160px]">{file.path}</span>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="px-2 py-3 text-[10px] text-[#555] text-center">没有找到匹配的文件</div>}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// 终端面板
// ============================================================
const TerminalPanel = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('terminal');
    const [termInput, setTermInput] = useState('');
    const [termHistory, setTermHistory] = useState([
        { type: 'info', text: 'Welcome to Terminal — DreamIDE v1.0' },
        { type: 'path', text: 'PS D:\\IDenty\\cursor-launcher>' },
    ]);
    const termEndRef = useRef(null);
    const inputRef = useRef(null);

    const TABS = [
        { key: 'problems', label: 'PROBLEMS', count: 0 },
        { key: 'output', label: 'OUTPUT' },
        { key: 'debug', label: 'DEBUG CONSOLE' },
        { key: 'terminal', label: 'TERMINAL' },
    ];

    useEffect(() => {
        termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [termHistory]);

    const handleTermSubmit = (e) => {
        if (e.key !== 'Enter' || !termInput.trim()) return;
        const cmd = termInput.trim();
        globalLogger.info('Terminal', '执行命令', cmd);
        setTermHistory(prev => [
            ...prev,
            { type: 'cmd', text: `PS> ${cmd}` },
            { type: 'output', text: cmd === 'cls' || cmd === 'clear' ? '' : `'${cmd}' executed successfully.` }
        ]);
        if (cmd === 'cls' || cmd === 'clear') { setTermHistory([{ type: 'path', text: 'PS D:\\IDenty\\cursor-launcher>' }]); globalLogger.debug('Terminal', '终端已清空'); }
        setTermInput('');
    };

    return (
        <div className="bg-[#1e1e1e] flex flex-col h-full overflow-hidden border-t border-[#2a2a2a]">
            {/* Tab Bar */}
            <div className="h-[26px] flex items-center justify-between bg-[#252526] border-b border-[#1e1e1e] px-1 flex-shrink-0">
                <div className="flex items-center gap-0">
                    {TABS.map(tab => (
                        <div
                            key={tab.key}
                            className={`flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wide cursor-pointer border-b-2 transition-colors ${activeTab === tab.key
                                ? 'text-white border-white'
                                : 'text-[#888] border-transparent hover:text-[#ccc]'
                                }`}
                            onClick={() => { setActiveTab(tab.key); globalLogger.info('Terminal', '切换面板标签', tab.label); }}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="text-[8px] bg-[#333] text-[#888] px-1 rounded-sm">{tab.count}</span>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-1">
                    <WithTooltip text="New Terminal" side="bottom">
                        <div className="p-0.5 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={() => globalLogger.warn('Terminal', 'New Terminal — 功能未实现，返回空值')}>
                            <Terminal size={12} />
                        </div>
                    </WithTooltip>
                    <WithTooltip text="Split Terminal" side="bottom">
                        <div className="p-0.5 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={() => globalLogger.warn('Terminal', 'Split Terminal — 功能未实现，返回空值')}>
                            <Layout size={12} />
                        </div>
                    </WithTooltip>
                    <WithTooltip text="Close Panel" side="bottom">
                        <div className="p-0.5 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white" onClick={() => { globalLogger.info('Terminal', '关闭终端面板'); onClose(); }}>
                            <X size={12} />
                        </div>
                    </WithTooltip>
                </div>
            </div>

            {/* Terminal Content */}
            {activeTab === 'terminal' && (
                <div
                    className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[11px] leading-[16px] text-[#ccc] custom-scrollbar cursor-text"
                    onClick={() => inputRef.current?.focus()}
                >
                    {termHistory.map((line, i) => (
                        <div key={i} className={`${line.type === 'info' ? 'text-[#569cd6]' :
                            line.type === 'path' ? 'text-[#6a9955]' :
                                line.type === 'cmd' ? 'text-[#dcdcaa]' :
                                    line.type === 'error' ? 'text-[#f44747]' :
                                        'text-[#ccc]'
                            }`}>
                            {line.text}
                        </div>
                    ))}
                    <div className="flex items-center">
                        <span className="text-[#6a9955] mr-1">PS&gt;</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-[11px] text-[#ccc] font-mono caret-[#ccc]"
                            value={termInput}
                            onChange={(e) => setTermInput(e.target.value)}
                            onKeyDown={handleTermSubmit}
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </div>
                    <div ref={termEndRef} />
                </div>
            )}

            {activeTab === 'problems' && (
                <div className="flex-1 flex items-center justify-center text-[10px] text-[#555]">
                    No problems detected in workspace.
                </div>
            )}
            {activeTab === 'output' && (
                <div className="flex-1 overflow-y-auto px-3 py-1 font-mono text-[10px] text-[#888] custom-scrollbar">
                    <div className="text-[#569cd6]">[Info] Output channel ready.</div>
                </div>
            )}
            {activeTab === 'debug' && (
                <div className="flex-1 flex items-center justify-center text-[10px] text-[#555]">
                    No active debug session.
                </div>
            )}
        </div>
    );
};

// ============================================================
// 主组件：项目界面
// ============================================================
export default function ProjectView({ project, onBackToHome, onOpenSettings }) {
    const dialog = useDialog();
    const [fileTree, setFileTree] = useState([]);
    const [openFiles, setOpenFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [fileContents, setFileContents] = useState({});
    const [chatVisible, setChatVisible] = useState(true);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    // --- 多会话状态 ---
    const [sessions, setSessions] = useState([]); // 会话元数据列表
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [activeMessages, setActiveMessages] = useState([]);
    const [activeSessionTitle, setActiveSessionTitle] = useState('Chat');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [moreActionsOpen, setMoreActionsOpen] = useState(false);
    const [cmdPaletteVisible, setCmdPaletteVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [panelVisible, setPanelVisible] = useState(false);
    const [monitorVisible, setMonitorVisible] = useState(false);

    // 可调整面板宽度/高度
    const [sidebarWidth, setSidebarWidth] = useState(220);
    const [chatWidth, setChatWidth] = useState(320);
    const [panelHeight, setPanelHeight] = useState(180);

    const MIN_SIDEBAR = 140;
    const MAX_SIDEBAR = 400;
    const MIN_CHAT = 200;
    const MAX_CHAT = 600;
    const MIN_PANEL = 80;
    const MAX_PANEL = 500;

    useEffect(() => {
        const loadFileTree = async () => {
            if (!window.electronAPI || !project?.path) return;
            setLoading(true);
            globalLogger.info('FileTree', '加载文件树', project.path);
            const tree = await window.electronAPI.readFileTree(project.path);
            setFileTree(tree);
            setLoading(false);
            globalLogger.success('FileTree', '文件树加载完成', `${tree?.[0]?.children?.length || 0} 个顶层项`);
        };
        loadFileTree();
    }, [project?.path]);

    // 文件操作后刷新文件树
    const refreshFileTree = useCallback(async () => {
        if (!window.electronAPI || !project?.path) return;
        globalLogger.debug('FileTree', '刷新文件树');
        const tree = await window.electronAPI.readFileTree(project.path);
        setFileTree(tree);
        globalLogger.success('FileTree', '文件树已刷新');
    }, [project?.path]);

    // 资源管理器三态切换
    const handleExplorerClick = useCallback(() => {
        if (!sidebarVisible) {
            // 侧边栏隐藏 → 显示并激活 Explorer
            setSidebarVisible(true);
            globalLogger.info('ActivityBar', '资源管理器 — 显示侧边栏');
        } else {
            // 侧边栏可见 → 折叠侧边栏
            setSidebarVisible(false);
            globalLogger.info('ActivityBar', '资源管理器 — 折叠侧边栏');
        }
    }, [sidebarVisible]);

    // 全部折叠
    const collapseAll = useCallback(() => {
        const closeAll = (nodes) => nodes.map(node => {
            if (node.children) return { ...node, isOpen: false, children: closeAll(node.children) };
            return node;
        });
        setFileTree(prev => closeAll(prev));
        globalLogger.info('Explorer', '已全部折叠');
    }, []);

    // 从 Explorer 菜单新建文件
    const createFileAtRoot = useCallback(async (name) => {
        if (!project?.path) return;
        const sep = project.path.includes('/') ? '/' : '\\\\';
        const filePath = project.path + sep + name;
        try {
            const r = await window.electronAPI?.createFile(filePath);
            if (r?.success) { globalLogger.success('ExplorerMenu', '文件创建成功', filePath); refreshFileTree(); }
            else { globalLogger.error('ExplorerMenu', '文件创建失败', r?.error); dialog.alert('创建失败：' + (r?.error || '未知错误')); }
        } catch (ex) {
            globalLogger.error('ExplorerMenu', 'IPC 异常', ex?.message);
        }
    }, [project?.path, refreshFileTree]);

    // 从 Explorer 菜单新建文件夹
    const createFolderAtRoot = useCallback(async (name) => {
        if (!project?.path) return;
        const sep = project.path.includes('/') ? '/' : '\\\\';
        const folderPath = project.path + sep + name;
        try {
            const r = await window.electronAPI?.createFolder(folderPath);
            if (r?.success) { globalLogger.success('ExplorerMenu', '文件夹创建成功', folderPath); refreshFileTree(); }
            else { globalLogger.error('ExplorerMenu', '文件夹创建失败', r?.error); dialog.alert('创建失败：' + (r?.error || '未知错误')); }
        } catch (ex) {
            globalLogger.error('ExplorerMenu', 'IPC 异常', ex?.message);
        }
    }, [project?.path, refreshFileTree]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setCmdPaletteVisible(prev => !prev); }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
                e.preventDefault();
                globalLogger.info('Shortcut', 'Ctrl+Shift+E 触发资源管理器切换');
                setSidebarVisible(prev => !prev);
            }
            // Ctrl+L → Ask mode + 聚焦 Chat
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'l' || e.key === 'L')) {
                e.preventDefault();
                setChatMode('chat');
                setChatVisible(true);
                globalLogger.info('Shortcut', 'Ctrl+L → Ask 模式');
            }
            // Ctrl+I → Agent mode + 聚焦 Chat
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                setChatMode('agent');
                setChatVisible(true);
                globalLogger.info('Shortcut', 'Ctrl+I → Agent 模式');
            }
            if (e.key === 'Escape') setCmdPaletteVisible(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleFolder = (id) => {
        const toggleRecursive = (nodes) => nodes.map(node => {
            if (node.id === id) return { ...node, isOpen: !node.isOpen };
            if (node.children) return { ...node, children: toggleRecursive(node.children) };
            return node;
        });
        setFileTree(toggleRecursive(fileTree));
    };

    const openFile = async (node) => {
        globalLogger.info('Editor', '打开文件', node.name);
        if (!openFiles.find(f => f.id === node.id)) setOpenFiles(prev => [...prev, node]);
        setActiveFileId(node.id);
        if (!fileContents[node.id] && window.electronAPI) {
            const content = await window.electronAPI.readFileContent(node.path || node.id);
            setFileContents(prev => ({ ...prev, [node.id]: content }));
            globalLogger.debug('Editor', '文件内容已加载', `${node.name} (${content?.length || 0} 字符)`);
        }
    };

    const closeFile = (e, id) => {
        e.stopPropagation();
        const closedFile = openFiles.find(f => f.id === id);
        globalLogger.info('Editor', '关闭文件', closedFile?.name || id);
        const newOpenFiles = openFiles.filter(f => f.id !== id);
        setOpenFiles(newOpenFiles);
        if (activeFileId === id) setActiveFileId(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1].id : null);
    };

    // --- 会话初始化 ---
    useEffect(() => {
        const initSessions = async () => {
            const api = window.electronAPI;
            if (!api) return;
            const r = await api.chatList();
            if (r?.success && r.data?.length > 0) {
                setSessions(r.data);
                // 加载最近的会话
                const latest = r.data[0];
                setActiveSessionId(latest.id);
                setActiveSessionTitle(latest.title);
                const full = await api.chatGet(latest.id);
                if (full?.success) setActiveMessages(full.data.messages || []);
                globalLogger.info('Chat', `加载历史会话：${latest.title}`);
            } else {
                // 自动新建一个会话
                const nr = await api.chatCreate({ projectPath: project?.path || '' });
                if (nr?.success) {
                    setSessions([{ id: nr.data.id, title: nr.data.title, messageCount: 0, createdAt: nr.data.createdAt, updatedAt: nr.data.updatedAt }]);
                    setActiveSessionId(nr.data.id);
                    setActiveSessionTitle(nr.data.title);
                    setActiveMessages([]);
                    globalLogger.info('Chat', `自动创建新会话：${nr.data.title}`);
                }
            }
        };
        initSessions();
    }, []);

    // --- 刷新会话列表 ---
    const refreshSessions = async () => {
        const r = await window.electronAPI?.chatList();
        if (r?.success) setSessions(r.data || []);
    };

    // --- 新建会话 ---
    const handleNewChat = async () => {
        // 先保存当前会话
        if (activeSessionId && activeMessages.length > 0) {
            await window.electronAPI?.chatUpdate(activeSessionId, { messages: activeMessages });
        }
        const r = await window.electronAPI?.chatCreate({ projectPath: project?.path || '' });
        if (r?.success) {
            setActiveSessionId(r.data.id);
            setActiveSessionTitle(r.data.title);
            setActiveMessages([]);
            await refreshSessions();
            globalLogger.success('Chat', `新建会话：${r.data.title}`);
        } else {
            globalLogger.error('Chat', '新建会话失败', r?.error);
        }
    };

    // --- 切换会话 ---
    const handleSelectSession = async (id) => {
        if (id === activeSessionId) return;
        // 保存当前
        if (activeSessionId && activeMessages.length > 0) {
            await window.electronAPI?.chatUpdate(activeSessionId, { messages: activeMessages });
        }
        const full = await window.electronAPI?.chatGet(id);
        if (full?.success) {
            setActiveSessionId(id);
            setActiveSessionTitle(full.data.title);
            setActiveMessages(full.data.messages || []);
            globalLogger.info('Chat', `切换到会话：${full.data.title}`);
        } else {
            globalLogger.error('Chat', '加载会话失败', full?.error);
        }
    };

    // --- 重命名会话 ---
    const handleRenameSession = async (id, newTitle) => {
        const r = await window.electronAPI?.chatUpdate(id, { title: newTitle });
        if (r?.success) {
            if (id === activeSessionId) setActiveSessionTitle(newTitle);
            await refreshSessions();
            globalLogger.info('Chat', `重命名会话：${newTitle}`);
        }
    };

    // --- 删除会话 ---
    const handleDeleteSession = async (id) => {
        const r = await window.electronAPI?.chatDelete(id);
        if (r?.success) {
            globalLogger.info('Chat', '删除会话');
            if (id === activeSessionId) {
                // 删除当前会话后，切换到其他会话或新建
                const remaining = sessions.filter(s => s.id !== id);
                if (remaining.length > 0) {
                    await handleSelectSession(remaining[0].id);
                } else {
                    await handleNewChat();
                }
            }
            await refreshSessions();
        } else {
            globalLogger.error('Chat', '删除会话失败', r?.error);
        }
    };

    // --- 重命名当前会话（弹窗输入） ---
    const handleRenameCurrentSession = async () => {
        const newTitle = await dialog.prompt('请输入新的会话标题：', activeSessionTitle);
        if (newTitle && newTitle.trim()) handleRenameSession(activeSessionId, newTitle.trim());
    };

    // --- 清空当前会话消息 ---
    const handleClearMessages = async () => {
        if (!(await dialog.confirm('确定清空当前会话的所有消息？'))) return;
        setActiveMessages([]);
        await window.electronAPI?.chatUpdate(activeSessionId, { messages: [] });
        globalLogger.info('Chat', '已清空消息');
    };

    // --- 导出 ---
    const handleExportJSON = async () => {
        const r = await window.electronAPI?.chatExport(activeSessionId, 'json');
        if (r?.success) globalLogger.success('Chat', `导出 JSON 完成：${r.filePath}`);
        else globalLogger.error('Chat', '导出失败', r?.error);
    };
    const handleExportTXT = async () => {
        const r = await window.electronAPI?.chatExport(activeSessionId, 'txt');
        if (r?.success) globalLogger.success('Chat', `导出 TXT 完成：${r.filePath}`);
        else globalLogger.error('Chat', '导出失败', r?.error);
    };

    // --- 删除当前会话 ---
    const handleDeleteCurrentSession = async () => {
        if (!(await dialog.confirm(`确定删除会话「${activeSessionTitle}」？此操作不可撤销。`))) return;
        handleDeleteSession(activeSessionId);
    };

    // 当前聊天模式
    const [chatMode, setChatMode] = useState('agent');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingStartTime, setGeneratingStartTime] = useState(null);
    const activeRequestIdRef = useRef(null);
    const streamingMsgRef = useRef(null);

    // Auto 自动执行配置
    const [autoExecute, setAutoExecute] = useState(false);
    useEffect(() => {
        (async () => {
            const r = await window.electronAPI?.modeConfigGet();
            if (r?.success) setAutoExecute(r.data?.taskExecution?.autoExecute ?? false);
        })();
    }, []);

    // 写入后同步回调：刷新文件树 + 刷新已打开文件内容
    const handleStepApplied = useCallback(async (filePath) => {
        await refreshFileTree();
        if (filePath) {
            // 找到已打开的匹配文件
            const matchFile = openFiles.find(f => {
                const fp = f.path || f.id;
                return fp === filePath || fp.replace(/[\\/]+/g, '/') === filePath.replace(/[\\/]+/g, '/');
            });
            if (matchFile && window.electronAPI) {
                try {
                    const content = await window.electronAPI.readFileContent(matchFile.path || matchFile.id);
                    if (content) setFileContents(prev => ({ ...prev, [matchFile.id]: content }));
                    globalLogger.success('Sync', '文件内容已同步', matchFile.name);
                } catch (e) {
                    globalLogger.error('Sync', '文件同步失败', e?.message);
                }
            }
        }
    }, [refreshFileTree, openFiles]);

    // 停止生成
    const handleStopGeneration = useCallback(() => {
        if (activeRequestIdRef.current) {
            window.electronAPI?.llmStreamAbort(activeRequestIdRef.current);
            activeRequestIdRef.current = null;
        }
        setIsGenerating(false);
        setGeneratingStartTime(null);
    }, []);

    // ===== 模式 System Prompt 工厂 =====
    const buildSystemPrompt = useCallback((mode, projectContext, extraContext) => {
        const base = {
            chat: `You are Cursor, an intelligent AI coding assistant. You are in **Ask** mode — a read-only analysis mode.
Your role: Help users understand code, explain concepts, analyze project structure, and answer questions.
Rules:
- NEVER suggest making changes to files, running commands, or executing any write operations.
- Focus on clear explanations with code references when available.
- Use concise Chinese for responses. If the user writes in English, respond in English.
- When referencing code, cite file paths and line numbers.`,

            debug: `You are Cursor, an intelligent AI coding assistant. You are in **Debug** mode — a diagnostic mode.
Your role: Help users identify bugs, analyze error messages, trace issues through code, and suggest targeted fixes.

You MUST structure your response using exactly these sections (use the exact markdown headers):

## 🔍 问题分析
Describe what the error/issue is and reproduce conditions.

## 🎯 根因定位
Identify the root cause with specific file references and line numbers. Use \`inline code\` for identifiers.

## 🛠️ 修复方案
Provide concrete fix(es) with code blocks. For each fix:
- Show the file path in the code block header
- Explain what the change does and why

## ✅ 验证步骤
- [ ] Step 1 to verify the fix
- [ ] Step 2 to verify the fix

Rules:
- Always follow this exact 4-section format.
- Be specific about file paths and line numbers.
- If the user shares an error/stack trace, parse it carefully.
- Use concise Chinese for responses. If the user writes in English, respond in English.`,

            plan: `You are Cursor, an intelligent AI coding assistant. You are in **Plan** mode — an architecture and planning mode.
Your role: Help users design solutions, plan implementations, evaluate trade-offs, and create technical roadmaps.

You MUST structure your response using exactly these sections:

## 📋 方案概述
Brief summary of what you're planning (1-2 sentences).

## 📐 实施步骤
Use numbered checklist items. Each major step should be a checkbox item.
Sub-tasks should be indented under their parent step.
Format:
- [ ] **Step 1: Title** — Description of what this step involves
  - [ ] Sub-task 1.1
  - [ ] Sub-task 1.2
- [ ] **Step 2: Title** — Description
  ...

## ⚖️ 权衡分析
Compare alternatives, trade-offs, pros/cons if applicable.

## 📁 涉及文件
List the files that will be affected.

Rules:
- Always use checkbox format (- [ ] for pending, - [x] for done).
- Be specific about files, components, and dependencies.
- Include estimated complexity for each step if possible.
- Use concise Chinese for responses. If the user writes in English, respond in English.`,

            agent: `You are Cursor, an intelligent AI coding assistant. You are in **Agent** mode — an execution mode.
Your role: Help users implement changes, write code, create files, and execute tasks.

**Workflow (STRICT — must follow in every response):**

1. **需求分析** — Start with a brief \`## 📝 需求分析\` section (1-3 sentences) explaining what the user wants.
2. **执行思路** — Then a brief \`## 🧠 执行思路\` section explaining your approach.
3. **To-dos 清单** — Then a \`## 📋 To-dos\` section with a checkbox list of all steps you will execute. Each item format: \`- [ ] Step description → 对应组件/文件\`. Once you output the code for a step, mark it as \`- [x]\`.
4. **逐步执行** — Then execute each step with code blocks.

Output format (strict):
- For file edits: use fenced code blocks with language + file path on the first line. Example: three backticks followed by language and path. The user can click "Apply" to write the content to the file.
- For shell commands: use code blocks with bash/sh language identifier (no path). These will be shown as runnable terminal blocks.
- Prefer full file content for small files; for large files show the relevant snippet and mention the file path clearly.

Rules:
- ALWAYS follow the 4-step workflow above. Never skip the To-dos list.
- Provide concrete code with exact file paths (relative to project root).
- Use concise Chinese for responses. If the user writes in English, respond in English.`,
        };

        let prompt = base[mode] || base.chat;

        if (extraContext) {
            prompt += `\n\n${extraContext}`;
        }

        if (projectContext) {
            prompt += `\n\n${projectContext}`;
        }

        return prompt;
    }, []);

    // ===== 项目上下文检索 =====
    const searchProjectContext = useCallback(async (text) => {
        if (!project?.path) return { systemContext: '', citations: [] };

        let fileNames = [];
        try {
            const lr = await window.electronAPI?.projectListFiles(project?.path);
            if (lr?.success) fileNames = lr.data || [];
        } catch (e) { }

        const related = isProjectRelated(text, fileNames);
        if (!related) return { systemContext: '', citations: [] };

        const STOP_WORDS = new Set(['的', '是', '在', '了', '和', '与', '有', '这', '那', '个', '中', '为', '什么', '怎么', '如何', '请', '问', '吗', '呢', '吧', '啊', '能', '可以', 'the', 'is', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'how', 'what', 'why', 'where', 'when', 'this', 'that', 'it', 'be', 'with']);
        const words = text.replace(/[\u3000-\u303f\uff00-\uffef,.?!;:"'()\[\]{}<>\/]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));
        const keywords = words.sort((a, b) => b.length - a.length).slice(0, 5).map(w => w.toLowerCase());
        const queryStr = keywords.join(' ') || text.substring(0, 30);

        const citations = [];
        let systemContext = '';

        try {
            const sr = await window.electronAPI?.projectSearch(project?.path, queryStr);
            if (sr?.success && sr.data?.length > 0) {
                const CONTEXT_BUDGET = 3000;
                let usedLen = 0;
                const snippets = [];
                for (const r of sr.data) {
                    const snip = (r.snippet || '').substring(0, 500);
                    if (usedLen + snip.length > CONTEXT_BUDGET) break;
                    usedLen += snip.length;
                    snippets.push(`--- ${r.relativePath || r.file}:${r.line || 1} ---\n${snip}`);
                    citations.push({ file: r.file, relativePath: r.relativePath || r.file, path: r.path, line: r.line, matchType: r.matchType });
                }
                if (snippets.length > 0) {
                    systemContext = `\n\nRelevant project code snippets:\n${snippets.join('\n\n')}`;
                }
            }
        } catch (e) {
            globalLogger.error('Search', '项目检索失败', e?.message);
        }

        return { systemContext, citations };
    }, [project?.path]);

    // ===== 编辑消息重发 =====
    const handleEditMessage = useCallback(async (editMsg) => {
        if (!editMsg?.id) return;
        const idx = activeMessages.findIndex(m => m.id === editMsg.id);
        if (idx < 0) return;
        const truncated = activeMessages.slice(0, idx);
        setActiveMessages(truncated);
        if (activeSessionId) {
            await window.electronAPI?.chatUpdate(activeSessionId, { messages: truncated });
        }
    }, [activeMessages, activeSessionId]);

    // ===== 主发送消息 =====
    const handleSendMessage = async (text, model) => {
        globalLogger.info('Chat', '发送消息', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
        const userMsg = { id: Date.now(), role: 'user', text, mode: chatMode };
        const newMessages = [...activeMessages, userMsg];
        setActiveMessages(newMessages);
        await window.electronAPI?.chatUpdate(activeSessionId, { messages: newMessages });
        await refreshSessions();

        if (!model?.id) {
            const errMsg = { id: Date.now() + 1, role: 'ai', text: '⚠️ 请先在底部工具栏选择一个模型，或前往 设置 → Model 添加模型配置。', mode: chatMode };
            const updated = [...newMessages, errMsg];
            setActiveMessages(updated);
            await window.electronAPI?.chatUpdate(activeSessionId, { messages: updated });
            await refreshSessions();
            return;
        }

        setIsGenerating(true);
        setGeneratingStartTime(Date.now());
        globalLogger.info('Chat', `调用 LLM [${chatMode}]: ${model.displayName}`, `modelId=${model.id}`);

        try {
            // 项目上下文检索（Ask/Debug/Plan/Agent 均可用）
            const { systemContext, citations } = await searchProjectContext(text);

            // Debug 模式额外注入当前打开文件的上下文
            let extraContext = '';
            if (chatMode === 'debug' && activeFileId) {
                const af = openFiles.find(f => f.id === activeFileId);
                const content = fileContents[activeFileId];
                if (af && content) {
                    const truncated = content.length > 4000 ? content.substring(0, 4000) + '\n... (truncated)' : content;
                    extraContext = `Currently open file: ${af.name} (${af.path || af.relativePath || af.name})\n\`\`\`\n${truncated}\n\`\`\``;
                }
            }

            const systemPrompt = buildSystemPrompt(chatMode, systemContext, extraContext);

            const apiMessages = [
                { role: 'system', text: systemPrompt },
                ...newMessages.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    text: m.answerText || m.text || '',
                }))
            ];

            // 占位 AI 消息用于流式显示
            const aiMsgId = Date.now() + 1;
            const placeholderAiMsg = {
                id: aiMsgId,
                role: 'ai',
                text: '',
                answerText: '',
                thoughtSummaryZh: '',
                thoughtDurationMs: 0,
                isReasoningModel: false,
                citations: citations.length > 0 ? citations : undefined,
                mode: chatMode,
                streaming: true,
            };
            const messagesWithPlaceholder = [...newMessages, placeholderAiMsg];
            setActiveMessages(messagesWithPlaceholder);
            streamingMsgRef.current = placeholderAiMsg;

            const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            activeRequestIdRef.current = requestId;

            // 清理之前的监听器
            window.electronAPI?.removeAllStreamListeners?.();

            // 注册流式监听器
            window.electronAPI?.onStreamChunk((data) => {
                if (data.requestId !== requestId) return;
                setActiveMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (!last || last.id !== aiMsgId) return prev;
                    const updated = [...prev];
                    const msg = { ...last };
                    if (data.content !== undefined) {
                        msg.answerText = data.fullContent || (msg.answerText + data.content);
                        msg.text = msg.answerText;
                    }
                    if (data.reasoning !== undefined) {
                        msg.thoughtSummaryZh = data.fullReasoning || (msg.thoughtSummaryZh + data.reasoning);
                        msg.isReasoningModel = true;
                    }
                    // Tool Calling 支持
                    if (data.toolCalls !== undefined) {
                        msg.toolCalls = msg.toolCalls || [];
                        // 合并增量 tool calls
                        data.toolCalls.forEach(tc => {
                            const idx = tc.index !== undefined ? tc.index : msg.toolCalls.length;
                            if (!msg.toolCalls[idx]) {
                                msg.toolCalls[idx] = { id: tc.id, type: 'function', function: { name: '', arguments: '' } };
                            }
                            if (tc.id) msg.toolCalls[idx].id = tc.id;
                            if (tc.type) msg.toolCalls[idx].type = tc.type;
                            if (tc.function) {
                                if (tc.function.name) msg.toolCalls[idx].function.name += tc.function.name;
                                if (tc.function.arguments) msg.toolCalls[idx].function.arguments += tc.function.arguments;
                            }
                        });
                    }
                    updated[updated.length - 1] = msg;
                    return updated;
                });
            });

            const streamDonePromise = new Promise((resolve, reject) => {
                window.electronAPI?.onStreamDone((data) => {
                    if (data.requestId !== requestId) return;
                    resolve(data);
                });
                window.electronAPI?.onStreamError((data) => {
                    if (data.requestId !== requestId) return;
                    reject(data);
                });
            });

            // 发起流式请求
            window.electronAPI?.llmStream({
                modelId: model.id,
                messages: apiMessages,
                requestId,
            });

            try {
                const result = await streamDonePromise;
                window.electronAPI?.removeAllStreamListeners?.();

                const elapsed = result.elapsed;
                globalLogger.success('Chat', `LLM 流式回复完成`, `${elapsed}ms`);

                // 最终更新消息
                setActiveMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (!last || last.id !== aiMsgId) return prev;
                    const updated = [...prev];
                    const finalMsg = {
                        ...last,
                        text: result.content || last.answerText || '(空回复)',
                        answerText: result.content || last.answerText || '',
                        thoughtSummaryZh: result.reasoning || last.thoughtSummaryZh || '',
                        thoughtDurationMs: elapsed,
                        isReasoningModel: result.isReasoningModel || false,
                        streaming: false,
                    };
                    updated[updated.length - 1] = finalMsg;

                    // 持久化
                    window.electronAPI?.chatUpdate(activeSessionId, { messages: updated });
                    refreshSessions();
                    return updated;
                });

            } catch (errData) {
                window.electronAPI?.removeAllStreamListeners?.();
                const errorText = `❌ **模型调用失败**\n\n${errData?.error || '未知错误'}\n\n> 错误码: ${errData?.code || 'N/A'}`;
                globalLogger.error('Chat', `LLM 错误`, `${errData?.code}: ${errData?.error?.substring(0, 80)}`);

                setActiveMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (!last || last.id !== aiMsgId) return prev;
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...last, text: errorText, answerText: errorText, streaming: false };
                    window.electronAPI?.chatUpdate(activeSessionId, { messages: updated });
                    refreshSessions();
                    return updated;
                });
            }

        } catch (e) {
            globalLogger.error('Chat', '意外错误', e?.message);
            const aiMsg = { id: Date.now() + 1, role: 'ai', text: `❌ **调用异常**\n\n${e?.message || '未知错误'}`, mode: chatMode };
            const updated = [...newMessages, aiMsg];
            setActiveMessages(updated);
            await window.electronAPI?.chatUpdate(activeSessionId, { messages: updated });
            await refreshSessions();
        } finally {
            setIsGenerating(false);
            setGeneratingStartTime(null);
            activeRequestIdRef.current = null;
            streamingMsgRef.current = null;
            window.electronAPI?.removeAllStreamListeners?.();
        }
    };

    const activeFile = openFiles.find(f => f.id === activeFileId);

    // Sidebar Resizer
    const handleSidebarResize = useCallback((delta, moveEvent) => {
        setSidebarWidth(prev => Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, prev + delta)));
    }, []);

    // Chat Resizer (drag left = wider chat)
    const handleChatResize = useCallback((delta, moveEvent) => {
        setChatWidth(prev => Math.max(MIN_CHAT, Math.min(MAX_CHAT, prev - delta)));
    }, []);

    // 由于 Resizer 每次 move 都用的累计 delta 相对于 startPos，
    // 我们需要用 ref 保存 startWidth 模式
    const sidebarStartRef = useRef(sidebarWidth);
    const chatStartRef = useRef(chatWidth);

    const handleSidebarResizeStart = useCallback((e) => {
        e.preventDefault();
        sidebarStartRef.current = sidebarWidth;
        const startX = e.clientX;
        const onMove = (moveEvent) => {
            const delta = moveEvent.clientX - startX;
            const newW = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, sidebarStartRef.current + delta));
            setSidebarWidth(newW);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [sidebarWidth]);

    const handleChatResizeStart = useCallback((e) => {
        e.preventDefault();
        chatStartRef.current = chatWidth;
        const startX = e.clientX;
        const onMove = (moveEvent) => {
            const delta = startX - moveEvent.clientX;
            const newW = Math.max(MIN_CHAT, Math.min(MAX_CHAT, chatStartRef.current + delta));
            setChatWidth(newW);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [chatWidth]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-[#1e1e1e] text-[#999]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-blue-400" />
                    <p className="text-[11px]">正在加载项目: {project?.name}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#ccc] overflow-hidden font-['Inter',system-ui,-apple-system,'Segoe_UI',sans-serif] selection:bg-[#264f78] text-[12px]">
            {/* 标题栏 */}
            <div className="titlebar-drag flex items-center justify-between h-[28px] px-2 bg-[#323233] border-b border-[#1e1e1e] select-none text-[11px] text-[#888] flex-shrink-0">
                <div className="titlebar-no-drag flex items-center gap-1.5">
                    <button onClick={() => { globalLogger.info('Navigation', '返回首页'); onBackToHome(); }} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-[#444] text-[#aaa] hover:text-white transition-colors text-[10px]" title="返回启动页">
                        <ChevronRight size={10} className="rotate-180" />
                        <span>首页</span>
                    </button>
                    <span className="text-[#444]">|</span>
                </div>

                <span className="text-[#777] text-[10px]">{project?.name} — Cursor</span>

                <div className="titlebar-no-drag flex items-center gap-2">
                    {/* 布局切换控件 — 24×24 精致图标, 深灰工业风 */}
                    <div className="flex items-center gap-[1px] bg-[#333] rounded-[2px] p-[2px] border border-[#2a2a2a]">
                        <WithTooltip text="Toggle Primary Side Bar" side="bottom">
                            <div
                                className={`flex items-center justify-center w-[28px] h-[22px] rounded-[2px] cursor-pointer transition-colors ${sidebarVisible ? 'bg-[#444] text-[#ccc]' : 'bg-transparent text-[#666] hover:bg-[#3c3c3c]'}`}
                                onClick={() => { setSidebarVisible(!sidebarVisible); globalLogger.info('Layout', '切换侧边栏', sidebarVisible ? '隐藏' : '显示'); }}
                            >
                                <LayoutSidebarLeftIcon active={sidebarVisible} />
                            </div>
                        </WithTooltip>
                        <WithTooltip text="Toggle Panel" side="bottom">
                            <div
                                className={`flex items-center justify-center w-[28px] h-[22px] rounded-[2px] cursor-pointer transition-colors ${panelVisible ? 'bg-[#444] text-[#ccc]' : 'bg-transparent text-[#666] hover:bg-[#3c3c3c]'}`}
                                onClick={() => { setPanelVisible(!panelVisible); globalLogger.info('Layout', '切换终端面板', panelVisible ? '关闭' : '打开'); }}
                            >
                                <LayoutPanelBottomIcon active={panelVisible} />
                            </div>
                        </WithTooltip>
                        <WithTooltip text="Toggle Secondary Side Bar" side="bottom">
                            <div
                                className={`flex items-center justify-center w-[28px] h-[22px] rounded-[2px] cursor-pointer transition-colors ${chatVisible ? 'bg-[#444] text-[#ccc]' : 'bg-transparent text-[#666] hover:bg-[#3c3c3c]'}`}
                                onClick={() => { setChatVisible(!chatVisible); globalLogger.info('Layout', '切换 AI 面板', chatVisible ? '关闭' : '打开'); }}
                            >
                                <LayoutSidebarRightIcon active={chatVisible} />
                            </div>
                        </WithTooltip>
                    </div>

                    {/* 窗口控制按钮 */}
                    <div className="flex items-center">
                        <div onClick={() => window.electronAPI?.windowMinimize()} className="px-2.5 h-[28px] flex items-center hover:bg-[#444] cursor-default">
                            <Minus size={11} />
                        </div>
                        <div onClick={() => window.electronAPI?.windowToggleMaximize()} className="px-2.5 h-[28px] flex items-center hover:bg-[#444] cursor-default">
                            <Square size={9} />
                        </div>
                        <div onClick={() => window.electronAPI?.windowClose()} className="px-2.5 h-[28px] flex items-center hover:bg-red-600 group cursor-default">
                            <X size={11} className="group-hover:text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 主布局 — 真正响应式三栏 */}
            <div className="flex flex-1 overflow-hidden">
                <ActivityBar monitorActive={monitorVisible} onToggleMonitor={() => setMonitorVisible(v => !v)} explorerActive={sidebarVisible} onExplorerClick={handleExplorerClick} onOpenSettings={onOpenSettings} />

                {/* 文件管理器 + Resizer */}
                {sidebarVisible && (
                    <>
                        <FileExplorer
                            fileTree={fileTree}
                            onToggle={toggleFolder}
                            onSelect={openFile}
                            activeFileId={activeFileId}
                            projectName={project?.name || 'PROJECT'}
                            style={{ width: `${sidebarWidth}px` }}
                            onRefresh={refreshFileTree}
                            projectPath={project?.path}
                            onCollapseAll={collapseAll}
                            onNewFile={createFileAtRoot}
                            onNewFolder={createFolderAtRoot}
                        />
                        <div
                            className="w-[3px] bg-transparent hover:bg-[#007fd4] cursor-col-resize flex-shrink-0 z-30 transition-colors duration-150"
                            onMouseDown={handleSidebarResizeStart}
                        />
                    </>
                )}

                {/* 当监测面板打开时 → 完全覆盖编辑区 + AI面板 */}
                {monitorVisible ? (
                    <MonitorPanel onClose={() => setMonitorVisible(false)} />
                ) : (
                    <>
                        {/* 编辑器区域 — flex-grow 自动填充 + 底部终端 */}
                        <div className="flex-1 flex flex-col min-w-[200px] bg-[#1e1e1e]">
                            {/* 编辑器主体 */}
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                {openFiles.length > 0 ? (
                                    <>
                                        <EditorTabs files={openFiles} activeId={activeFileId} onSelect={setActiveFileId} onClose={closeFile} />
                                        <CodeEditor file={activeFile} content={fileContents[activeFileId]} projectName={project?.name} />
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                                        <Command size={48} className="mb-3 opacity-15" />
                                        <p className="text-[11px]">选择一个文件开始编辑</p>
                                        <div className="text-[10px] mt-3 flex gap-3 text-gray-700">
                                            <span><span className="bg-[#333] px-1 rounded text-[9px]">Ctrl</span> + <span className="bg-[#333] px-1 rounded text-[9px]">P</span> 搜索文件</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 终端面板 + 垂直 Resizer */}
                            {panelVisible && (
                                <>
                                    <div
                                        className="h-[3px] bg-transparent hover:bg-[#007fd4] cursor-row-resize flex-shrink-0 z-30 transition-colors duration-150"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            const startY = e.clientY;
                                            const startH = panelHeight;
                                            const onMove = (ev) => {
                                                const delta = startY - ev.clientY;
                                                setPanelHeight(Math.max(MIN_PANEL, Math.min(MAX_PANEL, startH + delta)));
                                            };
                                            const onUp = () => {
                                                document.removeEventListener('mousemove', onMove);
                                                document.removeEventListener('mouseup', onUp);
                                                document.body.style.cursor = '';
                                                document.body.style.userSelect = '';
                                            };
                                            document.body.style.cursor = 'row-resize';
                                            document.body.style.userSelect = 'none';
                                            document.addEventListener('mousemove', onMove);
                                            document.addEventListener('mouseup', onUp);
                                        }}
                                    />
                                    <div className="flex-shrink-0" style={{ height: `${panelHeight}px` }}>
                                        <TerminalPanel onClose={() => setPanelVisible(false)} />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Chat Resizer + AI 面板 */}
                        {chatVisible && (
                            <>
                                <div
                                    className="w-[3px] bg-transparent hover:bg-[#007fd4] cursor-col-resize flex-shrink-0 z-30 transition-colors duration-150"
                                    onMouseDown={handleChatResizeStart}
                                />
                                <div className="flex-shrink-0 border-l border-[#1e1e1e]" style={{ width: `${chatWidth}px` }}>
                                    <AIPanel
                                        history={activeMessages}
                                        onSend={handleSendMessage}
                                        onClose={() => setChatVisible(false)}
                                        sessionTitle={activeSessionTitle}
                                        onNewChat={handleNewChat}
                                        onOpenHistory={() => setHistoryOpen(true)}
                                        onOpenMoreActions={() => setMoreActionsOpen(!moreActionsOpen)}
                                        historyOpen={historyOpen}
                                        moreActionsOpen={moreActionsOpen}
                                        sessions={sessions}
                                        activeSessionId={activeSessionId}
                                        onSelectSession={handleSelectSession}
                                        onRenameSession={handleRenameSession}
                                        onDeleteSession={handleDeleteSession}
                                        onCloseHistory={() => setHistoryOpen(false)}
                                        onCloseMoreActions={() => setMoreActionsOpen(false)}
                                        onRenameCurrentSession={handleRenameCurrentSession}
                                        onClearMessages={handleClearMessages}
                                        onExportJSON={handleExportJSON}
                                        onExportTXT={handleExportTXT}
                                        onDeleteCurrentSession={handleDeleteCurrentSession}
                                        chatMode={chatMode}
                                        onModeChange={setChatMode}
                                        isGenerating={isGenerating}
                                        generatingStartTime={generatingStartTime}
                                        onStopGeneration={handleStopGeneration}
                                        projectPath={project?.path}
                                        autoExecute={autoExecute}
                                        onStepApplied={handleStepApplied}
                                        onEditMessage={handleEditMessage}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* 底部状态栏 */}
            <div className="h-[20px] bg-[#007acc] text-white flex items-center justify-between px-2 text-[10px] select-none flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 cursor-pointer hover:bg-white/20 px-0.5 rounded" onClick={() => notImplemented('StatusBar', '分支切换')}>
                        <GitGraph size={10} /><span>main</span>
                    </div>
                    <div className="flex items-center gap-0.5 cursor-pointer hover:bg-white/20 px-0.5 rounded" onClick={() => notImplemented('StatusBar', '问题面板')}>
                        <X size={10} /><span>0</span>
                        <div className="w-[1px] h-2.5 bg-white/30 mx-0.5"></div>
                        <Bug size={10} /><span>0</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="cursor-pointer hover:bg-white/20 px-0.5 rounded" onClick={() => notImplemented('StatusBar', '语言模式切换')}>
                        {activeFile?.name ? getLanguageDisplay(activeFile.name) : 'Plain Text'}
                    </span>
                    <span className="cursor-pointer hover:bg-white/20 px-0.5 rounded" onClick={() => notImplemented('StatusBar', '编码切换')}>
                        UTF-8
                    </span>
                    <div className="cursor-pointer hover:bg-white/20 px-0.5 rounded flex items-center gap-0.5" onClick={() => { setChatVisible(!chatVisible); globalLogger.info('StatusBar', '切换 AI 面板', chatVisible ? '关闭' : '打开'); }}>
                        <MessageSquare size={10} /><span>Cursor Tab</span>
                    </div>
                </div>
            </div>

            <CommandPalette visible={cmdPaletteVisible} onClose={() => setCmdPaletteVisible(false)} fileTree={fileTree} onOpenFile={openFile} />

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
}
