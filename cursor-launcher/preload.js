const { contextBridge, ipcRenderer } = require('electron');

// 安全地将主进程功能暴露给网页（渲染进程）
// 网页中可以通过 window.electronAPI.xxx() 来调用这些功能
contextBridge.exposeInMainWorld('electronAPI', {
    // 打开系统文件夹选择对话框，返回 { name, path } 或 null
    openFolderDialog: () => ipcRenderer.invoke('dialog:openFolder'),

    // 读取指定路径下的文件/文件夹列表
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),

    // 递归读取整个项目文件树
    readFileTree: (rootPath) => ipcRenderer.invoke('fs:readFileTree', rootPath),

    // 读取单个文件内容
    readFileContent: (filePath) => ipcRenderer.invoke('fs:readFileContent', filePath),

    // 用 Cursor 编辑器打开指定文件夹
    openInCursor: (folderPath) => ipcRenderer.invoke('shell:openInCursor', folderPath),

    // 在文件管理器中显示文件夹
    showInExplorer: (folderPath) => ipcRenderer.invoke('shell:showInExplorer', folderPath),

    // 获取持久化的最近项目列表
    getRecentProjects: () => ipcRenderer.invoke('store:getRecent'),

    // 保存最近项目列表
    saveRecentProjects: (list) => ipcRenderer.invoke('store:saveRecent', list),

    // 窗口控制
    windowMinimize: () => ipcRenderer.send('window:minimize'),
    windowToggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
    windowClose: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

    // --- 文件操作 API（右键菜单功能） ---
    createFile: (filePath) => ipcRenderer.invoke('fs:createFile', filePath),
    createFolder: (folderPath) => ipcRenderer.invoke('fs:createFolder', folderPath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    deleteItem: (targetPath) => ipcRenderer.invoke('fs:delete', targetPath),
    openTerminal: (dirPath) => ipcRenderer.invoke('shell:openTerminal', dirPath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),

    // --- Agent 模式：在项目目录执行命令并返回输出 ---
    agentRunCommand: (params) => ipcRenderer.invoke('agent:runCommand', params),

    // --- 模型管理 API ---
    modelList: () => ipcRenderer.invoke('model:list'),
    modelCreate: (data) => ipcRenderer.invoke('model:create', data),
    modelUpdate: (id, updates) => ipcRenderer.invoke('model:update', id, updates),
    modelDelete: (id) => ipcRenderer.invoke('model:delete', id),
    modelParse: (raw, type) => ipcRenderer.invoke('model:parse', raw, type),
    modelDuplicate: (id) => ipcRenderer.invoke('model:duplicate', id),

    // --- 会话管理 API ---
    chatList: () => ipcRenderer.invoke('chat:list'),
    chatGet: (id) => ipcRenderer.invoke('chat:get', id),
    chatCreate: (data) => ipcRenderer.invoke('chat:create', data),
    chatUpdate: (id, updates) => ipcRenderer.invoke('chat:update', id, updates),
    chatDelete: (id) => ipcRenderer.invoke('chat:delete', id),
    chatExport: (id, format) => ipcRenderer.invoke('chat:export', id, format),

    // --- LLM 统一网关 ---
    llmChat: (params) => ipcRenderer.invoke('llm:chat', params),

    // --- LLM 流式网关 ---
    llmStream: (params) => ipcRenderer.send('llm:stream', params),
    llmStreamAbort: (requestId) => ipcRenderer.send('llm:stream-abort', { requestId }),
    onStreamChunk: (callback) => {
        const handler = (_e, data) => callback(data);
        ipcRenderer.on('llm:stream-chunk', handler);
        return handler;
    },
    onStreamDone: (callback) => {
        const handler = (_e, data) => callback(data);
        ipcRenderer.on('llm:stream-done', handler);
        return handler;
    },
    onStreamError: (callback) => {
        const handler = (_e, data) => callback(data);
        ipcRenderer.on('llm:stream-error', handler);
        return handler;
    },
    removeStreamListener: (channel, handler) => {
        ipcRenderer.removeListener(channel, handler);
    },
    removeAllStreamListeners: () => {
        ipcRenderer.removeAllListeners('llm:stream-chunk');
        ipcRenderer.removeAllListeners('llm:stream-done');
        ipcRenderer.removeAllListeners('llm:stream-error');
    },

    // --- 模式配置 ---
    modeConfigGet: () => ipcRenderer.invoke('modeConfig:get'),
    modeConfigSave: (config) => ipcRenderer.invoke('modeConfig:save', config),

    // --- 项目只读检索 API（Ask 模式） ---
    projectSearch: (projectPath, query) => ipcRenderer.invoke('project:search', projectPath, query),
    projectReadSnippet: (filePath, startLine, endLine) => ipcRenderer.invoke('project:readSnippet', filePath, startLine, endLine),
    projectListFiles: (projectPath) => ipcRenderer.invoke('project:listFiles', projectPath),
});
