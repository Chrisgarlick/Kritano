/**
 * Terms of Service Page
 */

import { Link } from 'react-router-dom';
import { PublicLayout } from '../../components/layout/PublicLayout';
import PageSeo from '../../components/seo/PageSeo';

export default function Terms() {
  return (
    <PublicLayout>
      <PageSeo
        title="Terms of Service | PagePulser"
        description="PagePulser terms of service covering website scanning liability, acceptable use, subscriptions, and data ownership."
        path="/terms"
      />

      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-6">
            Legal
          </p>
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500">
            Effective date: 8 March 2026
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
        <div className="max-w-3xl prose prose-slate prose-lg prose-headings:font-display prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900">

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using PagePulser ("the Service"), you agree to be bound by these Terms of Service.
            If you do not agree to these terms, you must not use the Service. Continued use of the Service
            following any changes to these terms constitutes acceptance of those changes.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            PagePulser is a web auditing platform that analyses websites for search engine optimisation (SEO),
            accessibility compliance (WCAG 2.2), security vulnerabilities, and performance issues. The Service
            generates reports with prioritised findings, severity ratings, and actionable remediation guidance.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use the Service you must create an account with accurate, complete, and current information.
            You are responsible for maintaining the confidentiality of your password and for all activities
            that occur under your account. You must notify us immediately of any unauthorised use of your
            account.
          </p>

          <h2>4. Website Scanning &amp; Liability</h2>
          <p>
            This section is critical. Please read it carefully.
          </p>
          <ul>
            <li>
              <strong>Authorisation required.</strong> You must have proper authorisation to scan any domain
              you do not own. Scanning websites without authorisation may violate the Computer Misuse Act 1990
              (UK) or equivalent laws in your jurisdiction.
            </li>
            <li>
              <strong>Unverified domain restrictions.</strong> Domains that have not been verified through our
              domain verification process are limited to a maximum of 3 pages per audit and are scanned at a
              reduced crawl speed to minimise impact on the target server.
            </li>
            <li>
              <strong>User responsibility.</strong> You accept full responsibility for the consequences of
              scanning any website through PagePulser. This includes, but is not limited to, any impact on
              server performance, availability, or functionality of the scanned website.
            </li>
            <li>
              <strong>No liability.</strong> PagePulser is not liable for any damages, downtime, data loss,
              or other issues that may arise from your use of the scanning functionality. The Service is
              provided on an "as-is" basis for informational purposes only.
            </li>
            <li>
              <strong>Consent confirmation.</strong> Before scanning any unverified domain, you will be
              required to confirm that you have authorisation to scan the target website. Providing false
              confirmation is a violation of these terms.
            </li>
          </ul>

          <h2>5. Domain Verification</h2>
          <p>
            We strongly recommend verifying ownership of your domains. Verified domains benefit from higher
            page limits, faster crawl speeds, scheduled audits, and full access to historical analytics.
            Verification can be completed via DNS TXT record, HTML meta tag, or file upload.
          </p>

          <h2>6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service to intentionally disrupt, overwhelm, or degrade the performance of any website or server.</li>
            <li>Scan websites for malicious purposes, including but not limited to identifying vulnerabilities for exploitation.</li>
            <li>Use the Service in any way that violates applicable laws or regulations.</li>
            <li>Attempt to circumvent rate limits, page limits, or other restrictions imposed by your subscription tier.</li>
            <li>Resell, redistribute, or sublicense access to the Service without written permission.</li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            The PagePulser platform, including its software, design, documentation, and branding, is owned by
            PagePulser and protected by intellectual property laws. You retain ownership of your audit data and
            reports. By using the Service, you grant us a limited licence to process your data solely for the
            purpose of delivering the Service.
          </p>

          <h2>8. Subscriptions &amp; Billing</h2>
          <p>
            PagePulser offers multiple subscription tiers, including a free tier. Paid subscriptions are billed
            monthly or annually in advance. You may cancel your subscription at any time; cancellation takes
            effect at the end of the current billing period. We reserve the right to change pricing with 30
            days' notice. Free trial periods, where offered, convert to paid subscriptions unless cancelled
            before the trial ends.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, PagePulser's total liability for any claims arising from
            or relating to the Service shall not exceed the amount you paid for the Service in the 12 months
            preceding the claim. We shall not be liable for any indirect, incidental, special, consequential,
            or punitive damages, including loss of profits, data, or business opportunities.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your account at any time if you violate these terms, engage in
            fraudulent or illegal activity, or use the Service in a manner that could harm other users or
            the platform. Upon termination, your right to use the Service ceases immediately. You may
            request export of your data within 30 days of termination.
          </p>

          <h2>11. Changes to Terms</h2>
          <p>
            We may update these Terms of Service from time to time. All versions are dated and archived.
            Material changes will be communicated via email or in-app notification. Continued use of the
            Service after changes take effect constitutes acceptance. If you do not agree to updated terms,
            you must stop using the Service.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of England and Wales.
            Any disputes arising from these terms or the Service shall be subject to the exclusive
            jurisdiction of the courts of England and Wales.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, please{' '}
            <Link to="/contact">contact us</Link>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
