import React, { useState, useEffect } from 'react'
import { useDocumentsStore } from '../../store/documents'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { formatDate } from '../../lib/utils'
import {
    Search,
    Plus,
    FileText,
    Trash2,
    MoreHorizontal,
    Loader2,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/DropdownMenu'

export function DocumentList() {
    const {
        documents,
        currentDocument,
        searchQuery,
        isLoading,
        loadDocuments,
        createDocument,
        setCurrentDocument,
        deleteDocument,
        searchDocuments,
        setSearchQuery,
    } = useDocumentsStore()

    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

    // Load documents on mount
    useEffect(() => {
        loadDocuments()
    }, [loadDocuments])

    const handleSearch = async (query: string) => {
        setLocalSearchQuery(query)
        setSearchQuery(query)
        await searchDocuments(query)
    }

    const handleCreateDocument = async () => {
        try {
            const newDoc = await createDocument()
            setCurrentDocument(newDoc)
        } catch (error) {
            console.error('Failed to create document:', error)
        }
    }

    const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('确定要删除这个文档吗？')) {
            await deleteDocument(id)
        }
    }

    return (
        <div className="w-80 border-r bg-muted/30 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">文档</h2>
                    <Button size="sm" onClick={handleCreateDocument} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4 mr-1" />
                        )}
                        新建
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索文档..."
                        value={localSearchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="p-4 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">加载中...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        {localSearchQuery ? '没有找到匹配的文档' : '还没有文档'}
                    </div>
                ) : (
                    <div className="p-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className={`group p-3 rounded-lg cursor-pointer transition-colors ${currentDocument?.id === doc.id
                                        ? 'bg-primary/10 border border-primary/20'
                                        : 'hover:bg-muted'
                                    }`}
                                onClick={() => setCurrentDocument(doc)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <h3 className="font-medium truncate text-sm">
                                                {doc.title}
                                            </h3>
                                        </div>

                                        <p className="text-xs text-muted-foreground mb-2">
                                            {formatDate(doc.updatedAt)}
                                        </p>

                                        {/* Content preview */}
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {doc.content
                                                .map((node: any) =>
                                                    node.children?.map((child: any) => child.text).join('') || ''
                                                )
                                                .join(' ')
                                                .slice(0, 100) || '空文档'}
                                        </p>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => handleDeleteDocument(doc.id, e)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                删除
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}