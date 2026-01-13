use crate::models::{CreateTag, Tag};
use anyhow::Result;
use chrono::Utc;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct TagService {
    pool: Pool<Sqlite>,
}

impl TagService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, data: CreateTag) -> Result<Tag> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let tag = sqlx::query_as::<_, Tag>(
            "INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?) RETURNING *",
        )
        .bind(&id)
        .bind(&data.name)
        .bind(&data.color)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(tag)
    }

    pub async fn get(&self, id: &str) -> Result<Option<Tag>> {
        let tag = sqlx::query_as::<_, Tag>("SELECT * FROM tags WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(tag)
    }

    pub async fn get_by_name(&self, name: &str) -> Result<Option<Tag>> {
        let tag = sqlx::query_as::<_, Tag>("SELECT * FROM tags WHERE name = ?")
            .bind(name)
            .fetch_optional(&self.pool)
            .await?;

        Ok(tag)
    }

    pub async fn list(&self) -> Result<Vec<Tag>> {
        let tags = sqlx::query_as::<_, Tag>("SELECT * FROM tags ORDER BY name")
            .fetch_all(&self.pool)
            .await?;

        Ok(tags)
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM tags WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_file_count(&self, tag_id: &str) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM file_tags WHERE tag_id = ?")
            .bind(tag_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(count.0)
    }
}
