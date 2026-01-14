import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ============ AI 提供商 ============

export interface AIProvider {
    id: string
    name: string
    apiKey: string
    baseUrl: string
    model: string
    enabled: boolean
}

// ============ 外观设置 ============

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'
export type EditorWidth = 'narrow' | 'medium' | 'wide' | 'full'

export interface AppearanceSettings {
    theme: ThemeMode
    fontSize: FontSize
    editorWidth: EditorWidth
    lineHeight: number      // 1.4 - 2.0
    fontFamily: string      // 字体
    showLineNumbers: boolean
    highlightCurrentLine: boolean
}

// ============ Store ============

interface SettingsState {
    // 外观设置
    appearance: AppearanceSettings

    // AI 设置
    aiProviders: AIProvider[]
    defaultProviderId: string | null

    // 外观操作
    setAppearance: (settings: Partial<AppearanceSettings>) => void
    resetAppearance: () => void

    // AI 操作
    addProvider: (provider: Omit<AIProvider, 'id'>) => void
    updateProvider: (id: string, updates: Partial<AIProvider>) => void
    removeProvider: (id: string) => void
    setDefaultProvider: (id: string | null) => void
    getActiveProvider: () => AIProvider | null
}

const generateId = () => Math.random().toString(36).substr(2, 9)

// 默认外观设置
const defaultAppearance: AppearanceSettings = {
    theme: 'system',
    fontSize: 'medium',
    editorWidth: 'medium',
    lineHeight: 1.6,
    fontFamily: 'system-ui',
    showLineNumbers: false,
    highlightCurrentLine: true,
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            appearance: defaultAppearance,

            aiProviders: [
                {
                    id: 'openai-default',
                    name: 'OpenAI',
                    apiKey: '',
                    baseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-4o-mini',
                    enabled: false,
                },
                {
                    id: 'anthropic-default',
                    name: 'Anthropic',
                    apiKey: '',
                    baseUrl: 'https://api.anthropic.com/v1',
                    model: 'claude-3-haiku-20240307',
                    enabled: false,
                },
            ],
            defaultProviderId: null,

            setAppearance: (settings) => {
                set((state) => ({
                    appearance: { ...state.appearance, ...settings },
                }))
            },

            resetAppearance: () => {
                set({ appearance: defaultAppearance })
            },

            addProvider: (provider) => {
                const newProvider: AIProvider = {
                    ...provider,
                    id: generateId(),
                }
                set((state) => ({
                    aiProviders: [...state.aiProviders, newProvider],
                }))
            },

            updateProvider: (id, updates) => {
                set((state) => ({
                    aiProviders: state.aiProviders.map((p) =>
                        p.id === id ? { ...p, ...updates } : p
                    ),
                }))
            },

            removeProvider: (id) => {
                set((state) => ({
                    aiProviders: state.aiProviders.filter((p) => p.id !== id),
                    defaultProviderId: state.defaultProviderId === id ? null : state.defaultProviderId,
                }))
            },

            setDefaultProvider: (id) => set({ defaultProviderId: id }),

            getActiveProvider: () => {
                const { aiProviders, defaultProviderId } = get()
                if (defaultProviderId) {
                    const provider = aiProviders.find((p) => p.id === defaultProviderId)
                    if (provider?.enabled && provider.apiKey) return provider
                }
                return aiProviders.find((p) => p.enabled && p.apiKey) || null
            },
        }),
        {
            name: 'ai-editor-settings',
        }
    )
)

// ============ 主题应用工具 ============

export function applyTheme(settings: AppearanceSettings) {
    const root = document.documentElement

    // 主题模式
    let isDark = settings.theme === 'dark'
    if (settings.theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    root.classList.toggle('dark', isDark)

    // 字体大小
    const fontSizeMap = {
        small: { base: '13px', editor: '14px' },
        medium: { base: '14px', editor: '16px' },
        large: { base: '16px', editor: '18px' },
    }
    const sizes = fontSizeMap[settings.fontSize]
    root.style.setProperty('--font-size-base', sizes.base)
    root.style.setProperty('--font-size-editor', sizes.editor)

    // 编辑器宽度
    const widthMap = {
        narrow: '600px',
        medium: '800px',
        wide: '1000px',
        full: '100%',
    }
    root.style.setProperty('--editor-max-width', widthMap[settings.editorWidth])

    // 行高
    root.style.setProperty('--line-height', settings.lineHeight.toString())

    // 字体
    root.style.setProperty('--font-family', settings.fontFamily)
}
