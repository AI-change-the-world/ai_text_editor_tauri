import { invoke } from '@tauri-apps/api/core'
import { Document, AppSettings } from '../types'

export interface CreateDocumentRequest {
    title?: string
}

export interface UpdateDocumentRequest {
    title?: string
    content?: any[]
    tags?: string[]
}

export interface SearchRequest {
    query: string
}

export class TauriService {
    static async getAllDocuments(): Promise<Document[]> {
        return await invoke('get_all_documents')
    }

    static async getDocument(id: string): Promise<Document | null> {
        return await invoke('get_document', { id })
    }

    static async createDocument(request: CreateDocumentRequest): Promise<Document> {
        return await invoke('create_document', { request })
    }

    static async updateDocument(id: string, request: UpdateDocumentRequest): Promise<Document | null> {
        return await invoke('update_document', { id, request })
    }

    static async deleteDocument(id: string): Promise<boolean> {
        return await invoke('delete_document', { id })
    }

    static async searchDocuments(request: SearchRequest): Promise<Document[]> {
        return await invoke('search_documents', { request })
    }

    static async getSettings(): Promise<AppSettings> {
        return await invoke('get_settings')
    }

    static async updateSettings(settings: AppSettings): Promise<void> {
        return await invoke('update_settings', { settings })
    }
}