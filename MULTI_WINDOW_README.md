# 多窗口架构说明

## 🎯 架构概述

应用采用 **主窗口 + 多编辑器窗口** 的架构：

- **主窗口** (`MainWindow`) - 工作空间管理、文件浏览、搜索
- **编辑器窗口** (`EditorWindow`) - 独立的文档编辑器（每个文档一个窗口）

## 📁 文件结构

```
src/
├── pages/
│   ├── MainWindow.tsx      # 主窗口（工作空间管理）
│   └── EditorWindow.tsx    # 编辑器窗口
├── services/
│   ├── database.ts         # 数据库 API
│   └── ai.ts               # AI 服务
├── components/
│   └── AIEditPopover.tsx   # AI 编辑浮窗
├── extensions/
│   └── SlashCommand.tsx    # Slash 命令
├── utils/
│   └── migration.ts        # 数据迁移工具
└── main.tsx                # 路由配置

src-tauri/
└── src/
    ├── commands.rs         # 包含 open_editor_window
    └── ...
```

## 🚀 使用流程

### 1. 主窗口功能

**工作空间管理：**
- 创建/切换工作空间
- 查看工作空间下的所有文件

**文件管理：**
- 创建新文档
- 搜索文档（全文搜索 + 标签）
- 删除文档

**点击文件 → 打开新的编辑器窗口**

### 2. 编辑器窗口功能

**独立编辑器：**
- 每个文档在独立窗口中打开
- 自动保存（1秒防抖）
- 完整的富文本编辑功能
- AI 编辑支持
- Slash 命令
- 字数统计

**窗口管理：**
- 同一文档只会打开一个窗口
- 重复点击会聚焦已存在的窗口
- 关闭窗口不影响其他窗口

## 🔧 技术实现

### Tauri 窗口管理

```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub async fn open_editor_window(
    app: tauri::AppHandle,
    file_id: String,
) -> Result<String, String> {
    let window_label = format!("editor-{}", file_id);
    
    // 检查窗口是否已存在
    if let Some(window) = app.get_webview_window(&window_label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(window_label);
    }

    // 创建新窗口
    WebviewWindowBuilder::new(&app, &window_label, ...)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(window_label)
}
```

### 前端路由

```typescript
// src/main.tsx
<HashRouter>
  <Routes>
    <Route path="/" element={<MainWindow />} />
    <Route path="/editor/:fileId" element={<EditorWindow />} />
  </Routes>
</HashRouter>
```

### 打开编辑器窗口

```typescript
// 主窗口中
const handleOpenFile = async (file: File) => {
  await invoke('open_editor_window', { fileId: file.id })
}
```

## 📊 数据流

```
主窗口                     SQLite 数据库                编辑器窗口
  │                            │                          │
  ├─ 加载工作空间列表 ────────→│                          │
  ├─ 加载文件列表 ────────────→│                          │
  ├─ 创建文档 ────────────────→│                          │
  │                            │                          │
  ├─ 点击文件                  │                          │
  └─ 打开编辑器窗口 ──────────────────────────────────────→│
                               │                          │
                               │←──── 加载文件内容 ────────┤
                               │←──── 自动保存 ────────────┤
                               │                          │
```

## 🎨 UI 特点

### 主窗口
- 左侧：工作空间列表（紧凑）
- 右侧：文件网格视图
- 顶部：搜索栏 + 操作按钮
- macOS 风格设计

### 编辑器窗口
- 顶部：文档标题（可编辑）
- 工具栏：格式化按钮
- 编辑区：Tiptap 编辑器
- 底部：字数统计
- 浮动工具栏：选中文本时出现
- AI 浮窗：光标位置弹出

## 🔄 数据迁移

首次启动时自动从 localStorage 迁移到 SQLite：

```typescript
// src/utils/migration.ts
export async function migrateFromLocalStorage() {
  // 1. 读取旧数据
  const oldData = localStorage.getItem('ai-editor-documents')
  
  // 2. 创建默认工作空间
  const workspace = await workspaceAPI.create('默认工作空间')
  
  // 3. 迁移所有文档
  for (const doc of oldData.documents) {
    await fileAPI.create({
      workspace_id: workspace.id,
      file_type: 'document',
      title: doc.title,
      content: doc.content,
    })
  }
  
  // 4. 标记已迁移
  localStorage.setItem('migrated-to-sqlite', 'true')
}
```

## 🚦 开发和测试

```bash
# 开发模式
pnpm tauri dev

# 构建
pnpm tauri build
```

### 测试多窗口

1. 启动应用（主窗口）
2. 创建工作空间
3. 创建几个文档
4. 点击文档 → 打开编辑器窗口
5. 再次点击同一文档 → 聚焦已存在的窗口
6. 点击不同文档 → 打开新窗口

## 🎯 优势

1. **更好的多任务** - 可以同时编辑多个文档
2. **独立窗口** - 每个文档独立，互不干扰
3. **系统集成** - 利用操作系统的窗口管理
4. **性能优化** - 主窗口和编辑器分离，互不影响
5. **用户体验** - 符合桌面应用习惯

## 📝 下一步

- [ ] 添加窗口状态保存（位置、大小）
- [ ] 支持拖拽文件到编辑器
- [ ] 添加标签页管理（可选）
- [ ] 窗口间通信（同步更新）
- [ ] 快捷键支持
