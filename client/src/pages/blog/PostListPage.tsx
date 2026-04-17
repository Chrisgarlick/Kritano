/**
 * Public Blog Post List Page
 *
 * Paginated, filterable by category and tag.
 * SEO meta tags via react-helmet-async.
 * Uses shared PublicLayout for consistent navigation.
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { blogApi } from '../../services/api';
import type { BlogPostSummary } from '../../services/api';
import AuthorBio from '../../components/blog/AuthorBio';
import { Clock, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  'seo': 'SEO',
  'accessibility': 'Accessibility',
  'security': 'Security',
  'performance': 'Performance',
  'content-quality': 'Content Quality',
  'structured-data': 'Structured Data',
  'eeat': 'E-E-A-T',
  'aeo': 'AEO',
  'guides': 'Guides',
  'case-studies': 'Case Studies',
  'product-updates': 'Product Updates',
};

export default function PostListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([]);

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;

  useEffect(() => {
    loadPosts();
  }, [page, category, tag]);

  useEffect(() => {
    blogApi.getCategories().then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data } = await blogApi.listPosts({ category, tag, page, limit: 12 });
      setPosts(data.posts);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  };

  return (
    <PublicLayout>
      <PageSeo
        title={
          tag
            ? `#${tag} Articles - Web Auditing Blog`
            : category
              ? `${CATEGORY_LABELS[category] || category} Articles - Web Auditing Blog`
              : 'Blog - Web Auditing Guides & Insights'
        }
        description={
          tag
            ? `Articles tagged "${tag}" - SEO guides, accessibility tips, and web performance insights from Kritano.`
            : category
              ? `${CATEGORY_LABELS[category] || category} articles - expert guides and insights from the Kritano team.`
              : 'SEO guides, accessibility tips, security insights, and web performance best practices from Kritano.'
        }
        path={tag ? `/blog?tag=${tag}` : category ? `/blog?category=${category}` : '/blog'}
        ogImage="/brand/og-blog.png"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Kritano Blog',
            description: 'SEO guides, accessibility tips, and web performance insights.',
            url: 'https://kritano.com/blog',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://kritano.com/blog' },
            ],
          },
        ]}
      />

      {totalPages > 1 && (
        <Helmet>
          {page > 1 && <link rel="prev" href={`https://kritano.com/blog?page=${page - 1}`} />}
          {page < totalPages && <link rel="next" href={`https://kritano.com/blog?page=${page + 1}`} />}
        </Helmet>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        {/* Page title */}
        <div className="mb-16">
          <h1 className="font-display text-4xl lg:text-5xl text-slate-900 dark:text-white leading-tight mb-4">
            {category ? `${CATEGORY_LABELS[category] || category}` : 'Blog'}
          </h1>
          <p className="text-lg text-slate-700 dark:text-slate-400 max-w-2xl">
            SEO guides, accessibility tips, security insights, and web performance best practices.
          </p>
          {tag && (
            <div className="mt-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">#{tag}</span>
              <button
                onClick={() => setFilter('tag', null)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 ml-2"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-10">
            <button
              onClick={() => setFilter('category', null)}
              className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
                !category
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.category}
                onClick={() => setFilter('category', c.category)}
                className={`text-sm px-4 py-2 rounded-lg transition-colors font-medium ${
                  category === c.category
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {CATEGORY_LABELS[c.category] || c.category}
              </button>
            ))}
          </div>
        )}

        {/* Loading announcement */}
        <div aria-live="polite" className="sr-only">
          {loading ? 'Loading posts...' : `${posts.length} posts loaded`}
        </div>

        {/* Post grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-xl h-80 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-slate-600 dark:text-slate-400">No posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 group"
              >
                {post.featured_image_url && (() => {
                  const webpUrl = post.featured_image_url
                    .replace('/original/', '/webp/')
                    .replace(/\.(png|jpe?g|gif)$/i, '.webp');
                  const thumbUrl = post.featured_image_url
                    .replace('/original/', '/thumbnails/')
                    .replace(/\.(png|gif)$/i, '.jpg');
                  return (
                    <div className="aspect-video bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <picture>
                        <source srcSet={webpUrl} type="image/webp" />
                        <img
                          src={post.featured_image_url}
                          srcSet={`${thumbUrl} 400w, ${post.featured_image_url} 640w`}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          alt=""
                          role="presentation"
                          loading="lazy"
                          width={640}
                          height={360}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </picture>
                    </div>
                  );
                })()}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {post.reading_time_minutes} min
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  {post.subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mb-1">{post.subtitle}</p>
                  )}
                  <p className="text-sm text-slate-700 dark:text-slate-400 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{post.author_name}</span>
                    {post.published_at && (
                      <time dateTime={new Date(post.published_at).toISOString().split('T')[0]} className="text-xs text-slate-600 dark:text-slate-400">
                        {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </time>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-16">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(Math.max(1, page - 1)));
                setSearchParams(params);
              }}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(Math.min(totalPages, page + 1)));
                setSearchParams(params);
              }}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-30 font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Author */}
        <div className="mt-16">
          <AuthorBio />
        </div>
      </div>
    </PublicLayout>
  );
}
