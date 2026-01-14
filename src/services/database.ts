import { invoke } from '@tauri-apps/api/core'

// ============ 窗口管理 API ============

export const windowAPI = {
    async openEditor(fileId: string): Promise<string> {
        return invoke('open_editor_window', { fileId })
    },

    async openSettings(): Promise<string> {
        return invoke('open_settings_window')
    },
}

// ============ 类型定义 ============

export interface Workspace {
    id: string
    name: string
    description?: string
    created_at: string
    updated_at: string
}

export interface File {
    id: string
    workspace_id: string
    file_type: 'document' | 'image' | 'audio' | 'video'
    title: string
    content?: string
    content_plain?: string
    file_path?: string
    file_size?: number
    mime_type?: string
    created_at: string
    updated_at: string
}

export interface Tag {
    id: string
    name: string
    color?: string
    created_at: string
}

export interface SearchResult {
    id: string
    workspace_id: string
    file_type: string
    title: string
    content?: string
    file_path?: string
    created_at: string
    updated_at: string
    rank: number
}

// ============ 工作空间 API ============

export const workspaceAPI = {
    async create(name: string, description?: string): Promise<Workspace> {
        return invoke('create_workspace', { data: { name, description } })
    },

    async get(id: string): Promise<Workspace | null> {
        return invoke('get_workspace', { id })
    },

    async list(): Promise<Workspace[]> {
        return invoke('list_workspaces')
    },

    async update(id: string, data: { name?: string; description?: string }): Promise<Workspace> {
        return invoke('update_workspace', { id, data })
    },

    async delete(id: string): Promise<void> {
        return invoke('delete_workspace', { id })
    },
}

// ============ 文件 API ============

export const fileAPI = {
    async create(data: {
        workspace_id: string
        file_type: 'document' | 'image' | 'audio' | 'video'
        title: string
        content?: string
        content_plain?: string
        file_path?: string
        file_size?: number
        mime_type?: string
    }): Promise<File> {
        return invoke('create_file', { data })
    },

    async get(id: string): Promise<File | null> {
        return invoke('get_file', { id })
    },

    async listByWorkspace(workspaceId: string): Promise<File[]> {
        return invoke('list_files_by_workspace', { workspaceId })
    },

    async listByType(workspaceId: string, fileType: string): Promise<File[]> {
        return invoke('list_files_by_type', { workspaceId, fileType })
    },

    async update(
        id: string,
        data: {
            title?: string
            content?: string
            content_plain?: string
            file_path?: string
            file_size?: number
            mime_type?: string
        }
    ): Promise<File> {
        return invoke('update_file', { id, data })
    },

    async delete(id: string): Promise<void> {
        return invoke('delete_file', { id })
    },
}

// ============ 标签 API ============

export const tagAPI = {
    async create(name: string, color?: string): Promise<Tag> {
        return invoke('create_tag', { data: { name, color } })
    },

    async get(id: string): Promise<Tag | null> {
        return invoke('get_tag', { id })
    },

    async list(): Promise<Tag[]> {
        return invoke('list_tags')
    },

    async delete(id: string): Promise<void> {
        return invoke('delete_tag', { id })
    },

    async addToFile(fileId: string, tagId: string): Promise<void> {
        return invoke('add_file_tag', { fileId, tagId })
    },

    async removeFromFile(fileId: string, tagId: string): Promise<void> {
        return invoke('remove_file_tag', { fileId, tagId })
    },

    async getFileTags(fileId: string): Promise<Tag[]> {
        return invoke('get_file_tags', { fileId })
    },
}

// ============ 搜索 API ============

export const searchAPI = {
    async search(query: {
        query: string
        workspace_id?: string
        file_type?: string
        tags?: string[]
        limit?: number
    }): Promise<SearchResult[]> {
        return invoke('search_files', { query })
    },

    async searchByTags(
        tagNames: string[],
        workspaceId?: string,
        matchAll: boolean = false
    ): Promise<SearchResult[]> {
        return invoke('search_by_tags', { workspaceId, tagNames, matchAll })
    },

    async findSimilar(fileId: string, limit: number = 10): Promise<SearchResult[]> {
        return invoke('find_similar_files', { fileId, limit })
    },
}


// ============ 媒体类型 ============

export interface MediaAsset {
    id: string
    workspace_id: string
    file_name: string
    file_path: string
    file_size: number
    mime_type: string
    width?: number
    height?: number
    created_at: string
}

// ============ 媒体 API ============

export const mediaAPI = {
    /**
     * 上传媒体文件
     * @param workspaceId 工作空间 ID
     * @param fileId 关联的文档 ID
     * @param file 文件对象
     * @returns 媒体资源信息（包含 UUID）
     */
    async upload(workspaceId: string, fileId: string, file: Blob, fileName: string): Promise<MediaAsset> {
        // 转换为 base64
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )

        return invoke('upload_media', {
            workspaceId,
            fileId,
            fileName,
            mimeType: file.type || 'application/octet-stream',
            data: base64,
        })
    },

    /**
     * 获取媒体信息
     */
    async get(id: string): Promise<MediaAsset | null> {
        return invoke('get_media', { id })
    },

    /**
     * 获取媒体文件的实际路径
     */
    async getPath(id: string): Promise<string> {
        return invoke('get_media_path', { id })
    },

    /**
     * 获取文档关联的所有媒体
     */
    async listByFile(fileId: string): Promise<MediaAsset[]> {
        return invoke('list_file_media', { fileId })
    },

    /**
     * 删除媒体
     */
    async delete(id: string): Promise<void> {
        return invoke('delete_media', { id })
    },
}

// ============ 媒体 URL 工具 ============

/**
 * 生成媒体引用 URL（用于文档中）
 * 格式: media://uuid
 */
export function createMediaUrl(mediaId: string): string {
    return `media://${mediaId}`
}

/**
 * 解析媒体引用 URL
 * @returns 媒体 ID 或 null
 */
export function parseMediaUrl(url: string): string | null {
    if (url.startsWith('media://')) {
        return url.slice(8)
    }
    return null
}

/**
 * 检查是否是媒体引用 URL
 */
export function isMediaUrl(url: string): boolean {
    return url.startsWith('media://')
}
