import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AIProvider {
    id: string
    name: string
    apiKey: string
    baseUrl: string
    model: string
    enabled: boolean
}

interface SettingsState {
    theme: 'light' | 'dark' | 'system'
    aiProviders: AIProvider[]
    defaultProviderId: string | null

    setTheme: (theme: 'light' | 'dark' | 'system') => void
    addProvider: (provider: Omit<AIProvider, 'id'>) => void
    updateProvider: (id: string, updates: Partial<AIProvider>) => void
    removeProvider: (id: string) => void
    setDefaultProvider: (id: string | null) => void
    getActiveProvider: () => AIProvider | null
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            theme: 'light',
            aiProviders: [
                {
                    id: 'openai-default',
                    name: 'OpenAI',
                    apiKey: '',
                    baseUrl: 'https://api.openai.com/v1',
                    model: 'gpt-3.5-turbo',
                    enabled: false,
                },
            ],
            defaultProviderId: null,

            setTheme: (theme) => set({ theme }),

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