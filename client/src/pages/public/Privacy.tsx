/**
 * Privacy Policy Page
 */

import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PublicLayout } from '../../components/layout/PublicLayout';

export default function Privacy() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Privacy Policy | PagePulser</title>
        <meta name="description" content="PagePulser privacy policy covering data collection, cookies, GDPR rights, and how we protect your information." />
      </Helmet>

      <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 lg:pt-28 pb-16">
        <div className="max-w-3xl">
          <p className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-6">
            Legal
          </p>
          <h1 className="font-display text-5xl lg:text-6xl text-slate-900 leading-[1.05] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500">
            Effective date: 14 March 2026
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
        <div className="max-w-3xl prose prose-slate prose-lg prose-headings:font-display prose-headings:text-slate-900 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-8 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-table:text-sm prose-th:bg-slate-50 prose-th:text-slate-700 prose-th:font-semibold prose-td:text-slate-600">

          <h2>1. Introduction</h2>
          <p>
            PagePulser ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, store, and share your personal data when you use our website
            auditing platform. This policy applies to all users of our website and services.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>Account Data</h3>
          <p>
            When you register, we collect your name, email address, and organisation name. If you subscribe
            to a paid plan, our payment processor (Stripe) collects billing information on our behalf &mdash;
            we do not store credit card numbers or bank details.
          </p>

          <h3>Scan Results</h3>
          <p>
            When you run an audit, we collect and store the URLs scanned, audit findings (SEO, accessibility,
            security, performance, content quality, structured data), and metadata such as response times,
            HTTP headers, and page sizes. All scan data is collected from publicly accessible web pages only.
          </p>

          <h3>Usage Data</h3>
          <p>
            We automatically collect information about how you interact with the Service, including pages
            visited, features used, browser type, device information, and IP address. We also generate device
            fingerprints from your browser and device characteristics to detect unauthorised access to your
            account. These fingerprints are not used for cross-site tracking.
          </p>

          <h3>API Usage Data</h3>
          <p>
            If you use our API, we log request metadata including endpoints accessed, IP addresses, response
            times, and request counts for security monitoring and usage tracking.
          </p>

          <h3>Referral Data</h3>
          <p>
            If you participate in our referral programme, we collect referral codes and IP addresses to prevent
            fraud and track reward eligibility.
          </p>

          <h2>3. Cookies &amp; Tracking Technologies</h2>
          <p>We use the following cookies and local storage items:</p>

          <h3>Cookies</h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Category</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>access_token</code></td>
                  <td>Necessary</td>
                  <td>JWT authentication token</td>
                  <td>4 hours</td>
                </tr>
                <tr>
                  <td><code>refresh_token</code></td>
                  <td>Necessary</td>
                  <td>Session persistence</td>
                  <td>7 days</td>
                </tr>
                <tr>
                  <td><code>csrf_token</code></td>
                  <td>Necessary</td>
                  <td>CSRF protection</td>
                  <td>24 hours</td>
                </tr>
                <tr>
                  <td><code>_ga</code>, <code>_gid</code>, <code>_gat</code></td>
                  <td>Analytics (consent required)</td>
                  <td>Google Analytics &mdash; usage statistics</td>
                  <td>Up to 2 years</td>
                </tr>
                <tr>
                  <td><code>_fbp</code>, <code>_gcl_au</code></td>
                  <td>Marketing (consent required)</td>
                  <td>Advertising attribution</td>
                  <td>Up to 90 days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Local Storage</h3>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>pagepulser-theme</code></td>
                  <td>Stores your light/dark mode preference</td>
                </tr>
                <tr>
                  <td><code>sidebar-collapsed</code></td>
                  <td>Remembers sidebar state in the dashboard</td>
                </tr>
                <tr>
                  <td><code>pp-cookie-consent</code></td>
                  <td>Records your cookie consent preferences</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            You can manage your cookie preferences at any time using the "Cookie Settings" link in the
            footer or the cookie banner shown on your first visit. Necessary cookies cannot be disabled
            as they are required for the Service to function.
          </p>

          <h2>4. How We Use Your Data</h2>
          <ul>
            <li><strong>Service delivery:</strong> To run audits, generate reports, and provide your dashboard experience.</li>
            <li><strong>Service improvement:</strong> To understand usage patterns and improve features. We analyse your usage
              patterns (such as login frequency, audits run, and features used) to understand engagement and improve our
              service. This analysis may influence the communications we send you.</li>
            <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorised access.</li>
            <li><strong>Communication:</strong> To send transactional emails (audit completions, account updates) and, with
              your consent, marketing communications. We track email delivery, opens, and clicks to measure the effectiveness
              of our communications. You can opt out of non-essential emails via your email preferences or the unsubscribe
              link included in every email.</li>
          </ul>

          <h2>5. Scan Data</h2>
          <p>
            During website audits, we collect publicly available information from the target website,
            including HTML content, HTTP headers, response times, resource sizes, and accessibility
            attributes. We do not collect data behind authentication walls or submit forms on target
            websites. Scan data retention varies by subscription tier:
          </p>
          <ul>
            <li><strong>Free:</strong> 30 days</li>
            <li><strong>Starter:</strong> 90 days</li>
            <li><strong>Professional:</strong> 1 year</li>
            <li><strong>Enterprise:</strong> Unlimited</li>
          </ul>

          <h2>6. Data Sharing &amp; Sub-processors</h2>
          <p>
            We do not sell your personal data to third parties. We share data only with:
          </p>
          <ul>
            <li><strong>Stripe</strong> (payment processing, USA): Processes subscription payments and billing. Subject to{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&apos;s Privacy Policy</a>.</li>
            <li><strong>Resend</strong> (email delivery, USA): Delivers transactional and marketing emails on our behalf.</li>
            <li><strong>Sentry</strong> (error monitoring, USA): Receives sanitised error reports to help us fix bugs.
              Sensitive data such as cookies is filtered before transmission.</li>
            <li><strong>Analytics providers:</strong> Only when you have consented to analytics cookies.</li>
            <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process.</li>
          </ul>

          <h2>7. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries outside the UK/EEA, including the
            United States, where our sub-processors operate. We ensure appropriate safeguards are in place
            for any such transfers, including Standard Contractual Clauses (SCCs) where required.
          </p>

          <h2>8. Consent Logging</h2>
          <p>
            In compliance with GDPR and UK-GDPR, we maintain an audit trail of all consent actions. Each
            consent record includes the consent version, action taken (accepted, rejected, or customised),
            categories consented to, your IP address, user agent, and timestamp. These records are retained
            for the duration required by applicable regulations.
          </p>

          <h2>9. Publicly Available Business Data</h2>
          <p>
            We collect publicly available business contact information (such as generic email addresses
            like info@ and hello@) from newly registered domain listings. This data is used solely for
            one-time B2B outreach to inform website owners about our auditing services. We do not collect
            personal or named email addresses for this purpose. Each domain is contacted a maximum of once,
            and data is automatically deleted after 6 months if there is no engagement. Recipients can
            unsubscribe instantly via the link included in every outreach email.
          </p>

          <h2>10. Your Rights (GDPR / UK-GDPR)</h2>
          <p>Under data protection law, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you. You can download a complete export of your data at any time from your <Link to="/settings/profile">account settings</Link>.</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate personal data.</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten"). You can delete your account from your <Link to="/settings/profile">account settings</Link>. Deletion includes a 30-day grace period during which you can cancel.</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format. Our self-service data export provides your data in JSON format within a ZIP archive.</li>
            <li><strong>Object:</strong> Object to processing of your personal data for certain purposes.</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p>
            Most of these rights can be exercised directly through your <Link to="/settings/profile">account settings</Link>.
            For any other requests, please <Link to="/contact">contact us</Link>. We will respond within 30 days.
          </p>

          <h2>11. Automated Decision-Making</h2>
          <p>
            We do not make decisions based solely on automated processing that produce legal effects or
            similarly significantly affect you. We use automated lead scoring to personalise communications,
            but this does not restrict your access to any features or services.
          </p>

          <h2>12. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. You can request deletion of your
            account at any time from your <Link to="/settings/profile">account settings</Link>. After you request
            deletion, there is a 30-day grace period during which you can cancel. After this period, your account
            and all associated data are permanently deleted. Specific retention periods:
          </p>
          <ul>
            <li><strong>Audit data:</strong> Tier-based schedule as outlined in Section 5.</li>
            <li><strong>Authentication logs:</strong> 1 year.</li>
            <li><strong>API request logs:</strong> 90 days.</li>
            <li><strong>Email send logs:</strong> 1 year.</li>
            <li><strong>Consent records:</strong> Archived in anonymised form and retained for the duration required by applicable regulations (typically 3 years), even after account deletion, for legal compliance.</li>
            <li><strong>Cold outreach data:</strong> 6 months if no engagement, then automatically deleted.</li>
            <li><strong>Data exports:</strong> Available for download for 24 hours after generation, then automatically deleted.</li>
          </ul>

          <h2>13. Security Measures</h2>
          <p>We protect your data with the following measures:</p>
          <ul>
            <li>Authentication tokens stored in HttpOnly, Secure cookies with SameSite=Strict.</li>
            <li>All data transmitted over HTTPS with TLS 1.2 or higher.</li>
            <li>Passwords hashed using industry-standard algorithms.</li>
            <li>CSRF protection on all state-changing requests.</li>
            <li>Regular security audits and dependency updates.</li>
            <li>Data encrypted at rest in our databases.</li>
          </ul>

          <h2>14. Children</h2>
          <p>
            PagePulser is not intended for use by anyone under the age of 16. We do not knowingly collect
            personal data from children. If you believe a child under 16 has provided us with personal data,
            please <Link to="/contact">contact us</Link> and we will delete it promptly.
          </p>

          <h2>15. Policy Changes</h2>
          <p>
            We may update this Privacy Policy from time to time. All versions are dated. Material changes
            will be communicated via email or in-app notification at least 14 days before they take effect.
            Continued use of the Service after changes take effect constitutes acceptance.
          </p>

          <h2>16. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data protection rights,
            please <Link to="/contact">contact us</Link>.
          </p>
          <p>
            If you are unhappy with how we have handled your data, you have the right to lodge a complaint
            with the Information Commissioner&apos;s Office (ICO) at{' '}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
