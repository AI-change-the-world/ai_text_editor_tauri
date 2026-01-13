import { useState } from 'react'

export function TestLayout() {
    const [count, setCount] = useState(0)

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    AI 文本编辑器测试
                </h1>

                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">基础功能测试</h2>
                        <button
                            onClick={() => setCount(count + 1)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            点击计数: {count}
                        </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">文本编辑器</h2>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none"
                            placeholder="在这里输入文本..."
                        />
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">状态信息</h2>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>✅ React 组件正常渲染</li>
                            <li>✅ Tailwind CSS 样式正常</li>
                            <li>✅ 状态管理正常</li>
                            <li>✅ Tauri 应用正常启动</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}