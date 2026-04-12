/**
 * Contact Page
 *
 * Redesigned with:
 * - Warmer, more personal tone
 * - Response time guarantee badge
 * - Better visual hierarchy between form and sidebar
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';
import { Mail, MapPin, Clock, Send, CheckCircle, Loader2, ArrowRight, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <PageSeo
        title="Contact"
        description="Get in touch with the Kritano team. We're here to help with questions about our platform, pricing, or partnerships."
        path="/contact"
        structuredData={[
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Kritano',
            url: 'https://kritano.com/contact',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://kritano.com' },
              { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://kritano.com/contact' },
            ],
          },
        ]}
      />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            Contact Us
          </h1>
          <h2 className="font-display text-2xl lg:text-3xl text-slate-500 leading-snug mb-8">
            Let's talk.
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            Whether it's a question about features, enterprise pricing, or a partnership idea -
            we read every message personally and reply within one business day.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-24">
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div role="status" className="bg-emerald-50 border border-emerald-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                  Message sent
                </h3>
                <p className="text-slate-600 mb-6">
                  Thanks for reaching out. We'll get back to you within one business day.
                </p>
                <Link to="/" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1">
                  Back to home <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        aria-required="true"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white
                                 text-slate-900 placeholder-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                                 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        aria-required="true"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white
                                 text-slate-900 placeholder-slate-400
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                                 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 mb-2">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white
                               text-slate-900
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                               transition-colors"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Enquiry</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnerships</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      rows={6}
                      required
                      aria-required="true"
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white
                               text-slate-900 placeholder-slate-400 resize-none
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                               transition-colors"
                    />
                  </div>

                  {error && (
                    <p role="alert" className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Response guarantee */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="font-semibold text-slate-900 text-sm">We reply within 24 hours</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every message is read personally. No ticket queues, no chatbots - just a real response from the team.
              </p>
            </div>

            {/* Contact info */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Email</p>
                  <a href="mailto:info@kritano.com" className="text-sm text-indigo-600 hover:text-indigo-700">
                    info@kritano.com
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Location</p>
                  <p className="text-sm text-slate-500">United Kingdom</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Hours</p>
                  <p className="text-sm text-slate-500">Mon-Fri, 9am-6pm GMT</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Quick Links</h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/pricing" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    View Pricing <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    Read the Blog <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    Start Free Audit <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
