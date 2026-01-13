import { useState, useEffect, useRef } from 'react'

export function WorkspaceDialog({
    onConfirm,
    onClose,
}: {
    onConfirm: (name: string, description?: string) => void
    onClose: () => void
}) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onConfirm(name.trim(), description.trim() || undefined)
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
                    <h3 className="text-sm font-semibold text-gray-800">新建工作空间</h3>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">名称 *</label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    onClose()
                                }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="输入工作空间名称"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs text-gray-600 mb-1 block">描述（可选）</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="输入工作空间描述"
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
                            disabled={!name.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            创建
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}
