use crate::models::{CreateMediaAsset, MediaAsset};
use anyhow::Result;
use chrono::Utc;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct MediaService {
    pool: Pool<Sqlite>,
}

impl MediaService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, data: CreateMediaAsset) -> Result<MediaAsset> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let asset = sqlx::query_as::<_, MediaAsset>(
            r#"
            INSERT INTO media_assets (
                id, workspace_id, file_name, file_path, file_size, 
                mime_type, width, height, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&data.workspace_id)
        .bind(&data.file_name)
        .bind(&data.file_path)
        .bind(&data.file_size)
        .bind(&data.mime_type)
        .bind(&data.width)
        .bind(&data.height)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(asset)
    }

    pub async fn get(&self, id: &str) -> Result<Option<MediaAsset>> {
        let asset = sqlx::query_as::<_, MediaAsset>("SELECT * FROM media_assets WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(asset)
    }

    pub async fn list_by_workspace(&self, workspace_id: &str) -> Result<Vec<MediaAsset>> {
        let assets = sqlx::query_as::<_, MediaAsset>(
            "SELECT * FROM media_assets WHERE workspace_id = ? ORDER BY created_at DESC",
        )
        .bind(workspace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(assets)
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM media_assets WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 关联媒体到文档
    pub async fn link_to_file(&self, file_id: &str, media_id: &str) -> Result<()> {
        let now = Utc::now().to_rfc3339();

        sqlx::query(
            "INSERT OR IGNORE INTO file_media (file_id, media_id, created_at) VALUES (?, ?, ?)",
        )
        .bind(file_id)
        .bind(media_id)
        .bind(&now)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    // 取消关联
    pub async fn unlink_from_file(&self, file_id: &str, media_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM file_media WHERE file_id = ? AND media_id = ?")
            .bind(file_id)
            .bind(media_id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    // 获取文档关联的所有媒体
    pub async fn get_file_media(&self, file_id: &str) -> Result<Vec<MediaAsset>> {
        let assets = sqlx::query_as::<_, MediaAsset>(
            r#"
            SELECT m.* FROM media_assets m
            INNER JOIN file_media fm ON m.id = fm.media_id
            WHERE fm.file_id = ?
            ORDER BY m.created_at DESC
            "#,
        )
        .bind(file_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(assets)
    }
}
