import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { fileAPI, type File } from '../services/database'
import { useSettingsStore } from '../store/settings'
import { callAI } from '../services/ai'
import { SlashCommand } from '../extensions/SlashCommand'
import { AIEditPopover } from '../components/AIEditPopover'

// 复用之前的工具栏组件
function EditorToolbar({ editor, onAIEdit }: { editor: any; onAIEdit: () => void }) {
    if (!editor) return null

    return (
        <div className="border-b border-gray-200/60 px-2 py-1.5 bg-gray-50/50 flex items-center gap-1 flex-wrap">
            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                    title="加粗"
                >
                    <strong>B</strong>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                    title="斜体"
                >
                    <em>I</em>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                    title="删除线"
                >
                    <s>S</s>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('code') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                    title="代码"
                >
                    {'</>'}
                </button>
            </div>

            <div className="w-px h-4 bg-gray-300/60" />

            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    H1
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    H2
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    H3
                </button>
            </div>

            <div className="w-px h-4 bg-gray-300/60" />

            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    •
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    1.
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    "
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                        }`}
                >
                    {'{ }'}
                </button>
            </div>

            <div className="flex-1" />

            <button
                onClick={onAIEdit}
                className="px-2.5 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors font-medium shadow-sm"
            >
                ✨ AI
            </button>
        </div>
    )
}

function FloatingToolbar({
    editor,
    position,
    onAIEdit,
}: {
    editor: any
    position: { top: number; left: number } | null
    onAIEdit: () => void
}) {
    if (!position || !editor) return null

    return (
        <div
            className="fixed bg-white/95 backdrop-blur-xl shadow-xl rounded-lg border border-gray-200/80 flex overflow-hidden z-40 animate-fadeIn"
            style={{ top: position.top - 42, left: position.left }}
        >
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
            >
                <strong>B</strong>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
            >
                <em>I</em>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
            >
                <s>S</s>
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('code') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
                    }`}
            >
                {'</>'}
            </button>
            <div className="w-px bg-gray-200/60" />
            <button
                onClick={onAIEdit}
                className="px-2.5 py-1.5 text-xs hover:bg-purple-50 text-purple-600 transition-colors font-medium"
            >
                ✨ AI
            </button>
        </div>
    )
}

export default function EditorWindow() {
    const { fileId } = useParams<{ fileId: string }>()
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedText, setSelectedText] = useState('')
    const [aiPopoverPosition, setAIPopoverPosition] = useState<{ top: number; left: number } | null>(null)
    const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(1)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: '开始编写... (输入 / 显示命令)',
            }),
            CharacterCount,
            SlashCommand,
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // 自动保存（防抖）
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
            saveTimeoutRef.current = setTimeout(() => {
                handleSave(editor.getHTML())
            }, 1000)
        },
        onSelectionUpdate: ({ editor }) => {
            const { from, to } = editor.state.selection
            if (from !== to) {
                const text = editor.state.doc.textBetween(from, to, ' ')
                setSelectedText(text)

                const selection = window.getSelection()
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0)
                    const rect = range.getBoundingClientRect()
                    setToolbarPosition({
                        top: rect.top + window.scrollY,
                        left: rect.left + rect.width / 2 - 100,
                    })
                }
            } else {
                setSelectedText('')
                setToolbarPosition(null)
            }
        },
    })

    // 加载文件
    useEffect(() => {
        if (fileId) {
            loadFile(fileId)
        }
    }, [fileId])

    // 监听 AI 编辑事件
    useEffect(() => {
        const handleOpenAIEdit = () => {
            if (editor) {
                const { view } = editor
                const { from } = view.state.selection
                const coords = view.coordsAtPos(from)
                setAIPopoverPosition({ top: coords.top, left: coords.left })
            }
        }
        window.addEventListener('openAIEdit', handleOpenAIEdit)
        return () => window.removeEventListener('openAIEdit', handleOpenAIEdit)
    }, [editor])

    const loadFile = async (id: string) => {
        try {
            setLoading(true)
            const data = await fileAPI.get(id)
            if (data) {
                setFile(data)
                if (editor && data.content) {
                    editor.commands.setContent(data.content)
                }
            }
        } catch (error) {
            alert('加载失败：' + error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (content: string) => {
        if (!file) return

        try {
            setSaving(true)
            await fileAPI.update(file.id, { content })
        } catch (error) {
            console.error('保存失败：', error)
        } finally {
            setSaving(false)
        }
    }

    const handleTitleChange = async (title: string) => {
        if (!file) return

        try {
            await fileAPI.update(file.id, { title })
            setFile({ ...file, title })
        } catch (error) {
            alert('更新失败：' + error)
        }
    }

    const handleAIEdit = () => {
        if (editor) {
            const { view } = editor
            const { from } = view.state.selection
            const coords = view.coordsAtPos(from)
            setAIPopoverPosition({ top: coords.top, left: coords.left })
        }
    }

    const handleApplyAIResult = (text: string) => {
        if (editor) {
            editor.chain().focus().insertContent(text).run()
        }
        setAIPopoverPosition(null)
        setSelectedText('')
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        )
    }

    if (!file) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-gray-500">文件不存在</div>
            </div>
        )
    }

    const charCount = editor?.storage.characterCount.characters() || 0
    const wordCount = editor?.storage.characterCount.words() || 0

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* 标题栏 */}
            <div className="border-b border-gray-200 px-4 py-2">
                <input
                    type="text"
                    value={file.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="text-lg font-semibold w-full border-none outline-none bg-transparent"
                    placeholder="文档标题..."
                />
                {saving && <span className="text-xs text-gray-400">保存中...</span>}
            </div>

            {/* 编辑器 */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {editor && <EditorToolbar editor={editor} onAIEdit={handleAIEdit} />}

                <FloatingToolbar editor={editor} position={toolbarPosition} onAIEdit={handleAIEdit} />

                <div className="flex-1 overflow-y-auto px-4 py-3">
                    <EditorContent editor={editor} className="prose max-w-none" />
                </div>

                {/* 字数统计 */}
                <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                        <span>{charCount} 字符</span>
                        <span>{wordCount} 词</span>
                    </div>
                    <div>{new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>

            {/* AI 编辑浮窗 */}
            {aiPopoverPosition && (
                <AIEditPopover
                    position={aiPopoverPosition}
                    selectedText={selectedText}
                    onApply={handleApplyAIResult}
                    onClose={() => setAIPopoverPosition(null)}
                />
            )}
        </div>
    )
}
