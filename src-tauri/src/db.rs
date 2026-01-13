use anyhow::Result;
use sqlx::{sqlite::SqlitePool, Pool, Sqlite};
use std::path::PathBuf;

pub struct Database {
    pool: Pool<Sqlite>,
}

impl Database {
    pub async fn new(db_path: PathBuf) -> Result<Self> {
        // 确保数据库目录存在
        if let Some(parent) = db_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());

        let pool = SqlitePool::connect(&db_url).await?;

        // 运行迁移
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    pub fn pool(&self) -> &Pool<Sqlite> {
        &self.pool
    }
}
