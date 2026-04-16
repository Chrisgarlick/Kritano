/**
 * Author Page - /author/chris-garlick
 *
 * Dedicated author page for E-E-A-T. Shows bio, expertise, and blog posts.
 * Includes Person schema with sameAs links to social profiles.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { blogApi } from '../../services/api';
import type { BlogPostSummary } from '../../services/api';
import AuthorBio from '../../components/blog/AuthorBio';
import { Clock, ArrowRight } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  seo: 'SEO',
  accessibility: 'Accessibility',
  security: 'Security',
  performance: 'Performance',
  'content-quality': 'Content Quality',
  'structured-data': 'Structured Data',
  eeat: 'E-E-A-T',
  aeo: 'AEO',
  guides: 'Guides',
  'case-studies': 'Case Studies',
  'product-updates': 'Product Updates',
};

const EXPERTISE = [
  'Search Engine Optimisation (SEO)',
  'Web Accessibility & WCAG 2.2',
  'Web Security',
  'Web Performance & Core Web Vitals',
  'Content Quality & E-E-A-T',
  'Answer Engine Optimisation (AEO)',
  'Structured Data & Schema.org',
];

export default function AuthorPage() {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogApi
      .listPosts({ limit: 100 })
      .then(({ data }) => setPosts(data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <PageSeo
        title="Chris Garlick - Founder & Author"
        description="Chris Garlick is the founder of Kritano, a website intelligence platform. He writes about SEO, web accessibility, security, and performance."
        path="/author/chris-garlick"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Chris Garlick',
            jobTitle: 'Founder',
            url: 'https://kritano.com/author/chris-garlick',
            worksFor: {
              '@type': 'Organization',
              name: 'Kritano',
              url: 'https://kritano.com',
            },
            description:
              'Founder of Kritano. Software engineer specialising in web auditing, SEO, accessibility, and performance optimisation.',
            knowsAbout: [
              'SEO',
              'Web Accessibility',
              'WCAG 2.2',
              'Web Security',
              'Web Performance',
              'Content Quality',
              'Answer Engine Optimisation',
              'Structured Data',
            ],
            image: 'https://kritano.com/brand/author-chris-garlick.png',
            sameAs: [
              'https://uk.linkedin.com/in/chris-garlick-59a8bb91',
              'https://x.com/ChrisGarlick123',
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Chris Garlick',
                item: 'https://kritano.com/author/chris-garlick',
              },
            ],
          },
        ]}
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          {/* Author header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">CG</span>
            </div>
            <div>
              <h1 className="font-display text-4xl lg:text-5xl text-slate-900 leading-tight mb-2">
                Chris Garlick
              </h1>
              <p className="text-lg text-slate-600">
                Founder of{' '}
                <Link to="/" className="text-indigo-600 hover:text-indigo-700 transition-colors underline decoration-indigo-300 underline-offset-2 hover:decoration-indigo-600">
                  Kritano
                </Link>
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="prose prose-lg prose-slate max-w-none mb-12">
            <p className="text-slate-600 leading-relaxed">
              I built Kritano because I was tired of running accessibility audits with fragmented
              tools that generated massive reports full of false positives. I wanted a single
              platform that could analyse a website across every dimension that matters - SEO,
              accessibility, security, performance, content quality, and structured data - and
              present the results in a way that anyone could understand and act on.
            </p>
            <p className="text-slate-600 leading-relaxed">
              I write about the topics I know best: making websites faster, more accessible, more
              secure, and easier to find. Every article on the Kritano blog is informed by real
              auditing data from thousands of scans.
            </p>
          </div>

          {/* Structured author bio for E-E-A-T signals */}
          <div className="mb-12">
            <AuthorBio />
          </div>

          {/* Expertise */}
          <div className="mb-16">
            <h2 className="font-display text-2xl text-slate-900 mb-4">Areas of Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE.map((area) => (
                <span
                  key={area}
                  className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      {/* Articles */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
        <h2 className="font-display text-3xl text-slate-900 mb-10">Articles by Chris</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-slate-600">No articles published yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group"
              >
                {post.featured_image_url && (() => {
                  const webpUrl = post.featured_image_url
                    .replace('/original/', '/webp/')
                    .replace(/\.(png|jpe?g|gif)$/i, '.webp');
                  return (
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <picture>
                        <source srcSet={webpUrl} type="image/webp" />
                        <img
                          src={post.featured_image_url}
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
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {post.reading_time_minutes} min
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  {post.published_at && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <time
                        dateTime={new Date(post.published_at).toISOString().split('T')[0]}
                        className="text-xs text-slate-600"
                      >
                        {new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
          >
            View all articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
