/**
 * Public Blog Post Detail Page
 *
 * Full article view with SEO meta tags, structured data, and BlockDisplay renderer.
 * Uses shared PublicLayout for consistent navigation.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '../../components/layout/PublicLayout';
import { blogApi } from '../../services/api';
import type { BlogPostDetail, BlogPostSummary } from '../../services/api';
import BlockDisplay from '../../components/cms/BlockDisplay';
import { Clock, ArrowLeft, Tag, Calendar } from 'lucide-react';

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

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostSummary[]>([]);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (postSlug: string) => {
    setLoading(true);
    try {
      const { data } = await blogApi.getPost(postSlug);
      setPost(data.post);
      // Fetch related posts asynchronously (non-blocking)
      blogApi.getRelatedPosts(postSlug).then(({ data: relData }) => {
        setRelatedPosts(relData.posts);
      }).catch(() => {});
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number } };
        if (axiosErr.response?.status === 404) {
          setNotFound(true);
        }
      }
      console.error('Failed to load post:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div aria-live="polite" className="sr-only">Loading article...</div>
        <div className="max-w-3xl mx-auto px-6 lg:px-20 py-16">
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-4" />
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-2/3 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound || !post) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="font-display text-3xl text-slate-900 dark:text-white mb-3">Post not found</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link to="/blog" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
              &larr; Back to blog
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const canonicalUrl = `https://kritano.com/blog/${post.slug}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.excerpt,
    image: post.featured_image_url || undefined,
    author: { '@type': 'Person', name: post.author_name },
    publisher: { '@type': 'Organization', name: 'Kritano' },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>{post.seo_title || post.title} | Kritano</title>
        <meta name="description" content={post.seo_description || post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featured_image_url && <meta property="og:image" content={post.featured_image_url} />}
        <meta property="og:type" content="article" />
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto px-6 lg:px-20 py-12 lg:py-20">
        {/* Breadcrumb */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to blog
        </Link>

        {/* Post header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <Link
              to={`/blog?category=${post.category}`}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors uppercase tracking-wider"
            >
              {CATEGORY_LABELS[post.category] || post.category}
            </Link>
            <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {post.reading_time_minutes} min read
            </span>
          </div>

          <h1 className="font-display text-4xl lg:text-5xl text-slate-900 dark:text-white leading-tight mb-4">
            {post.title}
          </h1>

          {post.subtitle && (
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">{post.subtitle}</p>
          )}

          <div className="mt-6 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-300">{post.author_name}</span>
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })}
              </span>
            )}
          </div>
        </header>

        {/* Featured image */}
        {post.featured_image_url && (
          <figure className="mb-10 -mx-4 sm:mx-0">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || ''}
              className="w-full rounded-xl"
              loading="eager"
            />
          </figure>
        )}

        {/* Content blocks */}
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
          prose-p:text-slate-600 dark:prose-p:text-slate-400 prose-p:leading-relaxed
          prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-lg prose-pre:bg-slate-900
        ">
          {post.content.map(block => (
            <BlockDisplay key={block.id} block={block} />
          ))}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  to={`/blog?tag=${tag}`}
                  className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h2 className="font-display text-2xl text-slate-900 dark:text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map(related => (
                <Link
                  key={related.id}
                  to={`/blog/${related.slug}`}
                  className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {related.featured_image_url && (
                    <img
                      src={related.featured_image_url}
                      alt={related.title}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-4">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {CATEGORY_LABELS[related.category] || related.category}
                    </span>
                    <h3 className="mt-1.5 font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {related.excerpt}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {related.reading_time_minutes} min read
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-8 md:p-10 text-center">
          <h3 className="font-display text-2xl text-slate-900 dark:text-white mb-3">
            Ready to audit your website?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-lg mx-auto">
            Kritano scans your site for SEO, accessibility, security, and performance issues.
          </p>
          <Link
            to="/register"
            className="inline-flex px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start Free Audit
          </Link>
        </div>
      </article>
    </PublicLayout>
  );
}
