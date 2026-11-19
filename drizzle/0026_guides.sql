-- Guides Library: guides share the blog CMS tables, told apart by `kind`. Run ONE statement at a time in D1 Studio.
ALTER TABLE blog_posts ADD COLUMN kind TEXT NOT NULL DEFAULT 'blog';
ALTER TABLE blog_categories ADD COLUMN kind TEXT NOT NULL DEFAULT 'blog';
CREATE INDEX IF NOT EXISTS blog_posts_kind_idx ON blog_posts (kind, status);
