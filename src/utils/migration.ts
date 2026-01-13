import { workspaceAPI, fileAPI } from '../services/database'

interface OldDocument {
    id: string
    title: string
    content: string
    createdAt: string
    updatedAt: string
}

interface OldDocumentsState {
    documents: OldDocument[]
    currentDocumentId: string | null
    searchQuery: string
}

export async function migrateFromLocalStorage(): Promise<boolean> {
    try {
        // 检查是否已经迁移过
        const migrated = localStorage.getItem('migrated-to-sqlite')
        if (migrated === 'true') {
            return false
        }

        // 读取旧数据
        const oldDataStr = localStorage.getItem('ai-editor-documents')
        if (!oldDataStr) {
            // 没有旧数据，标记为已迁移
            localStorage.setItem('migrated-to-sqlite', 'true')
            return false
        }

        const oldData: OldDocumentsState = JSON.parse(oldDataStr)
        if (!oldData.documents || oldData.documents.length === 0) {
            localStorage.setItem('migrated-to-sqlite', 'true')
            return false
        }

        console.log(`开始迁移 ${oldData.documents.length} 个文档...`)

        // 创建默认工作空间
        const workspace = await workspaceAPI.create('默认工作空间', '从旧版本迁移的文档')

        // 迁移所有文档
        for (const doc of oldData.documents) {
            await fileAPI.create({
                workspace_id: workspace.id,
                file_type: 'document',
                title: doc.title,
                content: doc.content,
            })
        }

        // 标记为已迁移
        localStorage.setItem('migrated-to-sqlite', 'true')

        // 可选：清理旧数据（保留一段时间以防万一）
        // localStorage.removeItem('ai-editor-documents')

        console.log('迁移完成！')
        return true
    } catch (error) {
        console.error('迁移失败：', error)
        return false
    }
}
