import { create } from 'zustand'
import { AppSettings, AIProvider } from '../types'
import { TauriService } from '../services/tauri'

interface SettingsState extends AppSettings {
    isLoading: boolean

    // Actions
    loadSettings: () => Promise<void>
    updateSettings: (settings: Partial<AppSettings>) => Promise<void>
    addAIProvider: (provider: Omit<AIProvider, 'id'>) => Promise<void>
    updateAIProvider: (id: string, updates: Partial<AIProvider>) => Promise<void>
    removeAIProvider: (id: string) => Promise<void>
    setDefaultProvider: (providerId: string) => Promise<void>
}

const defaultSettings: AppSettings = {
    theme: 'system',
    aiProviders: [
        {
            id: 'openai',
            name: 'OpenAI',
            apiKey: '',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-3.5-turbo',
            enabled: false,
        },
        {
            id: 'claude',
            name: 'Claude',
            apiKey: '',
            baseUrl: 'https://api.anthropic.com',
            model: 'claude-3-sonnet-20240229',
            enabled: false,
        },
    ],
    autoSave: true,
    autoSaveInterval: 30,
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...defaultSettings,
    isLoading: false,

    loadSettings: async () => {
        set({ isLoading: true })
        try {
            const settings = await TauriService.getSettings()
            set({ ...settings, isLoading: false })
        } catch (error) {
            console.error('Failed to load settings:', error)
            set({ isLoading: false })
        }
    },

    updateSettings: async (updates: Partial<AppSettings>) => {
        const currentState = get()
        const newSettings = { ...currentState, ...updates }

        try {
            await TauriService.updateSettings(newSettings)
            set(newSettings)
        } catch (error) {
            console.error('Failed to update settings:', error)
        }
    },

    addAIProvider: async (provider: Omit<AIProvider, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newProvider = { ...provider, id }

        const currentState = get()
        const newProviders = [...currentState.aiProviders, newProvider]

        try {
            await TauriService.updateSettings({
                ...currentState,
                aiProviders: newProviders,
            })
            set({ aiProviders: newProviders })
        } catch (error) {
            console.error('Failed to add AI provider:', error)
        }
    },

    updateAIProvider: async (id: string, updates: Partial<AIProvider>) => {
        const currentState = get()
        const newProviders = currentState.aiProviders.map((provider) =>
            provider.id === id ? { ...provider, ...updates } : provider
        )

        try {
            await TauriService.updateSettings({
                ...currentState,
                aiProviders: newProviders,
            })
            set({ aiProviders: newProviders })
        } catch (error) {
            console.error('Failed to update AI provider:', error)
        }
    },

    removeAIProvider: async (id: string) => {
        const currentState = get()
        const newProviders = currentState.aiProviders.filter((provider) => provider.id !== id)
        const newDefaultProvider = currentState.defaultProvider === id ? undefined : currentState.defaultProvider

        try {
            await TauriService.updateSettings({
                ...currentState,
                aiProviders: newProviders,
                defaultProvider: newDefaultProvider,
            })
            set({
                aiProviders: newProviders,
                defaultProvider: newDefaultProvider,
            })
        } catch (error) {
            console.error('Failed to remove AI provider:', error)
        }
    },

    setDefaultProvider: async (providerId: string) => {
        const currentState = get()

        try {
            await TauriService.updateSettings({
                ...currentState,
                defaultProvider: providerId,
            })
            set({ defaultProvider: providerId })
        } catch (error) {
            console.error('Failed to set default provider:', error)
        }
    },
}))