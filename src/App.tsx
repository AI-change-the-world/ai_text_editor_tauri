import { useState, useCallback, useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useDocumentsStore } from './store/documents'
import { useSettingsStore } from './store/settings'
import { callAI } from './services/ai'
import { SlashCommand } from './extensions/SlashCommand'
import { AIEditPopover } from './components/AIEditPopover'
import './index.css'

// 文档列表组件
function DocumentList() {
  const {
    getFilteredDocuments,
    currentDocumentId,
    setCurrentDocument,
    createDocument,
    deleteDocument,
    searchQuery,
    setSearchQuery
  } = useDocumentsStore()

  const documents = getFilteredDocuments()

  return (
    <div className="w-52 border-r border-gray-200/80 bg-gray-50/50 backdrop-blur-xl flex flex-col h-full">
      <div className="px-3 py-2.5 border-b border-gray-200/80">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">文档</h2>
          <button
            onClick={() => createDocument()}
            className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-all shadow-sm"
            title="新建文档"
          >
            +
          </button>
        </div>
        <input
          type="text"
          placeholder="搜索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-gray-300/60 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/80"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {documents.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-6 px-2">
            {searchQuery ? '无匹配文档' : '暂无文档'}
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setCurrentDocument(doc.id)}
              className={`px-2.5 py-2 rounded-lg cursor-pointer mb-1.5 transition-all group ${currentDocumentId === doc.id
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white hover:shadow-sm'
                }`}
            >
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-medium truncate flex-1 ${currentDocumentId === doc.id ? 'text-white' : 'text-gray-800'
                  }`}>
                  {doc.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定删除？')) {
                      deleteDocument(doc.id)
                    }
                  }}
                  className={`opacity-0 group-hover:opacity-100 ml-1.5 text-sm transition-opacity ${currentDocumentId === doc.id ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-red-500'
                    }`}
                >
                  ×
                </button>
              </div>
              <p className={`text-[10px] mt-0.5 ${currentDocumentId === doc.id ? 'text-white/70' : 'text-gray-400'
                }`}>
                {new Date(doc.updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// 设置面板组件
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { aiProviders, updateProvider, setDefaultProvider, defaultProviderId } = useSettingsStore()
  const [showKey, setShowKey] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-lg max-h-[70vh] overflow-hidden animate-slideIn">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80">
          <h2 className="text-sm font-semibold text-gray-800">设置</h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)]">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">AI 提供商</h3>

          {aiProviders.map((provider) => (
            <div key={provider.id} className="border border-gray-200/80 rounded-lg p-3 mb-3 bg-white/60">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-gray-800">{provider.name}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={(e) => updateProvider(provider.id, { enabled: e.target.checked })}
                      className="rounded w-3.5 h-3.5"
                    />
                    启用
                  </label>
                  <button
                    onClick={() => setDefaultProvider(provider.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${defaultProviderId === provider.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                  >
                    {defaultProviderId === provider.id ? '默认' : '设为默认'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">API Key</label>
                  <div className="flex gap-1.5">
                    <input
                      type={showKey === provider.id ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                      className="flex-1 px-2.5 py-1.5 border border-gray-300/60 rounded-md text-xs bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="输入 API Key"
                    />
                    <button
                      onClick={() => setShowKey(showKey === provider.id ? null : provider.id)}
                      className="px-2.5 py-1.5 border border-gray-300/60 rounded-md text-xs hover:bg-gray-50 transition-colors"
                    >
                      {showKey === provider.id ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">Base URL</label>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300/60 rounded-md text-xs bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-500 mb-1 block">模型</label>
                  <input
                    type="text"
                    value={provider.model}
                    onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300/60 rounded-md text-xs bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// AI 编辑对话框
function AIEditDialog({
  selectedText,
  onApply,
  onClose
}: {
  selectedText: string
  onApply: (text: string) => void
  onClose: () => void
}) {
  const [instruction, setInstruction] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const { getActiveProvider } = useSettingsStore()

  const quickPrompts = ['修正语法', '改写简洁', '翻译成英文', '扩展内容', '总结要点']

  const handleSubmit = async () => {
    const provider = getActiveProvider()
    if (!provider) {
      alert('请先在设置中配置并启用 AI 提供商')
      return
    }

    setLoading(true)
    try {
      const response = await callAI(provider, {
        instruction,
        selectedText,
      })
      setResult(response)
    } catch (error) {
      alert('AI 请求失败: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md animate-slideIn">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/80">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 text-gray-800">
            <span className="text-base">✨</span> AI 编辑
          </h2>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          {selectedText && (
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">选中的文本</label>
              <div className="p-2.5 bg-gray-100/80 rounded-lg text-xs max-h-20 overflow-y-auto text-gray-700">
                {selectedText}
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">编辑指令</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300/60 rounded-lg text-xs resize-none bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="输入你想要的编辑指令..."
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInstruction(prompt)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[11px] text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {result && (
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">AI 结果</label>
              <div className="p-2.5 bg-green-50/80 border border-green-200/60 rounded-lg text-xs max-h-28 overflow-y-auto text-gray-700">
                {result}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300/60 rounded-lg text-xs hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            {result ? (
              <button
                onClick={() => onApply(result)}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600 transition-colors shadow-sm"
              >
                应用
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!instruction || loading}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? '处理中...' : '开始编辑'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 固定工具栏组件
function EditorToolbar({ editor, onAIEdit }: { editor: any; onAIEdit: () => void }) {
  if (!editor) return null

  return (
    <div className="border-b border-gray-200/60 px-2 py-1.5 bg-gray-50/50 flex items-center gap-1 flex-wrap">
      {/* 文本格式 */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="加粗 (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="斜体 (Cmd+I)"
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

      {/* 标题 */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="标题 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="标题 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="标题 3"
        >
          H3
        </button>
      </div>

      <div className="w-px h-4 bg-gray-300/60" />

      {/* 列表 */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="无序列表"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('orderedList') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="有序列表"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="引用"
        >
          "
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors ${editor.isActive('codeBlock') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'
            }`}
          title="代码块"
        >
          {'{ }'}
        </button>
      </div>

      <div className="w-px h-4 bg-gray-300/60" />

      {/* 其他 */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors text-gray-700"
          title="分隔线"
        >
          —
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors text-gray-700 disabled:opacity-30"
          title="撤销 (Cmd+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-200/60 transition-colors text-gray-700 disabled:opacity-30"
          title="重做 (Cmd+Shift+Z)"
        >
          ↷
        </button>
      </div>

      <div className="flex-1" />

      {/* AI 按钮 */}
      <button
        onClick={onAIEdit}
        className="px-2.5 py-1 text-xs rounded bg-purple-500 text-white hover:bg-purple-600 transition-colors font-medium shadow-sm"
        title="AI 编辑"
      >
        ✨ AI
      </button>
    </div>
  )
}

// 浮动工具栏组件
function FloatingToolbar({
  editor,
  position,
  onAIEdit
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
        className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        title="加粗"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        title="斜体"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        title="删除线"
      >
        <s>S</s>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-2.5 py-1.5 text-xs hover:bg-gray-100 transition-colors ${editor.isActive('code') ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
        title="代码"
      >
        {'</>'}
      </button>
      <div className="w-px bg-gray-200/60" />
      <button
        onClick={onAIEdit}
        className="px-2.5 py-1.5 text-xs hover:bg-purple-50 text-purple-600 transition-colors font-medium"
        title="AI 编辑"
      >
        ✨ AI
      </button>
    </div>
  )
}

// Tiptap 编辑器组件
function TiptapEditor({
  content,
  onUpdate,
  onSelectionChange,
  onAIEdit
}: {
  content: string
  onUpdate: (html: string) => void
  onSelectionChange: (text: string) => void
  onAIEdit: (position: { top: number; left: number }) => void
}) {
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始编写... (输入 / 显示命令)',
      }),
      CharacterCount,
      SlashCommand,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ')
        onSelectionChange(text)

        // 计算浮动工具栏位置
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
        onSelectionChange('')
        setToolbarPosition(null)
      }
    },
    onBlur: () => {
      // 延迟隐藏工具栏，以便点击工具栏按钮时不会立即消失
      setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) {
          setToolbarPosition(null)
        }
      }, 200)
    },
  })

  // 监听 AI 编辑事件（从 Slash Command 触发）
  useEffect(() => {
    const handleOpenAIEdit = () => {
      if (editor) {
        const { view } = editor
        const { from } = view.state.selection
        const coords = view.coordsAtPos(from)

        onAIEdit({
          top: coords.top,
          left: coords.left,
        })
      }
    }
    window.addEventListener('openAIEdit', handleOpenAIEdit)
    return () => window.removeEventListener('openAIEdit', handleOpenAIEdit)
  }, [editor, onAIEdit])

  // 当 content 变化时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  const charCount = editor.storage.characterCount.characters()
  const wordCount = editor.storage.characterCount.words()

  const handleAIEditClick = () => {
    const { view } = editor
    const { from } = view.state.selection
    const coords = view.coordsAtPos(from)

    onAIEdit({
      top: coords.top,
      left: coords.left,
    })
  }

  return (
    <div ref={containerRef} className="relative h-full flex flex-col">
      {/* 固定工具栏 */}
      <EditorToolbar editor={editor} onAIEdit={handleAIEditClick} />

      {/* 浮动工具栏（选中文本时显示） */}
      <FloatingToolbar
        editor={editor}
        position={toolbarPosition}
        onAIEdit={handleAIEditClick}
      />

      <div className="flex-1 overflow-y-auto px-1 py-2">
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>

      {/* 字数统计 */}
      <div className="sticky bottom-0 px-3 py-1.5 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-3">
          <span>{charCount} 字符</span>
          <span>{wordCount} 词</span>
        </div>
        <div className="text-gray-300">
          {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

// 主应用
export default function App() {
  const { getCurrentDocument, updateDocument, currentDocumentId } = useDocumentsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [aiPopoverPosition, setAIPopoverPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')

  const currentDocument = getCurrentDocument()

  const handleContentChange = useCallback((content: string) => {
    if (currentDocumentId) {
      updateDocument(currentDocumentId, { content })
    }
  }, [currentDocumentId, updateDocument])

  const handleTitleChange = (title: string) => {
    if (currentDocumentId) {
      updateDocument(currentDocumentId, { title })
    }
  }

  const handleAIEdit = (position: { top: number; left: number }) => {
    setAIPopoverPosition(position)
  }

  const handleApplyAIResult = (text: string) => {
    // 直接插入文本到光标位置
    navigator.clipboard.writeText(text)
    alert('AI 结果已复制到剪贴板，请粘贴到编辑器')
    setAIPopoverPosition(null)
    setSelectedText('')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50/30">
      {/* Header */}
      <header className="border-b border-gray-200/80 px-3 py-2 flex items-center justify-between bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <span className="text-sm font-semibold text-gray-800">AI 文本编辑器</span>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="px-2.5 py-1 border border-gray-300/60 text-xs rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <span>⚙️</span>
          <span>设置</span>
        </button>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <DocumentList />

        <div className="flex-1 flex flex-col bg-white">
          {currentDocument ? (
            <>
              <div className="px-4 py-2.5 border-b border-gray-200/80">
                <input
                  type="text"
                  value={currentDocument.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-base font-semibold w-full border-none outline-none bg-transparent text-gray-800 placeholder-gray-400"
                  placeholder="文档标题..."
                />
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                <TiptapEditor
                  content={currentDocument.content}
                  onUpdate={handleContentChange}
                  onSelectionChange={setSelectedText}
                  onAIEdit={handleAIEdit}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="text-5xl mb-3 opacity-40">📄</div>
                <h3 className="text-base font-medium text-gray-700 mb-1.5">
                  欢迎使用 AI 文本编辑器
                </h3>
                <p className="text-xs text-gray-400">
                  选择或创建一个文档开始编辑
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
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