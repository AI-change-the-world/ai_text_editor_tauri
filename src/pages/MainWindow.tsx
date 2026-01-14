import { useState, useEffect } from 'react'
import {
    workspaceAPI,
    fileAPI,
    searchAPI,
    windowAPI,
    type Workspace,
    type File,
} from '../services/database'
import { invoke } from '@tauri-apps/api/core'
import { migrateFromLocalStorage } from '../utils/migration'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { FileDialog } from '../components/FileDialog'
import { WelcomeModal } from '../components/WelcomeModal'

export default function MainWindow() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [allRecentFiles, setAllRecentFiles] = useState<File[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false)
    const [showFileDialog, setShowFileDialog] = useState(false)
    const [showWelcome, setShowWelcome] = useState(true)
    const [loading, setLoading] = useState(false)

    // 初始化
    useEffect(() => {
        const init = async () => {
            const migrated = await migrateFromLocalStorage()
            if (migrated) {
                alert('已成功从旧版本迁移数据！')
            }
            await loadWorkspaces()
            await loadAllRecentFiles()
        }
        init()

        // ESC 关闭欢迎弹窗
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowWelcome(false)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        if (currentWorkspace) {
            loadFiles(currentWorkspace.id)
        }
    }, [currentWorkspace])

    const loadWorkspaces = async () => {
        try {
            const ws = await workspaceAPI.list()
            setWorkspaces(ws)
            if (ws.length > 0 && !currentWorkspace) {
                setCurrentWorkspace(ws[0])
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error)
        }
    }

    const loadFiles = async (workspaceId: string) => {
        try {
            setLoading(true)
            const fileList = await fileAPI.listByWorkspace(workspaceId)
            setFiles(fileList)
        } catch (error) {
            console.error('Failed to load files:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadAllRecentFiles = async () => {
        try {
            // 获取所有工作空间的最近文件
            const ws = await workspaceAPI.list()
            const allFiles: File[] = []
            for (const w of ws.slice(0, 3)) {
                const files = await fileAPI.listByWorkspace(w.id)
                allFiles.push(...files)
            }
            // 按更新时间排序
            allFiles.sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            setAllRecentFiles(allFiles.slice(0, 10))
        } catch (error) {
            console.error('Failed to load recent files:', error)
        }
    }

    const handleCreateWorkspace = async (name: string, description?: string) => {
        try {
            const ws = await workspaceAPI.create(name, description)
            setWorkspaces([ws, ...workspaces])
            setCurrentWorkspace(ws)
            setShowWorkspaceDialog(false)
        } catch (error) {
            alert('创建失败：' + error)
        }
    }

    const handleCreateFile = async (title: string) => {
        if (!currentWorkspace) {
            alert('请先选择工作空间')
            return
        }
        try {
            const file = await fileAPI.create({
                workspace_id: currentWorkspace.id,
                file_type: 'document',
                title,
                content: '<p></p>',
            })
            setFiles([file, ...files])
            setShowFileDialog(false)
        } catch (error) {
            alert('创建失败：' + error)
        }
    }

    const handleOpenFile = async (file: File) => {
        try {
            await invoke('open_editor_window', { fileId: file.id })
        } catch (error) {
            alert('打开失败：' + error)
        }
    }

    const handleDeleteFile = async (fileId: string) => {
        if (!confirm('确定删除？')) return
        try {
            await fileAPI.delete(fileId)
            setFiles(files.filter((f) => f.id !== fileId))
        } catch (error) {
            alert('删除失败：' + error)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim() || !currentWorkspace) return
        try {
            setLoading(true)
            const results = await searchAPI.search({
                query: searchQuery,
                workspace_id: currentWorkspace.id,
                limit: 50,
            })
            setFiles(results as any)
        } catch (error) {
            alert('搜索失败：' + error)
        } finally {
            setLoading(false)
        }
    }

    const handleClearSearch = () => {
        setSearchQuery('')
        if (currentWorkspace) {
            loadFiles(currentWorkspace.id)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* 装饰性背景 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            {/* 顶部栏 */}
            <header className="relative z-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-white text-lg">✨</span>
                    </div>
                    <div>
                        <span className="font-bold text-slate-800 dark:text-white tracking-tight">
                            云笺妙笔
                        </span>
                        <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                            AI 写作助手
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => windowAPI.openSettings()}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-xl transition-all hover:shadow-md"
                >
                    <span>⚙️</span>
                    <span>设置</span>
                </button>
            </header>

            <div className="relative z-10 flex-1 flex overflow-hidden">
                {/* 左侧：工作空间列表 */}
                <div className="w-64 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col">
                    <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                工作空间
                            </h2>
                            <button
                                onClick={() => setShowWorkspaceDialog(true)}
                                className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
                                title="新建工作空间"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => setCurrentWorkspace(ws)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentWorkspace?.id === ws.id
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-lg ${currentWorkspace?.id === ws.id ? 'opacity-100' : 'opacity-60'
                                            }`}
                                    >
                                        📁
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{ws.name}</div>
                                        {ws.description && (
                                            <div
                                                className={`text-xs truncate mt-0.5 ${currentWorkspace?.id === ws.id
                                                        ? 'text-white/70'
                                                        : 'text-slate-400 dark:text-slate-500'
                                                    }`}
                                            >
                                                {ws.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 右侧：文件列表 */}
                <div className="flex-1 flex flex-col">
                    {currentWorkspace ? (
                        <>
                            {/* 搜索栏 */}
                            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            🔍
                                        </span>
                                        <input
                                            type="text"
                                            placeholder="搜索文档..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        />
                                    </div>
                                    {searchQuery && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm transition-all"
                                        >
                                            清除
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowFileDialog(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
                                    >
                                        <span>+</span>
                                        <span>新建文档</span>
                                    </button>
                                </div>
                            </div>

                            {/* 文件列表 */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                ) : files.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl mb-4">
                                            {searchQuery ? '🔍' : '📝'}
                                        </div>
                                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {searchQuery ? '没有找到匹配的文档' : '还没有文档'}
                                        </h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-500">
                                            {searchQuery ? '试试其他关键词' : '点击新建开始创作'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => handleOpenFile(file)}
                                                className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer hover:-translate-y-1"
                                            >
                                                {/* 悬浮光效 */}
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="relative">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-xl flex items-center justify-center">
                                                                <span className="text-lg">📄</span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">
                                                                    {file.title}
                                                                </h3>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                    {new Date(file.updated_at).toLocaleString('zh-CN', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteFile(file.id)
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                    {file.content && (
                                                        <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {file.content.replace(/<[^>]*>/g, '').substring(0, 80) ||
                                                                '空文档'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center text-5xl mb-6 mx-auto shadow-xl">
                                    📁
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    选择或创建工作空间
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    从左侧选择一个工作空间开始
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 欢迎弹窗 */}
            {showWelcome && (
                <WelcomeModal
                    recentFiles={allRecentFiles}
                    onOpenFile={handleOpenFile}
                    onClose={() => setShowWelcome(false)}
                />
            )}

            {/* 工作空间对话框 */}
            {showWorkspaceDialog && (
                <WorkspaceDialog
                    onConfirm={handleCreateWorkspace}
                    onClose={() => setShowWorkspaceDialog(false)}
                />
            )}

            {/* 文件对话框 */}
            {showFileDialog && (
                <FileDialog onConfirm={handleCreateFile} onClose={() => setShowFileDialog(false)} />
            )}
        </div>
    )
}
