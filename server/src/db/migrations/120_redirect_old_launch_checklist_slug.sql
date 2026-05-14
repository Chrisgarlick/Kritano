-- Redirect /blog/website-launch-checklist (404) to the published post.
-- Many internal links use the short form which matches the resource slug and
-- previously 404'd on the blog side. This adds a 301-style redirect.

INSERT INTO blog_post_redirects (post_id, old_slug)
SELECT id, 'website-launch-checklist'
FROM blog_posts
WHERE slug = 'website-launch-checklist-25-things-to-check-before-going-live'
ON CONFLICT (old_slug) DO NOTHING;
