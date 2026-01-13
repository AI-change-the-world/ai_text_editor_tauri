use crate::models::{
    AppSettings, CreateDocumentRequest, Document, SearchRequest, UpdateDocumentRequest,
};
use crate::storage::Storage;
use std::sync::Mutex;
use tauri::State;

type StorageState = Mutex<Storage>;

#[tauri::command]
pub fn get_all_documents(storage: State<StorageState>) -> Result<Vec<Document>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.get_all_documents())
}

#[tauri::command]
pub fn get_document(id: String, storage: State<StorageState>) -> Result<Option<Document>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.get_document(&id))
}

#[tauri::command]
pub fn create_document(
    request: CreateDocumentRequest,
    storage: State<StorageState>,
) -> Result<Document, String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage.create_document(request).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_document(
    id: String,
    request: UpdateDocumentRequest,
    storage: State<StorageState>,
) -> Result<Option<Document>, String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage
        .update_document(&id, request)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_document(id: String, storage: State<StorageState>) -> Result<bool, String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage.delete_document(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_documents(
    request: SearchRequest,
    storage: State<StorageState>,
) -> Result<Vec<Document>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.search_documents(&request.query))
}

#[tauri::command]
pub fn get_settings(storage: State<StorageState>) -> Result<AppSettings, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    Ok(storage.get_settings())
}

#[tauri::command]
pub fn update_settings(settings: AppSettings, storage: State<StorageState>) -> Result<(), String> {
    let mut storage = storage.lock().map_err(|e| e.to_string())?;
    storage.update_settings(settings).map_err(|e| e.to_string())
}
