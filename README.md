# AI 文本编辑器

基于 Tauri + React + Plate.js 构建的智能文本编辑器，支持 AI 辅助编辑功能。

## 功能特性

### 📝 富文本编辑
- 基于 Plate.js 的现代富文本编辑器
- 支持 Markdown 语法自动格式化
- 支持标题、列表、引用、代码块等格式
- 浮动工具栏，支持文本选中后的快速格式化

### 🤖 AI 辅助编辑
- 支持多种 AI 提供商（OpenAI、Claude 等）
- 选中文本后可使用 AI 进行编辑、改写、翻译等操作
- 内置常用编辑指令（修正语法、改写简洁、翻译等）
- 支持自定义编辑指令

### 📚 文档管理
- 本地文档存储和管理
- 文档搜索功能
- 自动保存功能
- 文档标题和内容预览

### ⚙️ 配置管理
- 支持多个 AI 提供商配置
- 主题切换（浅色/深色/跟随系统）
- 自动保存间隔设置
- API Key 安全存储

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **编辑器**: Plate.js (基于 Slate.js)
- **桌面应用**: Tauri (Rust)
- **状态管理**: Zustand
- **UI 组件**: Radix UI
- **图标**: Lucide React

## 开发环境设置

### 前置要求
- Node.js 18+
- Rust 1.70+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 开发模式运行
```bash
pnpm tauri dev
```

### 构建应用
```bash
pnpm tauri build
```

## 使用说明

### 1. 首次使用
1. 启动应用后，点击右上角的设置按钮
2. 在 "AI 配置" 标签页中添加你的 AI 提供商信息
3. 输入 API Key 并启用相应的提供商
4. 设置默认的 AI 提供商

### 2. 创建文档
1. 点击左侧边栏的 "新建" 按钮
2. 输入文档标题
3. 开始编写内容

### 3. 使用 AI 编辑
1. 选中需要编辑的文本
2. 点击浮动工具栏中的 ✨ 按钮
3. 输入编辑指令或选择预设指令
4. 点击 "开始编辑" 等待 AI 处理
5. 查看结果并选择 "应用编辑"

### 4. 文档搜索
- 在左侧边栏的搜索框中输入关键词
- 系统会搜索文档标题、内容和标签

## AI 提供商配置

### OpenAI
- **Base URL**: `https://api.openai.com/v1`
- **推荐模型**: `gpt-3.5-turbo` 或 `gpt-4`

### Claude (Anthropic)
- **Base URL**: `https://api.anthropic.com`
- **推荐模型**: `claude-3-sonnet-20240229`

### 其他兼容 OpenAI API 的服务
- 可以配置自定义的 Base URL
- 确保 API 格式兼容 OpenAI 标准

## 数据存储

应用数据存储在本地：
- **macOS**: `~/Library/Application Support/ai-text-editor/`
- **Windows**: `%APPDATA%/ai-text-editor/`
- **Linux**: `~/.local/share/ai-text-editor/`

包含以下文件：
- `documents.json`: 文档数据
- `settings.json`: 应用设置

## 快捷键

- `Ctrl/Cmd + N`: 新建文档
- `Ctrl/Cmd + S`: 保存文档
- `Ctrl/Cmd + F`: 搜索文档
- `Ctrl/Cmd + ,`: 打开设置

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License