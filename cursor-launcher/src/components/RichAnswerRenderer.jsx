import React, { useState } from 'react';
import { X, ExternalLink, Info, AlertTriangle, CheckCircle, FileText, ChevronRight, Maximize2 } from 'lucide-react';

// ============================================================
// 结构化 Blocks 协议
// 支持类型: paragraph, list, table, code, callout, source, mindmap
// ============================================================

// --- 段落 ---
const ParagraphBlock = ({ content }) => (
    <div className="text-[11px] leading-[18px] text-[#bbb] mb-2 whitespace-pre-wrap">
        {renderInlineContent(content)}
    </div>
);

// --- 内联内容渲染（粗体、行内代码、颜色标签） ---
function renderInlineContent(text) {
    if (!text) return null;
    // 简单的 inline 解析: **bold**, `code`, [color:#hex]
    const parts = [];
    let remaining = text;
    let key = 0;
    const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[color:(#[0-9a-fA-F]{3,8})\])/g;
    let lastIdx = 0;
    let match;
    while ((match = regex.exec(remaining)) !== null) {
        if (match.index > lastIdx) {
            parts.push(<span key={key++}>{remaining.slice(lastIdx, match.index)}</span>);
        }
        if (match[1]) { // **bold**
            parts.push(<strong key={key++} className="text-[#ddd] font-semibold">{match[2]}</strong>);
        } else if (match[3]) { // `code`
            parts.push(<code key={key++} className="bg-[#1a1a1a] border border-[#333] rounded px-1 py-0.5 text-[10px] text-[#ce9178] font-mono">{match[4]}</code>);
        } else if (match[5]) { // [color:#hex]
            const c = match[6];
            parts.push(
                <span key={key++} className="inline-flex items-center gap-1 mx-0.5">
                    <span className="w-3 h-3 rounded-sm border border-[#555] inline-block flex-shrink-0" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-[#999] font-mono">{c}</span>
                </span>
            );
        }
        lastIdx = match.index + match[0].length;
    }
    if (lastIdx < remaining.length) {
        parts.push(<span key={key++}>{remaining.slice(lastIdx)}</span>);
    }
    return parts.length > 0 ? parts : text;
}

// --- 列表 ---
const ListBlock = ({ items, ordered }) => {
    const Tag = ordered ? 'ol' : 'ul';
    return (
        <Tag className={`mb-2 pl-4 text-[11px] leading-[18px] text-[#bbb] ${ordered ? 'list-decimal' : 'list-disc'} list-outside`}>
            {items.map((item, i) => (
                <li key={i} className="mb-0.5">{renderInlineContent(item)}</li>
            ))}
        </Tag>
    );
};

// --- 表格 ---
const TableBlock = ({ headers, rows }) => (
    <div className="mb-3 overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
            <thead>
                <tr className="border-b border-[#3a3a3a]">
                    {headers.map((h, i) => (
                        <th key={i} className="text-left py-1.5 px-2 text-[#aaa] font-semibold bg-[#1e1e1e]">
                            {renderInlineContent(h)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-[#2a2a2a] hover:bg-[#1e1e1e]/50">
                        {row.map((cell, ci) => (
                            <td key={ci} className="py-1.5 px-2 text-[#bbb]">
                                {renderInlineContent(cell)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- 代码块 ---
const CodeBlock = ({ language, code }) => (
    <div className="mb-3 rounded-md border border-[#333] overflow-hidden">
        <div className="flex items-center justify-between px-2.5 py-1 bg-[#1a1a1a] border-b border-[#333]">
            <span className="text-[9px] text-[#777] uppercase tracking-wide font-mono">{language || 'code'}</span>
            <button
                className="text-[9px] text-[#666] hover:text-[#aaa] transition-colors cursor-pointer"
                onClick={() => navigator.clipboard?.writeText(code)}
            >
                Copy
            </button>
        </div>
        <pre className="bg-[#181818] px-3 py-2 overflow-x-auto custom-scrollbar">
            <code className="text-[10px] leading-[16px] text-[#d4d4d4] font-mono whitespace-pre">{code}</code>
        </pre>
    </div>
);

// --- 提示卡片 (callout) ---
const CALLOUT_STYLES = {
    info: { bg: 'bg-[#162035]', border: 'border-[#1e3050]', icon: Info, iconColor: 'text-blue-400', titleColor: 'text-blue-300' },
    warning: { bg: 'bg-[#2b2318]', border: 'border-[#3a2e1e]', icon: AlertTriangle, iconColor: 'text-yellow-400', titleColor: 'text-yellow-300' },
    success: { bg: 'bg-[#162b1f]', border: 'border-[#1e3a29]', icon: CheckCircle, iconColor: 'text-green-400', titleColor: 'text-green-300' },
    error: { bg: 'bg-[#2b1a1a]', border: 'border-[#3a1e1e]', icon: AlertTriangle, iconColor: 'text-red-400', titleColor: 'text-red-300' },
};

const CalloutBlock = ({ type = 'info', title, content }) => {
    const style = CALLOUT_STYLES[type] || CALLOUT_STYLES.info;
    const Icon = style.icon;
    return (
        <div className={`mb-3 rounded-md border ${style.border} ${style.bg} p-2.5`}>
            <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className={style.iconColor} />
                <span className={`text-[10px] font-semibold ${style.titleColor}`}>{title || type.toUpperCase()}</span>
            </div>
            <div className="text-[10px] leading-[16px] text-[#bbb] pl-[18px]">
                {renderInlineContent(content)}
            </div>
        </div>
    );
};

// --- 来源引用 ---
const SourceBlock = ({ sources }) => (
    <div className="mb-3 flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-1 bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-[9px] text-[#999] hover:text-[#ccc] hover:border-[#555] transition-colors cursor-pointer group" title={s.path}>
                <FileText size={9} className="text-[#666] group-hover:text-[#999]" />
                <span className="truncate max-w-[120px]">{s.file || s.path}</span>
                {s.line && <span className="text-[#555]">:{s.line}</span>}
            </div>
        ))}
    </div>
);

// --- 思维导图卡片 ---
const MindmapBlock = ({ data }) => {
    const [fullscreen, setFullscreen] = useState(false);

    const renderNode = (node, depth = 0) => {
        if (!node) return null;
        const colors = ['#4ca0e0', '#4cc38a', '#d4a24c', '#e06060', '#9b59b6', '#e67e22'];
        const color = colors[depth % colors.length];
        return (
            <div className="flex flex-col" key={node.label}>
                <div className="flex items-center gap-1.5 py-0.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-[#ccc]" style={{ paddingLeft: depth * 8 }}>{node.label}</span>
                </div>
                {node.children?.map((child, i) => (
                    <div key={i} className="ml-3 border-l border-[#333] pl-2">
                        {renderNode(child, depth + 1)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className="mb-3 rounded-md border border-[#333] bg-[#1a1a1a] overflow-hidden">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#333]">
                    <span className="text-[10px] text-[#888] font-semibold">🗺️ 思维导图</span>
                    <button
                        className="flex items-center gap-1 text-[9px] text-[#0e639c] hover:text-[#1177bb] transition-colors cursor-pointer font-medium"
                        onClick={() => setFullscreen(true)}
                    >
                        <Maximize2 size={9} />
                        Open
                    </button>
                </div>
                <div className="px-3 py-2 max-h-[120px] overflow-hidden relative">
                    {renderNode(data)}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                </div>
            </div>

            {/* 全屏弹窗 */}
            {fullscreen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)' }}>
                    <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-2xl w-[90vw] max-w-[800px] h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333]">
                            <span className="text-[12px] text-[#ccc] font-semibold">🗺️ 思维导图</span>
                            <button className="p-1 rounded hover:bg-[#333] cursor-pointer text-[#888] hover:text-white transition-colors" onClick={() => setFullscreen(false)}>
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto px-6 py-4 custom-scrollbar">
                            {renderNode(data)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ============================================================
// 主渲染器
// ============================================================
export default function RichAnswerRenderer({ blocks }) {
    if (!blocks || !Array.isArray(blocks)) return null;

    return (
        <div className="rich-answer">
            {blocks.map((block, i) => {
                switch (block.type) {
                    case 'paragraph':
                        return <ParagraphBlock key={i} content={block.content} />;
                    case 'list':
                        return <ListBlock key={i} items={block.items} ordered={block.ordered} />;
                    case 'table':
                        return <TableBlock key={i} headers={block.headers} rows={block.rows} />;
                    case 'code':
                        return <CodeBlock key={i} language={block.language} code={block.code} />;
                    case 'callout':
                        return <CalloutBlock key={i} type={block.calloutType} title={block.title} content={block.content} />;
                    case 'source':
                        return <SourceBlock key={i} sources={block.sources} />;
                    case 'mindmap':
                        return <MindmapBlock key={i} data={block.data} />;
                    default:
                        return <ParagraphBlock key={i} content={block.content || JSON.stringify(block)} />;
                }
            })}
        </div>
    );
}

// ============================================================
// Ask 模式关键词检测：是否为写操作请求
// ============================================================
const WRITE_KEYWORDS = [
    '改代码', '修改', '写入', '创建文件', '删除', '重命名', '新建', '添加', '编辑',
    '写文件', '改文件', '替换', '重写', '覆盖', '移动', '部署', '执行',
    'write', 'create', 'delete', 'rename', 'modify', 'edit', 'deploy', 'execute', 'run'
];

export function detectWriteIntent(text) {
    const lower = text.toLowerCase();
    return WRITE_KEYWORDS.some(kw => lower.includes(kw));
}

// ============================================================
// 项目相关性判定（简单关键词 + 文件名匹配）
// ============================================================
export function isProjectRelated(text, fileNames = []) {
    const lower = text.toLowerCase();
    // 明确提到项目、代码、文件的
    const projectKeywords = ['项目', '代码', '文件', '源码', '配置', '架构', '组件', '模块', '函数', '接口', 'api',
        'component', 'module', 'config', 'package', 'import', 'export', 'class', 'function'];
    if (projectKeywords.some(kw => lower.includes(kw))) return true;
    // 提到了项目中的具体文件名
    if (fileNames.some(fn => lower.includes(fn.toLowerCase()))) return true;
    return false;
}



