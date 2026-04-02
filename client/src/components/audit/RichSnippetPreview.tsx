import { Star, ChevronDown, ChevronUp, MapPin, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';

interface OgData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

interface JsonLdItem {
  '@type'?: string;
  name?: string;
  headline?: string;
  description?: string;
  image?: string | { url?: string };
  author?: string | { name?: string; '@type'?: string };
  publisher?: string | { name?: string };
  price?: string;
  priceCurrency?: string;
  availability?: string;
  ratingValue?: string | number;
  reviewCount?: string | number;
  datePublished?: string;
  startDate?: string;
  endDate?: string;
  location?: string | { name?: string; address?: any };
  address?: string | { streetAddress?: string; addressLocality?: string };
  telephone?: string;
  priceRange?: string;
  mainEntity?: any[];
  aggregateRating?: { ratingValue?: number; reviewCount?: number; bestRating?: number };
  offers?: { price?: string; priceCurrency?: string; availability?: string };
  brand?: string | { name?: string };
}

interface RichSnippetPreviewProps {
  url: string;
  title: string | null;
  metaDescription: string | null;
  detectedTypes: string[];
  detectedPageType: string | null;
  hasOg: boolean;
  hasBreadcrumb: boolean;
  ogData: OgData | null;
  jsonLdItems: JsonLdItem[] | null;
}

// Helper to extract a string name from various schema formats
function extractName(val: string | { name?: string } | undefined): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.name) return val.name;
  return null;
}



function extractAddress(val: string | { streetAddress?: string; addressLocality?: string } | undefined): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const parts = [val.streetAddress, val.addressLocality].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  return null;
}

function extractLocation(val: string | { name?: string; address?: any } | undefined): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (val.name) return val.name;
    if (val.address) return extractAddress(val.address);
  }
  return null;
}

function formatAvailability(val: string | undefined): string | null {
  if (!val) return null;
  const lower = val.toLowerCase();
  if (lower.includes('instock')) return 'In stock';
  if (lower.includes('outofstock')) return 'Out of stock';
  if (lower.includes('preorder')) return 'Pre-order';
  if (lower.includes('limited')) return 'Limited availability';
  return val.replace('https://schema.org/', '').replace('http://schema.org/', '');
}

function formatPrice(price: string | undefined, currency: string | undefined): string | null {
  if (!price) return null;
  const curr = currency || 'USD';
  try {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: curr }).format(num);
  } catch {
    return `${curr} ${price}`;
  }
}

function formatDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatEventDate(dateStr: string | undefined): { date: string; time: string | null } | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: dateStr, time: null };
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  } catch {
    return { date: dateStr, time: null };
  }
}

// --- Sub-components ---

function BreadcrumbPreview({ url }: { url: string }) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const host = parsed.hostname.replace('www.', '');
    return (
      <div className="flex items-center gap-1 text-sm text-slate-500">
        <span className="text-emerald-700">{host}</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-slate-500">&rsaquo;</span>
            <span className="text-emerald-700">{decodeURIComponent(seg).replace(/-/g, ' ')}</span>
          </span>
        ))}
      </div>
    );
  } catch {
    return null;
  }
}

function StarRating({ rating, count, bestRating = 5 }: { rating: number; count?: number; bestRating?: number }) {
  const normalized = bestRating > 0 ? (rating / bestRating) * 5 : rating;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className="w-3.5 h-3.5"
            fill={i <= Math.floor(normalized) ? '#f59e0b' : 'none'}
            stroke={i <= Math.ceil(normalized) ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">
        Rating: {rating}/{bestRating}
        {count != null && ` - ${Number(count).toLocaleString()} review${Number(count) !== 1 ? 's' : ''}`}
      </span>
    </div>
  );
}

function FAQPreview({ questions }: { questions: Array<{ q: string; a: string }> }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const display = questions.slice(0, 3);

  return (
    <div className="mt-2 border-t border-slate-200 pt-2">
      <div className="text-xs font-medium text-slate-600 mb-1.5">People also ask</div>
      {display.map((faq, i) => (
        <div key={i} className="border-b border-slate-100 last:border-0">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex items-center justify-between w-full py-1.5 text-left text-sm text-slate-800 hover:text-indigo-600 transition-colors"
          >
            <span className="line-clamp-1">{faq.q}</span>
            {expanded === i ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-2" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-2" />
            )}
          </button>
          {expanded === i && (
            <p className="text-xs text-slate-500 pb-2 pl-0.5 line-clamp-3">{faq.a}</p>
          )}
        </div>
      ))}
      {questions.length > 3 && (
        <div className="text-xs text-slate-500 pt-1">+{questions.length - 3} more questions</div>
      )}
    </div>
  );
}

function ProductSnippet({
  rating,
  reviewCount,
  bestRating,
  price,
  currency,
  availability,
}: {
  rating?: number;
  reviewCount?: number;
  bestRating?: number;
  price?: string;
  currency?: string;
  availability?: string;
}) {
  const formattedPrice = formatPrice(price, currency);
  const formattedAvail = formatAvailability(availability);

  return (
    <div className="flex items-center gap-3 mt-1 flex-wrap">
      {rating != null && <StarRating rating={rating} count={reviewCount} bestRating={bestRating || 5} />}
      {formattedPrice && <span className="text-sm text-slate-700 font-medium">{formattedPrice}</span>}
      {formattedAvail && (
        <span className={`text-xs font-medium ${
          formattedAvail === 'In stock' ? 'text-emerald-600' :
          formattedAvail === 'Out of stock' ? 'text-red-500' :
          'text-amber-600'
        }`}>
          {formattedAvail}
        </span>
      )}
    </div>
  );
}

function EventSnippet({ date, time, location }: { date: string; time: string | null; location: string | null }) {
  return (
    <div className="mt-1.5 flex items-center gap-4 text-xs text-slate-600 flex-wrap">
      <span className="inline-flex items-center gap-1">
        <Calendar className="w-3 h-3 text-indigo-500" />
        {date}
      </span>
      {time && (
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-indigo-500" />
          {time}
        </span>
      )}
      {location && (
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 text-indigo-500" />
          {location}
        </span>
      )}
    </div>
  );
}

function LocalBusinessSnippet({
  rating,
  reviewCount,
  bestRating,
  address,
  telephone,
}: {
  rating?: number;
  reviewCount?: number;
  bestRating?: number;
  address: string | null;
  telephone?: string;
}) {
  return (
    <div className="mt-1.5 space-y-1">
      {rating != null && <StarRating rating={rating} count={reviewCount} bestRating={bestRating || 5} />}
      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
        {address && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            {address}
          </span>
        )}
        {telephone && <span>{telephone}</span>}
      </div>
    </div>
  );
}

function ArticleSnippet({ date, author }: { date: string | null; author: string | null }) {
  if (!date && !author) return null;
  return (
    <div className="mt-1 text-xs text-slate-500">
      {date && <span>{date}</span>}
      {date && author && <span className="mx-1.5">-</span>}
      {author && <span>By {author}</span>}
    </div>
  );
}

// --- Main Component ---

export function RichSnippetPreview({
  url,
  title,
  metaDescription,
  detectedTypes,
  hasBreadcrumb,
  ogData,
  jsonLdItems,
}: RichSnippetPreviewProps) {
  const types = new Set(detectedTypes.map(t => t.toLowerCase()));
  const items = jsonLdItems || [];

  // Find specific schema items
  const findItem = (...typeNames: string[]) =>
    items.find(i => typeNames.some(t => (i['@type'] || '').toLowerCase() === t.toLowerCase()));

  const productItem = findItem('Product');
  const articleItem = findItem('Article', 'NewsArticle', 'BlogPosting');
  const faqItem = findItem('FAQPage');
  const eventItem = findItem('Event');
  const localBizItem = findItem('LocalBusiness');
  const ratingItem = findItem('AggregateRating');
  const orgItem = findItem('Organization', 'WebSite');

  // Determine what schema types are present
  const hasProduct = types.has('product') || types.has('offer');
  const hasFAQ = types.has('faqpage');
  const hasArticle = types.has('article') || types.has('newsarticle') || types.has('blogposting');
  const hasLocalBusiness = types.has('localbusiness');
  const hasEvent = types.has('event');
  const hasReview = types.has('aggregaterating') || types.has('review');
  const hasBreadcrumbSchema = hasBreadcrumb || types.has('breadcrumblist');

  // Resolve display title: OG title > schema name/headline > page title
  const schemaTitle = productItem?.name || articleItem?.headline || articleItem?.name
    || eventItem?.name || localBizItem?.name || orgItem?.name;
  const displayTitle = ogData?.title || schemaTitle || title || 'Untitled Page';

  // Resolve display description: OG description > schema description > meta description
  const schemaDesc = productItem?.description || articleItem?.description
    || eventItem?.description || localBizItem?.description || orgItem?.description;
  const displayDescription = ogData?.description || schemaDesc || metaDescription;

  // Extract rating data from the appropriate item
  const getRating = () => {
    // Check product's aggregateRating first
    const aggr = productItem?.aggregateRating || localBizItem?.aggregateRating || ratingItem;
    if (aggr) {
      const rv = typeof aggr === 'object' && 'ratingValue' in aggr ? Number(aggr.ratingValue) : null;
      const rc = typeof aggr === 'object' && 'reviewCount' in aggr ? Number(aggr.reviewCount) : undefined;
      const br = typeof aggr === 'object' && 'bestRating' in aggr ? Number(aggr.bestRating) : 5;
      if (rv != null && !isNaN(rv)) return { rating: rv, count: rc, bestRating: br };
    }
    // Check direct ratingValue on product
    if (productItem?.ratingValue) {
      return { rating: Number(productItem.ratingValue), count: productItem.reviewCount ? Number(productItem.reviewCount) : undefined, bestRating: 5 };
    }
    return null;
  };

  // Extract product pricing
  const getProductPrice = () => {
    const offer = productItem?.offers;
    if (offer && typeof offer === 'object') {
      return { price: offer.price, currency: offer.priceCurrency, availability: offer.availability };
    }
    if (productItem?.price) {
      return { price: productItem.price, currency: productItem.priceCurrency, availability: productItem.availability };
    }
    return null;
  };

  // Extract FAQ questions
  const getFaqQuestions = (): Array<{ q: string; a: string }> => {
    if (!faqItem?.mainEntity || !Array.isArray(faqItem.mainEntity)) return [];
    return faqItem.mainEntity
      .filter((e: any) => e?.name && e?.acceptedAnswer)
      .map((e: any) => ({
        q: e.name,
        a: typeof e.acceptedAnswer === 'string' ? e.acceptedAnswer
          : e.acceptedAnswer?.text || e.acceptedAnswer?.name || '',
      }))
      .filter((f: { q: string; a: string }) => f.q);
  };

  // Extract event date/location
  const getEventData = () => {
    const parsed = formatEventDate(eventItem?.startDate);
    return {
      date: parsed?.date || 'Date TBD',
      time: parsed?.time || null,
      location: extractLocation(eventItem?.location),
    };
  };

  // Extract article author/date
  const getArticleData = () => ({
    author: extractName(articleItem?.author),
    date: formatDate(articleItem?.datePublished),
  });

  // Extract local business data
  const getLocalBizData = () => ({
    address: extractAddress(localBizItem?.address),
    telephone: localBizItem?.telephone,
  });

  const ratingData = getRating();
  const productPrice = getProductPrice();
  const faqQuestions = getFaqQuestions();
  const showStars = hasProduct || hasLocalBusiness || hasReview;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 max-w-xl">
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 mb-3">
        Google Search Preview
      </div>

      <div className="space-y-0.5">
        {/* Favicon + URL / Breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {(() => {
                try { return new URL(url).hostname.charAt(0).toUpperCase(); }
                catch { return 'P'; }
              })()}
            </span>
          </div>
          <div className="min-w-0">
            {hasBreadcrumbSchema ? (
              <BreadcrumbPreview url={url} />
            ) : (
              <div className="text-xs text-emerald-700 truncate">{url}</div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg text-[#1a0dab] hover:underline cursor-pointer leading-snug font-normal">
          {displayTitle}
        </h3>

        {/* Rich result enhancements from real data */}
        {hasProduct && (
          <ProductSnippet
            rating={ratingData?.rating}
            reviewCount={ratingData?.count}
            bestRating={ratingData?.bestRating}
            price={productPrice?.price}
            currency={productPrice?.currency}
            availability={productPrice?.availability}
          />
        )}
        {hasLocalBusiness && !hasProduct && (() => {
          const biz = getLocalBizData();
          return (
            <LocalBusinessSnippet
              rating={ratingData?.rating}
              reviewCount={ratingData?.count}
              bestRating={ratingData?.bestRating}
              address={biz.address}
              telephone={biz.telephone}
            />
          );
        })()}
        {hasEvent && (() => {
          const ev = getEventData();
          return <EventSnippet date={ev.date} time={ev.time} location={ev.location} />;
        })()}
        {hasArticle && (() => {
          const art = getArticleData();
          return <ArticleSnippet date={art.date} author={art.author} />;
        })()}
        {showStars && !hasProduct && !hasLocalBusiness && ratingData && (
          <StarRating rating={ratingData.rating} count={ratingData.count} bestRating={ratingData.bestRating} />
        )}

        {/* Description */}
        {displayDescription ? (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
            {displayDescription}
          </p>
        ) : (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 italic">
            No meta description available. Google will auto-generate a snippet from page content.
          </p>
        )}

        {/* FAQ section with real questions */}
        {hasFAQ && faqQuestions.length > 0 && <FAQPreview questions={faqQuestions} />}
        {hasFAQ && faqQuestions.length === 0 && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <div className="text-xs text-slate-500 italic">FAQPage schema detected but question data not available in preview</div>
          </div>
        )}
      </div>

      {/* OG Image preview */}
      {ogData?.image && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Social Share Image</div>
          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 max-w-[280px]">
            <img
              src={ogData.image}
              alt="OG preview"
              className="w-full h-[148px] object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {(ogData.title || ogData.description || ogData.siteName) && (
              <div className="p-2.5">
                {ogData.siteName && <div className="text-[10px] text-slate-500 uppercase">{ogData.siteName}</div>}
                {ogData.title && <div className="text-sm font-medium text-slate-800 line-clamp-1">{ogData.title}</div>}
                {ogData.description && <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ogData.description}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {detectedTypes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">
            Enabled by your schema
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hasBreadcrumbSchema && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Breadcrumbs
              </span>
            )}
            {showStars && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Star Ratings
              </span>
            )}
            {hasProduct && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Price & Availability
              </span>
            )}
            {hasFAQ && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                FAQ Dropdown
              </span>
            )}
            {hasArticle && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                Article Info
              </span>
            )}
            {hasEvent && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Event Details
              </span>
            )}
            {hasLocalBusiness && (
              <span className="inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Business Info
              </span>
            )}
          </div>
        </div>
      )}

      {/* No schema hint */}
      {detectedTypes.length === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 italic">
            No rich results available. Add structured data to unlock enhanced search appearances like star ratings, prices, FAQs, and more.
          </p>
        </div>
      )}
    </div>
  );
}
