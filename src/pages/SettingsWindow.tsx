import { useState } from 'react'
import {
    useSettingsStore,
    applyTheme,
    type ThemeMode,
    type FontSize,
    type EditorWidth,
} from '../store/settings'

type SettingsTab = 'appearance' | 'ai' | 'about'

export default function SettingsWindow() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('appearance')

    const tabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: 'appearance', label: '外观', icon: '🎨' },
        { id: 'ai', label: 'AI 模型', icon: '🤖' },
        { id: 'about', label: '关于', icon: 'ℹ️' },
    ]

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
            {/* 侧边栏 */}
            <div className="w-48 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-3">
                <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 px-2">
                    设置
                </h1>
                <nav className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === tab.id
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* 内容区 */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'appearance' && <AppearanceSettings />}
                {activeTab === 'ai' && <AISettings />}
                {activeTab === 'about' && <AboutSettings />}
            </div>
        </div>
    )
}

// ============ 外观设置 ============

function AppearanceSettings() {
    const { appearance, setAppearance, resetAppearance } = useSettingsStore()

    const handleChange = <K extends keyof typeof appearance>(
        key: K,
        value: (typeof appearance)[K]
    ) => {
        const newSettings = { ...appearance, [key]: value }
        setAppearance({ [key]: value })
        applyTheme(newSettings)
    }

    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                外观设置
            </h2>

            <div className="space-y-6">
                {/* 主题 */}
                <SettingItem label="主题模式" description="选择应用的颜色主题">
                    <div className="flex gap-2">
                        {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => handleChange('theme', mode)}
                                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${appearance.theme === mode
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                            >
                                {mode === 'light' && '☀️ 浅色'}
                                {mode === 'dark' && '🌙 深色'}
                                {mode === 'system' && '💻 跟随系统'}
                            </button>
                        ))}
                    </div>
                </SettingItem>

                {/* 字体大小 */}
                <SettingItem label="字体大小" description="调整界面和编辑器的字体大小">
                    <div className="flex gap-2">
                        {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                            <button
                                key={size}
                                onClick={() => handleChange('fontSize', size)}
                                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${appearance.fontSize === size
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                            >
                                {size === 'small' && '小'}
                                {size === 'medium' && '中'}
                                {size === 'large' && '大'}
                            </button>
                        ))}
                    </div>
                </SettingItem>

                {/* 编辑器宽度 */}
                <SettingItem label="编辑器宽度" description="设置编辑区域的最大宽度">
                    <div className="flex gap-2">
                        {(['narrow', 'medium', 'wide', 'full'] as EditorWidth[]).map((width) => (
                            <button
                                key={width}
                                onClick={() => handleChange('editorWidth', width)}
                                className={`px-4 py-2 text-sm rounded-lg border transition-colors ${appearance.editorWidth === width
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                            >
                                {width === 'narrow' && '窄'}
                                {width === 'medium' && '中'}
                                {width === 'wide' && '宽'}
                                {width === 'full' && '全宽'}
                            </button>
                        ))}
                    </div>
                </SettingItem>

                {/* 行高 */}
                <SettingItem label="行高" description={`当前: ${appearance.lineHeight}`}>
                    <input
                        type="range"
                        min="1.4"
                        max="2.0"
                        step="0.1"
                        value={appearance.lineHeight}
                        onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value))}
                        className="w-48 accent-blue-500"
                    />
                </SettingItem>

                {/* 字体 */}
                <SettingItem label="字体" description="选择编辑器使用的字体">
                    <select
                        value={appearance.fontFamily}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                    >
                        <option value="system-ui">系统默认</option>
                        <option value="'SF Pro Text', system-ui">SF Pro</option>
                        <option value="'Helvetica Neue', Arial">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Source Han Sans', 'Noto Sans SC'">思源黑体</option>
                        <option value="'PingFang SC', 'Microsoft YaHei'">苹方/微软雅黑</option>
                    </select>
                </SettingItem>

                {/* 编辑器选项 */}
                <SettingItem label="编辑器选项">
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={appearance.highlightCurrentLine}
                                onChange={(e) => handleChange('highlightCurrentLine', e.target.checked)}
                                className="w-4 h-4 rounded accent-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                高亮当前行
                            </span>
                        </label>
                    </div>
                </SettingItem>

                {/* 重置 */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => {
                            resetAppearance()
                            applyTheme(useSettingsStore.getState().appearance)
                        }}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        重置为默认设置
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============ AI 设置 ============

function AISettings() {
    const { aiProviders, updateProvider, setDefaultProvider, defaultProviderId, addProvider, removeProvider } =
        useSettingsStore()
    const [showKey, setShowKey] = useState<string | null>(null)

    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">
                AI 模型配置
            </h2>

            <div className="space-y-4">
                {aiProviders.map((provider) => (
                    <div
                        key={provider.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {provider.name}
                                </span>
                                {defaultProviderId === provider.id && (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                                        默认
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={provider.enabled}
                                        onChange={(e) =>
                                            updateProvider(provider.id, { enabled: e.target.checked })
                                        }
                                        className="rounded accent-blue-500"
                                    />
                                    <span className="text-gray-600 dark:text-gray-400">启用</span>
                                </label>
                                {defaultProviderId !== provider.id && (
                                    <button
                                        onClick={() => setDefaultProvider(provider.id)}
                                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                    >
                                        设为默认
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                    API Key
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type={showKey === provider.id ? 'text' : 'password'}
                                        value={provider.apiKey}
                                        onChange={(e) =>
                                            updateProvider(provider.id, { apiKey: e.target.value })
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        placeholder="sk-..."
                                    />
                                    <button
                                        onClick={() =>
                                            setShowKey(showKey === provider.id ? null : provider.id)
                                        }
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        {showKey === provider.id ? '隐藏' : '显示'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                    Base URL
                                </label>
                                <input
                                    type="text"
                                    value={provider.baseUrl}
                                    onChange={(e) =>
                                        updateProvider(provider.id, { baseUrl: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                    模型
                                </label>
                                <input
                                    type="text"
                                    value={provider.model}
                                    onChange={(e) =>
                                        updateProvider(provider.id, { model: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                />
                            </div>
                        </div>

                        {!provider.id.includes('default') && (
                            <button
                                onClick={() => removeProvider(provider.id)}
                                className="mt-3 text-xs text-red-500 hover:text-red-600"
                            >
                                删除此提供商
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={() =>
                        addProvider({
                            name: '自定义',
                            apiKey: '',
                            baseUrl: 'https://api.example.com/v1',
                            model: 'gpt-3.5-turbo',
                            enabled: false,
                        })
                    }
                    className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                >
                    + 添加提供商
                </button>
            </div>
        </div>
    )
}

// ============ 关于 ============

function AboutSettings() {
    return (
        <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">关于</h2>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl">
                        📝
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                            云笺妙笔
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">版本 0.1.0</p>
                    </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>一款集成 AI 能力的现代文本编辑器，基于 Tauri + React 构建。</p>
                    <p>
                        <strong>技术栈：</strong> Tauri 2.0, React, TipTap, SQLite, Tailwind CSS
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                        快捷键
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">斜杠命令</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                /
                            </kbd>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">AI 编辑</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                ⌘ + Enter
                            </kbd>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">加粗</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                ⌘ + B
                            </kbd>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">斜体</span>
                            <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                ⌘ + I
                            </kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============ 通用组件 ============

function SettingItem({
    label,
    description,
    children,
}: {
    label: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
                {description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
                )}
            </div>
            <div>{children}</div>
        </div>
    )
}
