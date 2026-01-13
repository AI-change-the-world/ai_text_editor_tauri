import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Document {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
}

interface DocumentsState {
    documents: Document[]
    currentDocumentId: string | null
    searchQuery: string

    createDocument: (title?: string) => Document
    updateDocument: (id: string, updates: Partial<Document>) => void
    deleteDocument: (id: string) => void
    setCurrentDocument: (id: string | null) => void
    setSearchQuery: (query: string) => void
    getCurrentDocument: () => Document | null
    getFilteredDocuments: () => Document[]
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useLocalDocumentsStore = create<DocumentsState>()(
    persist(
        (set, get) => ({
            documents: [],
            currentDocumentId: null,
            searchQuery: '',

            createDocument: (title?: string) => {
                const now = new Date().toISOString()
                const newDocument: Document = {
                    id: generateId(),
                    title: title || '未命名文档',
                    content: '',
                    createdAt: now,
                    updatedAt: now,
                }

                set((state) => ({
                    documents: [newDocument, ...state.documents],
                    currentDocumentId: newDocument.id,
                }))

                return newDocument
            },

            updateDocument: (id: string, updates: Partial<Document>) => {
                set((state) => ({
                    documents: state.documents.map((doc) =>
                        doc.id === id
                            ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
                            : doc
                    ),
                }))
            },

            deleteDocument: (id: string) => {
                set((state) => ({
                    documents: state.documents.filter((doc) => doc.id !== id),
                    currentDocumentId: state.currentDocumentId === id ? null : state.currentDocumentId,
                }))
            },

            setCurrentDocument: (id: string | null) => {
                set({ currentDocumentId: id })
            },

            setSearchQuery: (query: string) => {
                set({ searchQuery: query })
            },

            getCurrentDocument: () => {
                const { documents, currentDocumentId } = get()
                return documents.find((doc) => doc.id === currentDocumentId) || null
            },

            getFilteredDocuments: () => {
                const { documents, searchQuery } = get()
                if (!searchQuery.trim()) return documents

                const query = searchQuery.toLowerCase()
                return documents.filter(
                    (doc) =>
                        doc.title.toLowerCase().includes(query) ||
                        doc.content.toLowerCase().includes(query)
                )
            },
        }),
        {
            name: 'ai-editor-documents',
        }
    )
)