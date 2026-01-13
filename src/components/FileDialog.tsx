import { useState, useEffect, useRef } from 'react'

export function FileDialog({
    onConfirm,
    onClose,
}: {
    onConfirm: (title: string) => void
    onClose: () => void
}) {
    const [title, setTitle] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title.trim()) {
            onConfirm(title.trim())
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose} />

            <div className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-md animate-fadeIn"
                style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-800">新建文档</h3>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">标题 *</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    onClose()
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="输入文档标题"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim()}
                            className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            创建
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
