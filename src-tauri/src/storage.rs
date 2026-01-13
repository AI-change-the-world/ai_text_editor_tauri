use crate::models::{AppSettings, CreateDocumentRequest, Document, UpdateDocumentRequest};
use chrono::Utc;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

pub struct Storage {
    data_dir: PathBuf,
    documents: HashMap<String, Document>,
    settings: AppSettings,
}

impl Storage {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let data_dir = dirs::data_dir()
            .ok_or("Could not find data directory")?
            .join("ai-text-editor");

        fs::create_dir_all(&data_dir)?;

        let mut storage = Storage {
            data_dir,
            documents: HashMap::new(),
            settings: AppSettings {
                theme: "system".to_string(),
                ai_providers: vec![],
                default_provider: None,
                auto_save: true,
                auto_save_interval: 30,
            },
        };

        storage.load_documents()?;
        storage.load_settings()?;

        Ok(storage)
    }

    fn documents_file(&self) -> PathBuf {
        self.data_dir.join("documents.json")
    }

    fn settings_file(&self) -> PathBuf {
        self.data_dir.join("settings.json")
    }

    pub fn load_documents(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let file_path = self.documents_file();
        if file_path.exists() {
            let content = fs::read_to_string(file_path)?;
            let documents: Vec<Document> = serde_json::from_str(&content)?;
            self.documents = documents
                .into_iter()
                .map(|doc| (doc.id.clone(), doc))
                .collect();
        }
        Ok(())
    }

    pub fn save_documents(&self) -> Result<(), Box<dyn std::error::Error>> {
        let documents: Vec<&Document> = self.documents.values().collect();
        let content = serde_json::to_string_pretty(&documents)?;
        fs::write(self.documents_file(), content)?;
        Ok(())
    }

    pub fn load_settings(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let file_path = self.settings_file();
        if file_path.exists() {
            let content = fs::read_to_string(file_path)?;
            self.settings = serde_json::from_str(&content)?;
        }
        Ok(())
    }

    pub fn save_settings(&self) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(&self.settings)?;
        fs::write(self.settings_file(), content)?;
        Ok(())
    }

    pub fn get_all_documents(&self) -> Vec<Document> {
        let mut docs: Vec<Document> = self.documents.values().cloned().collect();
        docs.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        docs
    }

    pub fn get_document(&self, id: &str) -> Option<Document> {
        self.documents.get(id).cloned()
    }

    pub fn create_document(
        &mut self,
        request: CreateDocumentRequest,
    ) -> Result<Document, Box<dyn std::error::Error>> {
        let now = Utc::now();
        let document = Document {
            id: Uuid::new_v4().to_string(),
            title: request.title.unwrap_or_else(|| "未命名文档".to_string()),
            content: serde_json::json!([{
                "type": "p",
                "children": [{ "text": "" }]
            }]),
            created_at: now,
            updated_at: now,
            tags: vec![],
        };

        self.documents.insert(document.id.clone(), document.clone());
        self.save_documents()?;

        Ok(document)
    }

    pub fn update_document(
        &mut self,
        id: &str,
        request: UpdateDocumentRequest,
    ) -> Result<Option<Document>, Box<dyn std::error::Error>> {
        if let Some(document) = self.documents.get_mut(id) {
            if let Some(title) = request.title {
                document.title = title;
            }
            if let Some(content) = request.content {
                document.content = content;
            }
            if let Some(tags) = request.tags {
                document.tags = tags;
            }
            document.updated_at = Utc::now();

            let updated_doc = document.clone();
            self.save_documents()?;
            Ok(Some(updated_doc))
        } else {
            Ok(None)
        }
    }

    pub fn delete_document(&mut self, id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let removed = self.documents.remove(id).is_some();
        if removed {
            self.save_documents()?;
        }
        Ok(removed)
    }

    pub fn search_documents(&self, query: &str) -> Vec<Document> {
        let query_lower = query.to_lowercase();
        let mut results: Vec<Document> = self
            .documents
            .values()
            .filter(|doc| {
                doc.title.to_lowercase().contains(&query_lower)
                    || doc
                        .content
                        .to_string()
                        .to_lowercase()
                        .contains(&query_lower)
                    || doc
                        .tags
                        .iter()
                        .any(|tag| tag.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect();

        results.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        results
    }

    pub fn get_settings(&self) -> AppSettings {
        self.settings.clone()
    }

    pub fn update_settings(
        &mut self,
        settings: AppSettings,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.settings = settings;
        self.save_settings()?;
        Ok(())
    }
}
