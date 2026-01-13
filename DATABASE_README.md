# AI 文本编辑器 - 数据库架构文档

## 概述

使用 **SQLite + sqlx** 在 Rust 层实现的完整 RAG（检索增强生成）系统，支持：

- ✅ 工作空间管理
- ✅ 多类型文件管理（文档、图片、音视频）
- ✅ 标签系统
- ✅ 全文搜索（FTS5）
- ✅ 相似文档推荐

## 数据库架构

### 表结构

#### 1. workspaces（工作空间）
```sql
- id: TEXT PRIMARY KEY
- name: TEXT NOT NULL
- description: TEXT
- created_at: TEXT
- updated_at: TEXT
```

#### 2. files（文件）
```sql
- id: TEXT PRIMARY KEY
- workspace_id: TEXT (外键)
- file_type: TEXT ('document', 'image', 'audio', 'video')
- title: TEXT
- content: TEXT (文档内容 HTML)
- file_path: TEXT (媒体文件路径)
- file_size: INTEGER
- mime_type: TEXT
- created_at: TEXT
- updated_at: TEXT
```

#### 3. tags（标签）
```sql
- id: TEXT PRIMARY KEY
- name: TEXT UNIQUE
- color: TEXT
- created_at: TEXT
```

#### 4. file_tags（文件-标签关联）
```sql
- file_id: TEXT (外键)
- tag_id: TEXT (外键)
- created_at: TEXT
```

#### 5. files_fts（全文搜索虚拟表）
```sql
使用 SQLite FTS5 扩展
- file_id: UNINDEXED
- title: 可搜索
- content: 可搜索
- tags: 可搜索
```

## API 使用示例

### TypeScript 前端调用

```typescript
import { workspaceAPI, fileAPI, tagAPI, searchAPI } from '@/services/database'

// 1. 创建工作空间
const workspace = await workspaceAPI.create('我的项目', '项目描述')

// 2. 创建文档
const doc = await fileAPI.create({
  workspace_id: workspace.id,
  file_type: 'document',
  title: '会议记录',
  content: '<p>今天讨论了...</p>',
})

// 3. 创建标签
const tag = await tagAPI.create('重要', '#ff0000')

// 4. 给文档添加标签
await tagAPI.addToFile(doc.id, tag.id)

// 5. 全文搜索
const results = await searchAPI.search({
  query: '会议 讨论',
  workspace_id: workspace.id,
  limit: 20,
})

// 6. 按标签搜索
const taggedFiles = await searchAPI.searchByTags(
  ['重要', '紧急'],
  workspace.id,
  true // matchAll: 匹配所有标签
)

// 7. 查找相似文档
const similar = await searchAPI.findSimilar(doc.id, 5)
```

### Rust 后端实现

所有业务逻辑在 Rust 层：

```
src-tauri/
├── migrations/
│   └── 001_init.sql          # 数据库迁移
├── src/
│   ├── models.rs              # 数据模型
│   ├── db.rs                  # 数据库连接
│   ├── services/
│   │   ├── workspace.rs       # 工作空间服务
│   │   ├── file.rs            # 文件服务
│   │   ├── tag.rs             # 标签服务
│   │   └── search.rs          # 搜索服务（RAG 核心）
│   ├── commands.rs            # Tauri 命令
│   └── lib.rs                 # 主入口
```

## 搜索功能详解

### 1. 全文搜索（FTS5）

```typescript
// 自动分词、前缀匹配、排名
const results = await searchAPI.search({
  query: '人工智能 机器学习',
  workspace_id: 'xxx',
  file_type: 'document',
  tags: ['技术', 'AI'],
  limit: 50,
})
```

**特性：**
- 自动分词
- 前缀匹配（支持输入时实时搜索）
- BM25 排名算法
- 支持多条件过滤

### 2. 标签搜索

```typescript
// 匹配所有标签（AND）
const results = await searchAPI.searchByTags(
  ['重要', '紧急', '待办'],
  workspace.id,
  true
)

// 匹配任意标签（OR）
const results = await searchAPI.searchByTags(
  ['技术', '设计', '产品'],
  workspace.id,
  false
)
```

### 3. 相似文档推荐

```typescript
// 基于共同标签推荐相似文档
const similar = await searchAPI.findSimilar(currentDocId, 10)
```

## RAG 集成建议

### 1. 文档向量化（可选扩展）

可以添加向量存储表：

```sql
CREATE TABLE file_embeddings (
    file_id TEXT PRIMARY KEY,
    embedding BLOB, -- 存储向量
    model TEXT,     -- 使用的模型
    updated_at TEXT
);
```

### 2. 与 AI 集成

```typescript
// 1. 搜索相关文档
const context = await searchAPI.search({
  query: userQuestion,
  limit: 5,
})

// 2. 构建 prompt
const prompt = `
基于以下文档回答问题：

${context.map(doc => doc.content).join('\n\n')}

问题：${userQuestion}
`

// 3. 调用 AI
const answer = await callAI(provider, { instruction: prompt })
```

### 3. 自动标签提取

```typescript
// 使用 AI 自动提取标签
const extractedTags = await callAI(provider, {
  instruction: '从以下文本中提取 3-5 个关键标签',
  selectedText: document.content,
})

// 创建并关联标签
for (const tagName of extractedTags) {
  let tag = await tagAPI.get(tagName)
  if (!tag) {
    tag = await tagAPI.create(tagName)
  }
  await tagAPI.addToFile(document.id, tag.id)
}
```

## 性能优化

### 索引

已创建的索引：
- `idx_files_workspace` - 按工作空间查询
- `idx_files_type` - 按文件类型查询
- `idx_files_updated` - 按更新时间排序
- `idx_file_tags_file` - 文件标签关联
- `idx_file_tags_tag` - 标签文件关联

### FTS5 触发器

自动同步文件内容到全文搜索表：
- 插入文件 → 自动添加到 FTS
- 更新文件 → 自动更新 FTS
- 删除文件 → 自动从 FTS 删除

## 数据库位置

- **macOS**: `~/Library/Application Support/ai_text_editor_tauri/ai_editor.db`
- **Windows**: `%APPDATA%\ai_text_editor_tauri\ai_editor.db`
- **Linux**: `~/.local/share/ai_text_editor_tauri/ai_editor.db`

## 迁移现有数据

从 localStorage 迁移到 SQLite：

```typescript
// 1. 读取旧数据
const oldDocs = JSON.parse(localStorage.getItem('ai-editor-documents') || '{}')

// 2. 创建默认工作空间
const workspace = await workspaceAPI.create('默认工作空间')

// 3. 迁移文档
for (const doc of oldDocs.documents || []) {
  await fileAPI.create({
    workspace_id: workspace.id,
    file_type: 'document',
    title: doc.title,
    content: doc.content,
  })
}

// 4. 清理旧数据
localStorage.removeItem('ai-editor-documents')
```

## 下一步

1. ✅ 基础 CRUD 完成
2. ✅ 全文搜索完成
3. ✅ 标签系统完成
4. 🔄 向量搜索（可选）
5. 🔄 文件上传和管理
6. 🔄 工作空间切换 UI
7. 🔄 高级搜索界面

## 测试

```bash
# 编译 Rust 代码
cd src-tauri
cargo build

# 运行应用
pnpm tauri dev
```
