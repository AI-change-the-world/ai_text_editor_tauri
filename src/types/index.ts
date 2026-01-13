export interface Document {
    id: string
    title: string
    content: any[] // Plate.js value
    createdAt: Date
    updatedAt: Date
    tags: string[]
}

export interface AIProvider {
    id: string
    name: string
    apiKey: string
    baseUrl?: string
    model: string
    enabled: boolean
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system'
    aiProviders: AIProvider[]
    defaultProvider?: string
    autoSave: boolean
    autoSaveInterval: number // in seconds
}

export interface SearchResult {
    document: Document
    score: number
    highlights: string[]
}

export interface AIEditRequest {
    instruction: string
    selectedText?: string
    context?: string
}

export interface AIEditResponse {
    editedText: string
    explanation?: string
}