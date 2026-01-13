use crate::models::{SearchQuery, SearchResult};
use anyhow::Result;
use sqlx::{Pool, Row, Sqlite};

pub struct SearchService {
    pool: Pool<Sqlite>,
}

impl SearchService {
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// 全文搜索（使用 FTS5）
    pub async fn search(&self, query: SearchQuery) -> Result<Vec<SearchResult>> {
        let limit = query.limit.unwrap_or(50);

        // 构建 FTS 查询
        let fts_query = self.build_fts_query(&query.query);

        let mut sql = String::from(
            r#"
            SELECT 
                f.id,
                f.workspace_id,
                f.file_type,
                f.title,
                f.content,
                f.file_path,
                f.created_at,
                f.updated_at,
                fts.rank as rank
            FROM files f
            INNER JOIN files_fts fts ON f.id = fts.file_id
            WHERE files_fts MATCH ?
            "#,
        );

        let mut params: Vec<String> = vec![fts_query];

        // 添加工作空间过滤
        if let Some(workspace_id) = &query.workspace_id {
            sql.push_str(" AND f.workspace_id = ?");
            params.push(workspace_id.clone());
        }

        // 添加文件类型过滤
        if let Some(file_type) = &query.file_type {
            sql.push_str(" AND f.file_type = ?");
            params.push(file_type.clone());
        }

        // 添加标签过滤
        if let Some(tags) = &query.tags {
            if !tags.is_empty() {
                sql.push_str(
                    r#"
                    AND f.id IN (
                        SELECT ft.file_id FROM file_tags ft
                        INNER JOIN tags t ON ft.tag_id = t.id
                        WHERE t.name IN (
                    "#,
                );

                let placeholders = tags.iter().map(|_| "?").collect::<Vec<_>>().join(",");
                sql.push_str(&placeholders);
                sql.push_str(")");

                // 如果需要匹配所有标签，使用 GROUP BY 和 HAVING
                sql.push_str(&format!(
                    " GROUP BY ft.file_id HAVING COUNT(DISTINCT t.id) = {}",
                    tags.len()
                ));
                sql.push_str(")");

                for tag in tags {
                    params.push(tag.clone());
                }
            }
        }

        sql.push_str(" ORDER BY rank DESC LIMIT ?");
        params.push(limit.to_string());

        // 执行查询
        let mut q = sqlx::query(&sql);
        for param in params {
            q = q.bind(param);
        }

        let rows = q.fetch_all(&self.pool).await?;

        let results: Vec<SearchResult> = rows
            .iter()
            .map(|row| SearchResult {
                id: row.get("id"),
                workspace_id: row.get("workspace_id"),
                file_type: row.get("file_type"),
                title: row.get("title"),
                content: row.get("content"),
                file_path: row.get("file_path"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                rank: row.get("rank"),
            })
            .collect();

        Ok(results)
    }

    /// 构建 FTS5 查询字符串
    fn build_fts_query(&self, query: &str) -> String {
        // 简单的查询处理：
        // 1. 分词
        // 2. 添加通配符支持前缀匹配
        // 3. 使用 OR 连接多个词

        let terms: Vec<String> = query
            .split_whitespace()
            .filter(|s| !s.is_empty())
            .map(|s| {
                // 转义特殊字符
                let escaped = s.replace('"', "\"\"");
                // 添加通配符支持前缀匹配
                format!("\"{}\"*", escaped)
            })
            .collect();

        if terms.is_empty() {
            return String::from("*");
        }

        // 使用 OR 连接，这样任何一个词匹配都会返回结果
        terms.join(" OR ")
    }

    /// 按标签搜索
    pub async fn search_by_tags(
        &self,
        workspace_id: Option<String>,
        tag_names: Vec<String>,
        match_all: bool,
    ) -> Result<Vec<SearchResult>> {
        if tag_names.is_empty() {
            return Ok(vec![]);
        }

        let mut sql = String::from(
            r#"
            SELECT 
                f.id,
                f.workspace_id,
                f.file_type,
                f.title,
                f.content,
                f.file_path,
                f.created_at,
                f.updated_at,
                0.0 as rank
            FROM files f
            INNER JOIN file_tags ft ON f.id = ft.file_id
            INNER JOIN tags t ON ft.tag_id = t.id
            WHERE t.name IN (
            "#,
        );

        let placeholders = tag_names.iter().map(|_| "?").collect::<Vec<_>>().join(",");
        sql.push_str(&placeholders);
        sql.push_str(")");

        let mut params: Vec<String> = tag_names.clone();

        if let Some(ws_id) = workspace_id {
            sql.push_str(" AND f.workspace_id = ?");
            params.push(ws_id);
        }

        if match_all {
            // 匹配所有标签
            sql.push_str(&format!(
                " GROUP BY f.id HAVING COUNT(DISTINCT t.id) = {}",
                tag_names.len()
            ));
        } else {
            // 匹配任意标签
            sql.push_str(" GROUP BY f.id");
        }

        sql.push_str(" ORDER BY f.updated_at DESC");

        let mut q = sqlx::query(&sql);
        for param in params {
            q = q.bind(param);
        }

        let rows = q.fetch_all(&self.pool).await?;

        let results: Vec<SearchResult> = rows
            .iter()
            .map(|row| SearchResult {
                id: row.get("id"),
                workspace_id: row.get("workspace_id"),
                file_type: row.get("file_type"),
                title: row.get("title"),
                content: row.get("content"),
                file_path: row.get("file_path"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                rank: row.get("rank"),
            })
            .collect();

        Ok(results)
    }

    /// 相似文档推荐（基于标签）
    pub async fn find_similar(&self, file_id: &str, limit: i64) -> Result<Vec<SearchResult>> {
        let sql = r#"
            SELECT DISTINCT
                f.id,
                f.workspace_id,
                f.file_type,
                f.title,
                f.content,
                f.file_path,
                f.created_at,
                f.updated_at,
                COUNT(DISTINCT ft2.tag_id) as rank
            FROM files f
            INNER JOIN file_tags ft2 ON f.id = ft2.file_id
            WHERE ft2.tag_id IN (
                SELECT tag_id FROM file_tags WHERE file_id = ?
            )
            AND f.id != ?
            GROUP BY f.id
            ORDER BY rank DESC, f.updated_at DESC
            LIMIT ?
        "#;

        let rows = sqlx::query(sql)
            .bind(file_id)
            .bind(file_id)
            .bind(limit)
            .fetch_all(&self.pool)
            .await?;

        let results: Vec<SearchResult> = rows
            .iter()
            .map(|row| SearchResult {
                id: row.get("id"),
                workspace_id: row.get("workspace_id"),
                file_type: row.get("file_type"),
                title: row.get("title"),
                content: row.get("content"),
                file_path: row.get("file_path"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
                rank: row.get::<i64, _>("rank") as f64,
            })
            .collect();

        Ok(results)
    }
}
