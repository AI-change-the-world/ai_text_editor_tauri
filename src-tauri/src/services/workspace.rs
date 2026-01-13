use crate::models::{CreateWorkspace, UpdateWorkspace, Workspace};
use anyhow::Result;
use chrono::Utc;
use sqlx::{Pool, Sqlite};
use uuid::Uuid;

pub struct WorkspaceService {
    pool: Pool<Sqlite>,
}

impl WorkspaceService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    pub async fn create(&self, data: CreateWorkspace) -> Result<Workspace> {
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let workspace = sqlx::query_as::<_, Workspace>(
            r#"
            INSERT INTO workspaces (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
            "#,
        )
        .bind(&id)
        .bind(&data.name)
        .bind(&data.description)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(workspace)
    }

    pub async fn get(&self, id: &str) -> Result<Option<Workspace>> {
        let workspace = sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(workspace)
    }

    pub async fn list(&self) -> Result<Vec<Workspace>> {
        let workspaces =
            sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces ORDER BY updated_at DESC")
                .fetch_all(&self.pool)
                .await?;

        Ok(workspaces)
    }

    pub async fn update(&self, id: &str, data: UpdateWorkspace) -> Result<Workspace> {
        let now = Utc::now().to_rfc3339();

        // 构建动态更新查询
        let mut query = String::from("UPDATE workspaces SET updated_at = ?");
        let mut params: Vec<String> = vec![now.clone()];

        if let Some(name) = data.name {
            query.push_str(", name = ?");
            params.push(name);
        }

        if let Some(description) = data.description {
            query.push_str(", description = ?");
            params.push(description);
        }

        query.push_str(" WHERE id = ? RETURNING *");
        params.push(id.to_string());

        let mut q = sqlx::query_as::<_, Workspace>(&query);
        for param in params {
            q = q.bind(param);
        }

        let workspace = q.fetch_one(&self.pool).await?;

        Ok(workspace)
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM workspaces WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    pub async fn get_file_count(&self, workspace_id: &str) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM files WHERE workspace_id = ?")
            .bind(workspace_id)
            .fetch_one(&self.pool)
            .await?;

        Ok(count.0)
    }
}
