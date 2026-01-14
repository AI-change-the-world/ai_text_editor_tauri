use crate::models::{CreateFile, File, Tag, UpdateFile};
use anyhow::Result;
use chrono::Utc;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct FileService {
    pool: Pool<Sqlite>,
}

impl FileService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, data: CreateFile) -> Result<File> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let file = sqlx::query_as::<_, File>(
            r#"
            INSERT INTO files (
                id, workspace_id, file_type, title, content, content_plain,
                file_path, file_size, mime_type, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&data.workspace_id)
        .bind(&data.file_type)
        .bind(&data.title)
        .bind(&data.content)
        .bind(&data.content_plain)
        .bind(&data.file_path)
        .bind(&data.file_size)
        .bind(&data.mime_type)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(file)
    }

    pub async fn get(&self, id: &str) -> Result<Option<File>> {
        let file = sqlx::query_as::<_, File>("SELECT * FROM files WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(file)
    }

    pub async fn list_by_workspace(&self, workspace_id: &str) -> Result<Vec<File>> {
        let files = sqlx::query_as::<_, File>(
            "SELECT * FROM files WHERE workspace_id = ? ORDER BY updated_at DESC",
        )
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(files)
    }

    pub async fn list_by_type(&self, workspace_id: &str, file_type: &str) -> Result<Vec<File>> {
        let files = sqlx::query_as::<_, File>(
            "SELECT * FROM files WHERE workspace_id = ? AND file_type = ? ORDER BY updated_at DESC",
        )
        .bind(workspace_id)
        .bind(file_type)
        .fetch_all(&self.pool)
        .await?;

        Ok(files)
    }

    pub async fn update(&self, id: &str, data: UpdateFile) -> Result<File> {
        let now = Utc::now().to_rfc3339();

        let mut query = String::from("UPDATE files SET updated_at = ?");
        let mut params: Vec<String> = vec![now.clone()];

        if let Some(title) = data.title {
            query.push_str(", title = ?");
            params.push(title);
        }

        if let Some(content) = data.content {
            query.push_str(", content = ?");
            params.push(content);
        }

        if let Some(content_plain) = data.content_plain {
            query.push_str(", content_plain = ?");
            params.push(content_plain);
        }

        if let Some(file_path) = data.file_path {
            query.push_str(", file_path = ?");
            params.push(file_path);
        }

        if let Some(file_size) = data.file_size {
            query.push_str(", file_size = ?");
            params.push(file_size.to_string());
        }

        if let Some(mime_type) = data.mime_type {
            query.push_str(", mime_type = ?");
            params.push(mime_type);
        }

        query.push_str(" WHERE id = ? RETURNING *");
        params.push(id.to_string());

        let mut q = sqlx::query_as::<_, File>(&query);
        for param in params {
            q = q.bind(param);
        }

        let file = q.fetch_one(&self.pool).await?;

        Ok(file)
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM files WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 标签相关操作
    pub async fn add_tag(&self, file_id: &str, tag_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT OR IGNORE INTO file_tags (file_id, tag_id, created_at) VALUES (?, ?, ?)",
        )
        .bind(file_id)
        .bind(tag_id)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        // 更新 FTS 表的标签
        self.update_fts_tags(file_id).await?;

        Ok(())
    }

    pub async fn remove_tag(&self, file_id: &str, tag_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM file_tags WHERE file_id = ? AND tag_id = ?")
            .bind(file_id)
            .bind(tag_id)
            .execute(&self.pool)
            .await?;

        // 更新 FTS 表的标签
        self.update_fts_tags(file_id).await?;

        Ok(())
    }

    pub async fn get_tags(&self, file_id: &str) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>(
            r#"
            SELECT t.* FROM tags t
            INNER JOIN file_tags ft ON t.id = ft.tag_id
            WHERE ft.file_id = ?
            ORDER BY t.name
            "#,
        )
        .bind(file_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(tags)
    }

    async fn update_fts_tags(&self, file_id: &str) -> Result<()> {
        // 获取文件的所有标签
        let tags = self.get_tags(file_id).await?;
        let tags_str = tags
            .iter()
            .map(|t| t.name.clone())
            .collect::<Vec<_>>()
            .join(" ");

        // 更新 FTS 表
        sqlx::query("UPDATE files_fts SET tags = ? WHERE file_id = ?")
            .bind(&tags_str)
            .bind(file_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
