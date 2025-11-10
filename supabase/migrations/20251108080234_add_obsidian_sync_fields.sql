-- Add fields to support Obsidian sync integration
-- These fields help track the source files and sync status from Obsidian vault

-- Add source_path to blog_posts (tracks original Obsidian file path)
ALTER TABLE blog_posts
ADD COLUMN source_path TEXT UNIQUE,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add source_path to projects (for project documentation in Obsidian)
ALTER TABLE projects
ADD COLUMN source_path TEXT UNIQUE,
ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups by source_path (used by sync scripts)
CREATE INDEX idx_blog_posts_source_path ON blog_posts(source_path);
CREATE INDEX idx_projects_source_path ON projects(source_path);

-- Comments for documentation
COMMENT ON COLUMN blog_posts.source_path IS 'Path to the source Obsidian markdown file (e.g., "blog/my-post.md")';
COMMENT ON COLUMN blog_posts.last_synced_at IS 'Timestamp of last sync from Obsidian vault';
COMMENT ON COLUMN projects.source_path IS 'Path to the source Obsidian markdown file for project documentation';
COMMENT ON COLUMN projects.last_synced_at IS 'Timestamp of last sync from Obsidian vault';
