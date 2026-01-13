use crate::models::*;
use crate::services::*;
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
