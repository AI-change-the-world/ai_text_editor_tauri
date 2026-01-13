import { useState, useEffect } from 'react'
import { DocumentList } from '../documents/DocumentList'
import { SimpleEditor } from '../editor/SimpleEditor'
import { SettingsDialog } from '../settings/SettingsDialog'
import { useDocumentsStore } from '../../store/documents'
import { useSettingsStore } from '../../store/settings'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import {
    Settings,
    Save,
    FileText,
    Menu,
    X,
} from 'lucide-react'

export function MainLayout() {
    const { currentDocument, updateDocument } = useDocumentsStore()
    const { theme, loadSettings } = useSettingsStore()
    const [showSettings, setShowSettings] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)
    const [documentTitle, setDocumentTitle] = useState('')

    // Load settings on mount
    useEffect(() => {
        loadSettings()
    }, [loadSettings])

    // Update document title when current document changes
    useEffect(() => {
        if (currentDocument) {
            setDocumentTitle(currentDocument.title)
        }
    }, [currentDocument])

    // Apply theme
    useEffect(() => {
        const root = document.documentElement
        if (theme === 'dark') {
            root.classList.add('dark')
        } else if (theme === 'light') {
            root.classList.remove('dark')
        } else {
            // System theme
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            if (mediaQuery.matches) {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        }
    }, [theme])

    const handleTitleChange = async (newTitle: string) => {
        setDocumentTitle(newTitle)
        if (currentDocument && newTitle !== currentDocument.title) {
            await updateDocument(currentDocument.id, { title: newTitle })
        }
    }

    const handleContentChange = async (content: any[]) => {
        if (currentDocument) {
            await updateDocument(currentDocument.id, { content })
        }
    }

    const handleSaveDocument = () => {
        if (currentDocument) {
            // Force save (already handled by auto-save, but can be used for manual save)
            console.log('Document saved:', currentDocument.title)
        }
    }

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="md:hidden"
                        >
                            {showSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>

                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span className="font-semibold">AI 文本编辑器</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {currentDocument && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSaveDocument}
                                className="hidden sm:flex"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                保存
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowSettings(true)}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Document Title */}
                {currentDocument && (
                    <div className="px-4 pb-2">
                        <Input
                            value={documentTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="text-lg font-medium border-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="文档标题..."
                        />
                    </div>
                )}
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className={`${showSidebar ? 'block' : 'hidden'} md:block`}>
                    <DocumentList />
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col">
                    {currentDocument ? (
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="max-w-4xl mx-auto">
                                <SimpleEditor
                                    value={currentDocument.content}
                                    onChange={handleContentChange}
                                    placeholder="开始编写你的文档..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center">
                            <div className="space-y-4">
                                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                                <div>
                                    <h3 className="text-lg font-medium">欢迎使用 AI 文本编辑器</h3>
                                    <p className="text-muted-foreground">
                                        选择一个文档开始编辑，或创建一个新文档
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Dialog */}
            <SettingsDialog
                open={showSettings}
                onOpenChange={setShowSettings}
            />
        </div>
    )
}