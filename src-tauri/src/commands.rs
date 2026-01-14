use crate::models::*;
use crate::AppState;
use tauri::{Manager, State, WebviewUrl, WebviewWindowBuilder};

// ============ 窗口管理命令 ============

#[tauri::command]
pub async fn open_editor_window(app: tauri::AppHandle, file_id: String) -> Result<String, String> {
    let window_label = format!("editor-{}", file_id);

    // 检查窗口是否已存在
    if let Some(window) = app.get_webview_window(&window_label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(window_label);
    }

    // 创建新窗口
    let url = format!("/#/editor/{}", file_id);

    WebviewWindowBuilder::new(&app, &window_label, WebviewUrl::App(url.into()))
        .title("编辑器")
        .inner_size(1000.0, 700.0)
        .min_inner_size(600.0, 400.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    Ok(window_label)
}

#[tauri::command]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<String, String> {
    let window_label = "settings";

    // 检查窗口是否已存在
    if let Some(window) = app.get_webview_window(window_label) {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(window_label.to_string());
    }

    // 创建设置窗口
    WebviewWindowBuilder::new(&app, window_label, WebviewUrl::App("/#/settings".into()))
        .title("设置")
        .inner_size(700.0, 500.0)
        .min_inner_size(500.0, 400.0)
        .resizable(true)
        .center()
        .build()
        .map_err(|e| e.to_string())?;

    Ok(window_label.to_string())
}

// ============ 工作空间命令 ============

#[tauri::command]
pub async fn create_workspace(
    state: State<'_, AppState>,
    data: CreateWorkspace,
) -> Result<Workspace, String> {
    state
        .workspace_service
        .create(data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_workspace(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<Workspace>, String> {
    state
        .workspace_service
        .get(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_workspaces(state: State<'_, AppState>) -> Result<Vec<Workspace>, String> {
    state
        .workspace_service
        .list()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_workspace(
    state: State<'_, AppState>,
    id: String,
    data: UpdateWorkspace,
) -> Result<Workspace, String> {
    state
        .workspace_service
        .update(&id, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_workspace(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .workspace_service
        .delete(&id)
        .await
        .map_err(|e| e.to_string())
}

// ============ 文件命令 ============

#[tauri::command]
pub async fn create_file(state: State<'_, AppState>, data: CreateFile) -> Result<File, String> {
    state
        .file_service
        .create(data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file(state: State<'_, AppState>, id: String) -> Result<Option<File>, String> {
    state.file_service.get(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_files_by_workspace(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<Vec<File>, String> {
    state
        .file_service
        .list_by_workspace(&workspace_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_files_by_type(
    state: State<'_, AppState>,
    workspace_id: String,
    file_type: String,
) -> Result<Vec<File>, String> {
    state
        .file_service
        .list_by_type(&workspace_id, &file_type)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_file(
    state: State<'_, AppState>,
    id: String,
    data: UpdateFile,
) -> Result<File, String> {
    state
        .file_service
        .update(&id, data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .file_service
        .delete(&id)
        .await
        .map_err(|e| e.to_string())
}

// ============ 标签命令 ============

#[tauri::command]
pub async fn create_tag(state: State<'_, AppState>, data: CreateTag) -> Result<Tag, String> {
    state
        .tag_service
        .create(data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tag(state: State<'_, AppState>, id: String) -> Result<Option<Tag>, String> {
    state.tag_service.get(&id).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, String> {
    state.tag_service.list().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tag(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state
        .tag_service
        .delete(&id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_file_tag(
    state: State<'_, AppState>,
    file_id: String,
    tag_id: String,
) -> Result<(), String> {
    state
        .file_service
        .add_tag(&file_id, &tag_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_file_tag(
    state: State<'_, AppState>,
    file_id: String,
    tag_id: String,
) -> Result<(), String> {
    state
        .file_service
        .remove_tag(&file_id, &tag_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file_tags(
    state: State<'_, AppState>,
    file_id: String,
) -> Result<Vec<Tag>, String> {
    state
        .file_service
        .get_tags(&file_id)
        .await
        .map_err(|e| e.to_string())
}

// ============ 搜索命令 ============

#[tauri::command]
pub async fn search_files(
    state: State<'_, AppState>,
    query: SearchQuery,
) -> Result<Vec<SearchResult>, String> {
    state
        .search_service
        .search(query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_by_tags(
    state: State<'_, AppState>,
    workspace_id: Option<String>,
    tag_names: Vec<String>,
    match_all: bool,
) -> Result<Vec<SearchResult>, String> {
    state
        .search_service
        .search_by_tags(workspace_id, tag_names, match_all)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn find_similar_files(
    state: State<'_, AppState>,
    file_id: String,
    limit: i64,
) -> Result<Vec<SearchResult>, String> {
    state
        .search_service
        .find_similar(&file_id, limit)
        .await
        .map_err(|e| e.to_string())
}

// ============ 媒体命令 ============

/// 上传媒体文件（接收 base64 数据）
#[tauri::command]
pub async fn upload_media(
    state: State<'_, AppState>,
    workspace_id: String,
    file_id: String,
    file_name: String,
    mime_type: String,
    data: String, // base64 encoded
) -> Result<MediaAsset, String> {
    use base64::{engine::general_purpose::STANDARD, Engine};
    use std::fs;

    // 解码 base64
    let bytes = STANDARD.decode(&data).map_err(|e| e.to_string())?;
    let file_size = bytes.len() as i64;

    // 生成 UUID 和文件路径
    let id = uuid::Uuid::new_v4().to_string();
    let extension = file_name.split('.').last().unwrap_or("bin");
    let stored_name = format!("{}.{}", id, extension);
    let file_path = state.media_dir.join(&stored_name);

    // 写入文件
    fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;

    // 获取图片尺寸（如果是图片）
    let (width, height) = if mime_type.starts_with("image/") {
        get_image_dimensions(&bytes).unwrap_or((None, None))
    } else {
        (None, None)
    };

    // 保存到数据库
    let asset = state
        .media_service
        .create(crate::models::CreateMediaAsset {
            workspace_id: workspace_id.clone(),
            file_name,
            file_path: file_path.to_string_lossy().to_string(),
            file_size,
            mime_type,
            width,
            height,
        })
        .await
        .map_err(|e| e.to_string())?;

    // 关联到文档
    state
        .media_service
        .link_to_file(&file_id, &asset.id)
        .await
        .map_err(|e| e.to_string())?;

    Ok(asset)
}

/// 获取媒体信息
#[tauri::command]
pub async fn get_media(
    state: State<'_, AppState>,
    id: String,
) -> Result<Option<MediaAsset>, String> {
    state
        .media_service
        .get(&id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取媒体文件的实际路径（用于渲染）
#[tauri::command]
pub async fn get_media_path(state: State<'_, AppState>, id: String) -> Result<String, String> {
    let asset = state
        .media_service
        .get(&id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or("Media not found")?;

    Ok(asset.file_path)
}

/// 获取文档关联的所有媒体
#[tauri::command]
pub async fn list_file_media(
    state: State<'_, AppState>,
    file_id: String,
) -> Result<Vec<MediaAsset>, String> {
    state
        .media_service
        .get_file_media(&file_id)
        .await
        .map_err(|e| e.to_string())
}

/// 删除媒体
#[tauri::command]
pub async fn delete_media(state: State<'_, AppState>, id: String) -> Result<(), String> {
    // 获取媒体信息
    if let Some(asset) = state
        .media_service
        .get(&id)
        .await
        .map_err(|e| e.to_string())?
    {
        // 删除文件
        let _ = std::fs::remove_file(&asset.file_path);
    }

    // 从数据库删除
    state
        .media_service
        .delete(&id)
        .await
        .map_err(|e| e.to_string())
}

/// 获取图片尺寸
fn get_image_dimensions(data: &[u8]) -> Option<(Option<i32>, Option<i32>)> {
    // 简单解析 PNG/JPEG 头部获取尺寸
    if data.len() < 24 {
        return None;
    }

    // PNG
    if data.starts_with(&[0x89, 0x50, 0x4E, 0x47]) {
        let width = u32::from_be_bytes([data[16], data[17], data[18], data[19]]) as i32;
        let height = u32::from_be_bytes([data[20], data[21], data[22], data[23]]) as i32;
        return Some((Some(width), Some(height)));
    }

    // JPEG - 需要查找 SOF0 标记
    if data.starts_with(&[0xFF, 0xD8]) {
        let mut i = 2;
        while i < data.len() - 9 {
            if data[i] == 0xFF {
                let marker = data[i + 1];
                // SOF0, SOF1, SOF2 标记
                if marker >= 0xC0 && marker <= 0xC2 {
                    let height = u16::from_be_bytes([data[i + 5], data[i + 6]]) as i32;
                    let width = u16::from_be_bytes([data[i + 7], data[i + 8]]) as i32;
                    return Some((Some(width), Some(height)));
                }
                if marker == 0xD9 || marker == 0xDA {
                    break;
                }
                let len = u16::from_be_bytes([data[i + 2], data[i + 3]]) as usize;
                i += 2 + len;
            } else {
                i += 1;
            }
        }
    }

    None
}
