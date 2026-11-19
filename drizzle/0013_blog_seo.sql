-- Blog SEO panel (Nov 2026): secondary keywords. Run in D1 before deploying.
ALTER TABLE blog_posts ADD COLUMN secondary_keywords TEXT NOT NULL DEFAULT '';
