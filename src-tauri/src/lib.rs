mod commands;
mod db;
mod models;
mod services;

use commands::*;
use db::Database;
use services::*;
use std::path::PathBuf;
use tauri::Manager;

pub struct AppState {
    pub workspace_service: WorkspaceService,
    pub file_service: FileService,
    pub tag_service: TagService,
    pub search_service: SearchService,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 获取应用数据目录
            let app_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            // 创建数据库路径
            let db_path: PathBuf = app_dir.join("ai_editor.db");

            // 初始化数据库（在 async 运行时中）
            tauri::async_runtime::block_on(async {
                let db = Database::new(db_path)
                    .await
                    .expect("Failed to initialize database");

                let pool = db.pool().clone();

                // 创建服务
                let app_state = AppState {
                    workspace_service: WorkspaceService::new(pool.clone()),
                    file_service: FileService::new(pool.clone()),
                    tag_service: TagService::new(pool.clone()),
                    search_service: SearchService::new(pool.clone()),
                };

                // 管理状态
                app.manage(app_state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 窗口管理
            open_editor_window,
            // 工作空间
            create_workspace,
            get_workspace,
            list_workspaces,
            update_workspace,
            delete_workspace,
            // 文件
            create_file,
            get_file,
            list_files_by_workspace,
            list_files_by_type,
            update_file,
            delete_file,
            // 标签
            create_tag,
            get_tag,
            list_tags,
            delete_tag,
            add_file_tag,
            remove_file_tag,
            get_file_tags,
            // 搜索
            search_files,
            search_by_tags,
            find_similar_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
