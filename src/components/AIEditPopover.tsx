import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settings'
import { callAI } from '../services/ai'

export function AIEditPopover({
    position,
    selectedText,
    onApply,
    onClose,
}: {
    position: { top: number; left: number } | null
    selectedText: string
    onApply: (text: string) => void
    onClose: () => void
}) {
    const [instruction, setInstruction] = useState('')
    const [result, setResult] = useState('')
    const [loading, setLoading] = useState(false)
    const { getActiveProvider } = useSettingsStore()
    const popoverRef = useRef<HTMLDivElement>(null)

    const quickPrompts = ['修正语法', '改写简洁', '翻译成英文', '扩展内容', '总结要点']

    useEffect(() => {
        const textarea = popoverRef.current?.querySelector('textarea')
        if (textarea) {
            textarea.focus()
        }
    }, [])

    const handleSubmit = async () => {
        const provider = getActiveProvider()
        if (!provider) {
            alert('请先在设置中配置并启用 AI 提供商')
            return
        }

        if (!instruction.trim()) {
            alert('请输入编辑指令')
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

    const handleReplace = () => {
        if (result) {
            onApply(result)
        }
    }

    if (!position) return null

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />

            <div
                ref={popoverRef}
                className="fixed z-50 bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-200/80 w-[340px] animate-fadeIn"
                style={{
                    top: Math.min(position.top + 10, window.innerHeight - 400),
                    left: Math.min(position.left, window.innerWidth - 360),
                }}
            >
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/60">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">✨</span>
                        <span className="text-xs font-semibold text-gray-800">AI 编辑</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors text-sm"
                    >
                        ×
                    </button>
                </div>

                <div className="p-3 space-y-2.5">
                    {selectedText && (
                        <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">选中内容</label>
                            <div className="p-2 bg-gray-100/80 rounded text-[11px] max-h-16 overflow-y-auto text-gray-700 leading-relaxed">
                                {selectedText}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] text-gray-500 mb-1 block">编辑指令</label>
                        <textarea
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault()
                                    if (!result) {
                                        handleSubmit()
                                    } else {
                                        handleReplace()
                                    }
                                }
                                if (e.key === 'Escape') {
                                    onClose()
                                }
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300/60 rounded text-[11px] resize-none bg-white/80 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            rows={3}
                            placeholder="输入编辑指令... (Cmd+Enter 提交)"
                        />
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {quickPrompts.map((prompt) => (
                            <button
                                key={prompt}
                                onClick={() => setInstruction(prompt)}
                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-700 transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {result && (
                        <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">AI 结果</label>
                            <div className="p-2 bg-green-50/80 border border-green-200/60 rounded text-[11px] max-h-24 overflow-y-auto text-gray-700 leading-relaxed">
                                {result}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-1.5 pt-1">
                        <button
                            onClick={onClose}
                            className="px-2.5 py-1 border border-gray-300/60 rounded text-[11px] hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        {result ? (
                            <button
                                onClick={handleReplace}
                                className="px-2.5 py-1 bg-green-500 text-white rounded text-[11px] hover:bg-green-600 transition-colors shadow-sm"
                            >
                                替换
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={!instruction.trim() || loading}
                                className="px-2.5 py-1 bg-blue-500 text-white rounded text-[11px] hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {loading ? '处理中...' : '生成'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
