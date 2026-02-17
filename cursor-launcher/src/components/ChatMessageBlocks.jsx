import React, { useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';

// ============================================================
// 纯文本轻量解析器 — 将原始 AI 文本解析为 blocks
// 支持：段落、代码块（```）、diff 块、列表
// ============================================================
export function parseTextToBlocks(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // --- 代码块 / diff 块 ---
        if (line.trimStart().startsWith('```')) {
            const langMatch = line.trimStart().match(/^```(\w*)/);
            const lang = langMatch?.[1] || '';
            const isDiff = lang === 'diff';
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```

            if (isDiff) {
                blocks.push({ type: 'diff', lines: codeLines });
            } else {
                blocks.push({ type: 'code', language: lang, code: codeLines.join('\n') });
            }
            continue;
        }

        // --- 分隔线 ---
        if (/^[-=]{3,}$/.test(line.trim())) {
            blocks.push({ type: 'divider' });
            i++;
            continue;
        }

        // --- 空行 ---
        if (line.trim() === '') {
            i++;
            continue;
        }

        // --- 收集连续文本行（段落） ---
        const paraLines = [];
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].trimStart().startsWith('```') && !/^[-=]{3,}$/.test(lines[i].trim())) {
            paraLines.push(lines[i]);
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push({ type: 'text', content: paraLines.join('\n') });
        }
    }

    return blocks;
}

// ============================================================
// Diff 行解析
// ============================================================
function parseDiffLines(rawLines) {
    // 从 diff 行中提取文件名
    let fileName = null;
    let addCount = 0;
    let delCount = 0;
    const parsed = [];

    for (const raw of rawLines) {
        if (raw.startsWith('---') || raw.startsWith('+++')) {
            // 文件头
            const fMatch = raw.match(/^[+-]{3}\s+[ab]\/(.+)/);
            if (fMatch) fileName = fMatch[1];
            continue;
        }
        if (raw.startsWith('@@')) {
            // hunk header
            parsed.push({ type: 'hunk', text: raw });
            continue;
        }
        if (raw.startsWith('+')) {
            addCount++;
            parsed.push({ type: 'add', text: raw.substring(1) });
        } else if (raw.startsWith('-')) {
            delCount++;
            parsed.push({ type: 'del', text: raw.substring(1) });
        } else {
            parsed.push({ type: 'neutral', text: raw.startsWith(' ') ? raw.substring(1) : raw });
        }
    }

    return { fileName, addCount, delCount, lines: parsed };
}

// ============================================================
// 内联格式渲染
// ============================================================
function renderInline(text) {
    if (!text) return null;
    const parts = [];
    let key = 0;
    const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)/g;
    let lastIdx = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
            parts.push(<span key={key++}>{text.slice(lastIdx, match.index)}</span>);
        }
        if (match[1]) {
            parts.push(<strong key={key++}>{match[2]}</strong>);
        } else if (match[3]) {
            parts.push(<span key={key++} className="chat-inline-code">{match[4]}</span>);
        }
        lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIdx)}</span>);
    }
    return parts.length > 0 ? parts : text;
}

// ============================================================
// MessageTextBlock
// ============================================================
export const MessageTextBlock = ({ content }) => (
    <div className="chat-text-block">{renderInline(content)}</div>
);

// ============================================================
// MessageCodeBlock
// ============================================================
export const MessageCodeBlock = ({ language, code }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard?.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="chat-code-block">
            <div className="chat-code-header">
                <span className="chat-code-lang">{language || 'code'}</span>
                <button className="chat-code-copy" onClick={handleCopy}>
                    {copied ? <><Check size={9} className="inline mr-0.5" />Copied</> : <><Copy size={9} className="inline mr-0.5" />Copy</>}
                </button>
            </div>
            <div className="chat-code-body">
                <pre><code>{code}</code></pre>
            </div>
        </div>
    );
};

// ============================================================
// DiffFileCard — 文件变更卡片（增删行高亮）
// ============================================================
export const DiffFileCard = ({ rawLines }) => {
    const { fileName, addCount, delCount, lines } = parseDiffLines(rawLines);
    let lineNum = 0;

    return (
        <div className="diff-card">
            <div className="diff-card-header">
                <FileText className="diff-card-file-icon" size={14} />
                <span className="diff-card-filename">{fileName || 'file'}</span>
                <div className="diff-card-stat">
                    {addCount > 0 && <span className="diff-stat-add">+{addCount}</span>}
                    {delCount > 0 && <span className="diff-stat-del">-{delCount}</span>}
                </div>
            </div>
            <div className="diff-card-body">
                {lines.map((dl, i) => {
                    if (dl.type === 'hunk') {
                        const hunkMatch = dl.text.match(/@@ -\d+(?:,\d+)? \+(\d+)/);
                        if (hunkMatch) lineNum = parseInt(hunkMatch[1], 10) - 1;
                        return (
                            <div key={i} className="diff-line diff-line--neutral" style={{ background: 'var(--code-header-bg)' }}>
                                <div className="diff-gutter" style={{ width: '52px' }}>···</div>
                                <div className="diff-content" style={{ color: 'var(--chat-text-dim)', fontSize: '10px' }}>{dl.text}</div>
                            </div>
                        );
                    }
                    if (dl.type !== 'del') lineNum++;
                    const lineClass = dl.type === 'add' ? 'diff-line--add' : dl.type === 'del' ? 'diff-line--del' : 'diff-line--neutral';
                    const marker = dl.type === 'add' ? '+' : dl.type === 'del' ? '-' : ' ';
                    return (
                        <div key={i} className={`diff-line ${lineClass}`}>
                            <div className="diff-gutter">{dl.type !== 'del' ? lineNum : ''}</div>
                            <div className="diff-marker">{marker}</div>
                            <div className="diff-content">{dl.text}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================
// SectionDivider
// ============================================================
export const SectionDivider = ({ label }) => (
    <div className="chat-section-divider">
        {label && <span className="chat-section-divider-label">{label}</span>}
    </div>
);

// ============================================================
// ChatMessageRenderer — 完整消息渲染器
// 输入: msg 对象 (可含 .blocks 或 .text)
// ============================================================
export default function ChatMessageRenderer({ msg, chatMode }) {
    const isAI = msg.role === 'ai';

    // 确定渲染的 blocks
    let blocks;
    if (msg.blocks) {
        // 已有结构化 blocks（来自 RichAnswerRenderer 等）
        blocks = null; // 用 RichAnswerRenderer 处理
    } else if (msg.text) {
        blocks = parseTextToBlocks(msg.text);
    } else {
        blocks = [];
    }

    return (
        <div className="chat-message chat-message-enter">
            <div className="chat-message-header">
                <div className={`chat-avatar ${isAI ? 'chat-avatar--ai' : 'chat-avatar--user'}`}>
                    {isAI ? 'AI' : 'U'}
                </div>
                <span className="chat-role-label">{isAI ? 'Cursor' : 'You'}</span>
                {isAI && chatMode === 'chat' && (
                    <span style={{
                        fontSize: '9px',
                        color: 'var(--callout-success-text)',
                        background: 'var(--callout-success-bg)',
                        border: '1px solid var(--callout-success-border)',
                        borderRadius: '3px',
                        padding: '0 4px',
                        lineHeight: '16px'
                    }}>Ask</span>
                )}
            </div>
            <div className="chat-message-body">
                {/* 已有 blocks 的消息由外层 RichAnswerRenderer 处理 */}
                {msg.blocks ? null : (
                    blocks.map((block, i) => {
                        switch (block.type) {
                            case 'text':
                                return <MessageTextBlock key={i} content={block.content} />;
                            case 'code':
                                return <MessageCodeBlock key={i} language={block.language} code={block.code} />;
                            case 'diff':
                                return <DiffFileCard key={i} rawLines={block.lines} />;
                            case 'divider':
                                return <SectionDivider key={i} />;
                            default:
                                return <MessageTextBlock key={i} content={block.content || ''} />;
                        }
                    })
                )}
            </div>
        </div>
    );
}
