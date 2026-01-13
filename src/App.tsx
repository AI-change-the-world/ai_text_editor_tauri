import { useState, useCallback, useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useDocumentsStore } from './store/documents'
import { useSettingsStore } from './store/settings'
import { callAI } from './services/ai'
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
    <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">文档</h2>
          <button
            onClick={() => createDocument()}
            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
          >
            + 新建
          </button>
        </div>
        <input
          type="text"
          placeholder="搜索文档..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            {searchQuery ? '没有找到匹配的文档' : '还没有文档，点击新建开始'}
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => setCurrentDocument(doc.id)}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${currentDocumentId === doc.id
                  ? 'bg-blue-100 border border-blue-300'
                  : 'bg-white border border-gray-200 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 truncate flex-1">
                  {doc.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定删除这个文档吗？')) {
                      deleteDocument(doc.id)
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2 text-lg"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(doc.updatedAt).toLocaleString('zh-CN')}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">设置</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <h3 className="font-medium mb-4">AI 提供商配置</h3>

          {aiProviders.map((provider) => (
            <div key={provider.id} className="border rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">{provider.name}</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={provider.enabled}
                      onChange={(e) => updateProvider(provider.id, { enabled: e.target.checked })}
                      className="rounded"
                    />
                    启用
                  </label>
                  <button
                    onClick={() => setDefaultProvider(provider.id)}
                    className={`text-xs px-2 py-1 rounded ${defaultProviderId === provider.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    {defaultProviderId === provider.id ? '默认' : '设为默认'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={showKey === provider.id ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      placeholder="输入 API Key"
                    />
                    <button
                      onClick={() => setShowKey(showKey === provider.id ? null : provider.id)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      {showKey === provider.id ? '隐藏' : '显示'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Base URL</label>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">模型</label>
                  <input
                    type="text"
                    value={provider.model}
                    onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-sm"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            ✨ AI 编辑
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {selectedText && (
            <div>
              <label className="text-sm text-gray-600">选中的文本：</label>
              <div className="mt-1 p-3 bg-gray-100 rounded-md text-sm max-h-24 overflow-y-auto">
                {selectedText}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600">编辑指令：</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm resize-none"
              rows={3}
              placeholder="输入你想要的编辑指令..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInstruction(prompt)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {result && (
            <div>
              <label className="text-sm text-gray-600">AI 结果：</label>
              <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-md text-sm max-h-32 overflow-y-auto">
                {result}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
            >
              取消
            </button>
            {result ? (
              <button
                onClick={() => onApply(result)}
                className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
              >
                应用
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!instruction || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
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
      className="fixed bg-white shadow-lg rounded-lg border border-gray-200 flex overflow-hidden z-40"
      style={{ top: position.top - 45, left: position.left }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-2 text-sm hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="加粗"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-2 text-sm hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="斜体"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-3 py-2 text-sm hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
        title="删除线"
      >
        <s>S</s>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`px-3 py-2 text-sm hover:bg-gray-100 ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
        title="代码"
      >
        {'</>'}
      </button>
      <div className="w-px bg-gray-200" />
      <button
        onClick={onAIEdit}
        className="px-3 py-2 text-sm hover:bg-purple-100 text-purple-600"
        title="AI 编辑"
      >
        ✨
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
  onAIEdit: () => void
}) {
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始编写...',
      }),
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

  // 当 content 变化时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) return null

  return (
    <div ref={containerRef} className="relative">
      <FloatingToolbar
        editor={editor}
        position={toolbarPosition}
        onAIEdit={onAIEdit}
      />
      <EditorContent editor={editor} className="prose max-w-none" />
    </div>
  )
}

// 主应用
export default function App() {
  const { getCurrentDocument, updateDocument, currentDocumentId } = useDocumentsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
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

  const handleAIEdit = () => {
    if (selectedText) {
      setShowAIDialog(true)
    } else {
      alert('请先选中需要编辑的文本')
    }
  }

  const handleApplyAIResult = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('AI 编辑结果已复制到剪贴板，请粘贴替换选中的文本')
    setShowAIDialog(false)
    setSelectedText('')
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📝</span>
          <span className="font-semibold text-gray-800">AI 文本编辑器</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 border border-gray-300 text-sm rounded-md hover:bg-gray-50"
          >
            ⚙️ 设置
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        <DocumentList />

        <div className="flex-1 flex flex-col">
          {currentDocument ? (
            <>
              <div className="px-6 py-3 border-b border-gray-200">
                <input
                  type="text"
                  value={currentDocument.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-xl font-semibold w-full border-none outline-none bg-transparent"
                  placeholder="文档标题..."
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6">
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
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  欢迎使用 AI 文本编辑器
                </h3>
                <p className="text-gray-500">
                  选择一个文档开始编辑，或创建一个新文档
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      {showAIDialog && (
        <AIEditDialog
          selectedText={selectedText}
          onApply={handleApplyAIResult}
          onClose={() => setShowAIDialog(false)}
        />
      )}
    </div>
  )
}