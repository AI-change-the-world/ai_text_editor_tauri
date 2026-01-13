import { create } from 'zustand'
import { Document } from '../types'
import { TauriService } from '../services/tauri'

interface DocumentsState {
    documents: Document[]
    currentDocument: Document | null
    searchQuery: string
    isLoading: boolean

    // Actions
    loadDocuments: () => Promise<void>
    createDocument: (title?: string) => Promise<Document>
    updateDocument: (id: string, updates: Partial<Document>) => Promise<void>
    deleteDocument: (id: string) => Promise<void>
    setCurrentDocument: (document: Document | null) => void
    searchDocuments: (query: string) => Promise<void>
    setSearchQuery: (query: string) => void
    getDocument: (id: string) => Document | undefined
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
    documents: [],
    currentDocument: null,
    searchQuery: '',
    isLoading: false,

    loadDocuments: async () => {
        set({ isLoading: true })
        try {
            const documents = await TauriService.getAllDocuments()
            // Convert date strings to Date objects
            const processedDocuments = documents.map(doc => ({
                ...doc,
                createdAt: new Date(doc.createdAt),
                updatedAt: new Date(doc.updatedAt),
            }))
            set({ documents: processedDocuments })
        } catch (error) {
            console.error('Failed to load documents:', error)
        } finally {
            set({ isLoading: false })
        }
    },

    createDocument: async (title?: string) => {
        try {
            const newDocument = await TauriService.createDocument({ title })
            const processedDocument = {
                ...newDocument,
                createdAt: new Date(newDocument.createdAt),
                updatedAt: new Date(newDocument.updatedAt),
            }

            set((state) => ({
                documents: [processedDocument, ...state.documents],
                currentDocument: processedDocument,
            }))

            return processedDocument
        } catch (error) {
            console.error('Failed to create document:', error)
            throw error
        }
    },

    updateDocument: async (id: string, updates: Partial<Document>) => {
        try {
            const updateRequest: any = {}
            if (updates.title !== undefined) updateRequest.title = updates.title
            if (updates.content !== undefined) updateRequest.content = updates.content
            if (updates.tags !== undefined) updateRequest.tags = updates.tags

            const updatedDocument = await TauriService.updateDocument(id, updateRequest)

            if (updatedDocument) {
                const processedDocument = {
                    ...updatedDocument,
                    createdAt: new Date(updatedDocument.createdAt),
                    updatedAt: new Date(updatedDocument.updatedAt),
                }

                set((state) => {
                    const updatedDocuments = state.documents.map((doc) =>
                        doc.id === id ? processedDocument : doc
                    )

                    const updatedCurrentDocument =
                        state.currentDocument?.id === id ? processedDocument : state.currentDocument

                    return {
                        documents: updatedDocuments,
                        currentDocument: updatedCurrentDocument,
                    }
                })
            }
        } catch (error) {
            console.error('Failed to update document:', error)
        }
    },

    deleteDocument: async (id: string) => {
        try {
            const success = await TauriService.deleteDocument(id)
            if (success) {
                set((state) => ({
                    documents: state.documents.filter((doc) => doc.id !== id),
                    currentDocument:
                        state.currentDocument?.id === id ? null : state.currentDocument,
                }))
            }
        } catch (error) {
            console.error('Failed to delete document:', error)
        }
    },

    setCurrentDocument: (document: Document | null) => {
        set({ currentDocument: document })
    },

    searchDocuments: async (query: string) => {
        set({ searchQuery: query })
        if (!query.trim()) {
            // If no query, reload all documents
            await get().loadDocuments()
            return
        }

        try {
            const results = await TauriService.searchDocuments({ query })
            const processedResults = results.map(doc => ({
                ...doc,
                createdAt: new Date(doc.createdAt),
                updatedAt: new Date(doc.updatedAt),
            }))
            set({ documents: processedResults })
        } catch (error) {
            console.error('Failed to search documents:', error)
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query })
    },

    getDocument: (id: string) => {
        const { documents } = get()
        return documents.find((doc) => doc.id === id)
    },
}))