import { useState, useEffect } from 'react'
import { workspaceAPI, fileAPI, searchAPI, windowAPI, type Workspace, type File } from '../services/database'
import { invoke } from '@tauri-apps/api/core'
import { migrateFromLocalStorage } from '../utils/migration'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { FileDialog } from '../components/FileDialog'

export default function MainWindow() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
    const [files, setFiles] = useState<File[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false)
    const [showFileDialog, setShowFileDialog] = useState(false)
    const [loading, setLoading] = useState(false)

    // 初始化：迁移旧数据
    useEffect(() => {
        const init = async () => {
            const migrated = await migrateFromLocalStorage()
            if (migrated) {
                alert('已成功从旧版本迁移数据！')
            }
            loadWorkspaces()
        }
        init()
    }, [])

    // 加载当前工作空间的文件
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
            setFiles(files.filter(f => f.id !== fileId))
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
        <div className="h-screen flex flex-col bg-gray-50">
            {/* 顶部栏 */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">📝</span>
                    <span className="font-semibold text-gray-800">云笺妙笔</span>
                </div>
                <button
                    onClick={() => windowAPI.openSettings()}
                    className="px-3 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
                >
                    ⚙️ 设置
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* 左侧：工作空间列表 */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                    <div className="p-3 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-semibold text-gray-600 uppercase">工作空间</h2>
                            <button
                                onClick={() => setShowWorkspaceDialog(true)}
                                className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                                title="新建工作空间"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2">
                        {workspaces.map((ws) => (
                            <div
                                key={ws.id}
                                onClick={() => setCurrentWorkspace(ws)}
                                className={`px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors ${currentWorkspace?.id === ws.id
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-gray-100'
                                    }`}
                            >
                                <div className="text-sm font-medium">{ws.name}</div>
                                {ws.description && (
                                    <div className="text-xs opacity-70 mt-0.5">{ws.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 右侧：文件列表 */}
                <div className="flex-1 flex flex-col">
                    {currentWorkspace ? (
                        <>
                            {/* 搜索栏 */}
                            <div className="bg-white border-b border-gray-200 p-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="搜索文档..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                                        >
                                            清除
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSearch}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                                    >
                                        搜索
                                    </button>
                                    <button
                                        onClick={() => setShowFileDialog(true)}
                                        className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                                    >
                                        + 新建文档
                                    </button>
                                </div>
                            </div>

                            {/* 文件列表 */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500">加载中...</div>
                                ) : files.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {searchQuery ? '没有找到匹配的文档' : '还没有文档，点击新建开始'}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                                onClick={() => handleOpenFile(file)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-800 mb-1">{file.title}</h3>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(file.updated_at).toLocaleString('zh-CN')}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteFile(file.id)
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                                {file.content && (
                                                    <div
                                                        className="text-sm text-gray-600 line-clamp-3"
                                                        dangerouslySetInnerHTML={{
                                                            __html: file.content.replace(/<[^>]*>/g, '').substring(0, 100),
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-6xl mb-4">📁</div>
                                <h3 className="text-xl font-medium text-gray-800 mb-2">选择或创建工作空间</h3>
                                <p className="text-gray-500">从左侧选择一个工作空间开始</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 工作空间对话框 */}
            {showWorkspaceDialog && (
                <WorkspaceDialog
                    onConfirm={handleCreateWorkspace}
                    onClose={() => setShowWorkspaceDialog(false)}
                />
            )}

            {/* 文件对话框 */}
            {showFileDialog && (
                <FileDialog
                    onConfirm={handleCreateFile}
                    onClose={() => setShowFileDialog(false)}
                />
            )}
        </div>
    )
}
