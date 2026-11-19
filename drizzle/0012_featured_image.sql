-- Featured image management (Nov 2026). Run each statement in D1 before deploying.
ALTER TABLE blog_media ADD COLUMN title TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_media ADD COLUMN description TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_media ADD COLUMN attribution TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_media ADD COLUMN original_id INTEGER;
ALTER TABLE blog_posts ADD COLUMN featured_caption TEXT NOT NULL DEFAULT '';
ALTER TABLE blog_posts ADD COLUMN featured_focal_x INTEGER NOT NULL DEFAULT 50;
ALTER TABLE blog_posts ADD COLUMN featured_focal_y INTEGER NOT NULL DEFAULT 50;
