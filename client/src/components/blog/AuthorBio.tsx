/**
 * AuthorBio - Reusable author bio component for E-E-A-T signals.
 *
 * Shows author photo, name, credentials, bio, and social links.
 * Includes itemprop="author" markup for structured data.
 */

import { Link } from 'react-router-dom';
import { Linkedin } from 'lucide-react';

const AUTHOR = {
  name: 'Chris Garlick',
  title: 'Founder of Kritano',
  photo: '/brand/author-chris-garlick.png',
  url: '/author/chris-garlick',
  linkedin: 'https://www.linkedin.com/in/chris-garlick-59a8bb91/',
  x: 'https://x.com/ChrisGarlick123',
  bio: 'Chris built Kritano after years of running audits with fragmented tools. He writes about SEO, accessibility, security, and performance based on real auditing data from thousands of scans.',
  credentials: 'Software engineer specialising in web auditing and WCAG 2.2 compliance.',
};

export default function AuthorBio() {
  return (
    <div
      className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 bg-slate-50 dark:bg-slate-800/50"
      itemProp="author"
      itemScope
      itemType="https://schema.org/Person"
    >
      <div className="flex items-start gap-5">
        <Link to={AUTHOR.url} className="flex-shrink-0">
          <img
            src={AUTHOR.photo}
            alt={AUTHOR.name}
            itemProp="image"
            width={72}
            height={72}
            className="w-[72px] h-[72px] rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <Link
              to={AUTHOR.url}
              className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
              itemProp="name"
            >
              {AUTHOR.name}
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={AUTHOR.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-[#0A66C2] transition-colors"
                aria-label="LinkedIn profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={AUTHOR.x}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="X profile"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2" itemProp="jobTitle">
            {AUTHOR.title}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed" itemProp="description">
            {AUTHOR.bio}
          </p>
          <meta itemProp="url" content={`https://kritano.com${AUTHOR.url}`} />
          <meta itemProp="sameAs" content={AUTHOR.linkedin} />
          <meta itemProp="sameAs" content={AUTHOR.x} />
        </div>
      </div>
    </div>
  );
}
