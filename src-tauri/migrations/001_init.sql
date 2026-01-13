-- 工作空间表
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 文件表（文档和媒体文件）
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'document', 'image', 'audio', 'video'
    title TEXT NOT NULL,
    content TEXT, -- 文档内容（HTML）或文件路径
    file_path TEXT, -- 媒体文件的实际路径
    file_size INTEGER, -- 文件大小（字节）
    mime_type TEXT, -- MIME 类型
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    color TEXT, -- 标签颜色
    created_at TEXT NOT NULL
);

-- 文件标签关联表
CREATE TABLE IF NOT EXISTS file_tags (
    file_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (file_id, tag_id),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- 全文搜索表（使用 FTS5）
CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
    file_id UNINDEXED,
    title,
    content,
    tags,
    content='files',
    content_rowid='rowid'
);

-- 触发器：插入文件时同步到 FTS
CREATE TRIGGER IF NOT EXISTS files_ai AFTER INSERT ON files BEGIN
    INSERT INTO files_fts(file_id, title, content, tags)
    VALUES (new.id, new.title, new.content, '');
END;

-- 触发器：更新文件时同步到 FTS
CREATE TRIGGER IF NOT EXISTS files_au AFTER UPDATE ON files BEGIN
    UPDATE files_fts 
    SET title = new.title, content = new.content
    WHERE file_id = new.id;
END;

-- 触发器：删除文件时从 FTS 删除
CREATE TRIGGER IF NOT EXISTS files_ad AFTER DELETE ON files BEGIN
    DELETE FROM files_fts WHERE file_id = old.id;
END;

-- 索引
CREATE INDEX IF NOT EXISTS idx_files_workspace ON files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_updated ON files(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_tags_file ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag_id);
