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
          <p className="text-sm text-slate-400">
            Effective date: 8 March 2026
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="border-t border-slate-200" />
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-16">
        <div className="max-w-3xl prose prose-slate prose-headings:font-display prose-headings:text-slate-900 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">

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
            to a paid plan, our payment processor collects billing information on our behalf.
          </p>
          <h3>Scan Results</h3>
          <p>
            When you run an audit, we collect and store the URLs scanned, audit findings (SEO, accessibility,
            security, performance), page screenshots, and metadata such as response times and HTTP headers.
          </p>
          <h3>Usage Data</h3>
          <p>
            We automatically collect information about how you interact with the Service, including pages
            visited, features used, browser type, device information, and IP address.
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
            <li><strong>Service improvement:</strong> To understand usage patterns and improve features.</li>
            <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorised access.</li>
            <li><strong>Communication:</strong> To send transactional emails (audit completions, account updates) and, with your consent, marketing communications.</li>
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

          <h2>6. Data Sharing</h2>
          <p>
            We do not sell your personal data to third parties. We share data only with:
          </p>
          <ul>
            <li><strong>Infrastructure providers:</strong> Cloud hosting, database, and email delivery services that process data on our behalf under strict data processing agreements.</li>
            <li><strong>Analytics providers:</strong> Only when you have consented to analytics cookies.</li>
            <li><strong>Legal requirements:</strong> When required by law, regulation, or legal process.</li>
          </ul>

          <h2>7. Consent Logging</h2>
          <p>
            In compliance with GDPR and UK-GDPR, we maintain an audit trail of all consent actions. Each
            consent record includes the consent version, action taken (accepted, rejected, or customised),
            categories consented to, your IP address, user agent, and timestamp. These records are retained
            for the duration required by applicable regulations.
          </p>

          <h2>8. Your Rights (GDPR / UK-GDPR)</h2>
          <p>Under data protection law, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate personal data.</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
            <li><strong>Portability:</strong> Request your data in a structured, machine-readable format.</li>
            <li><strong>Object:</strong> Object to processing of your personal data for certain purposes.</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
          </ul>
          <p>
            To exercise any of these rights, please <Link to="/contact">contact us</Link>. We will respond
            within 30 days.
          </p>

          <h2>9. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. After account deletion, we
            retain anonymised usage data for analytical purposes. Audit data retention follows the tier-based
            schedule outlined in Section 5. Consent logs are retained for the duration required by applicable
            regulations (typically 3 years).
          </p>

          <h2>10. Security Measures</h2>
          <p>We protect your data with the following measures:</p>
          <ul>
            <li>Authentication tokens stored in HttpOnly, Secure cookies with SameSite=Strict.</li>
            <li>All data transmitted over HTTPS with TLS 1.2 or higher.</li>
            <li>Passwords hashed using bcrypt with appropriate cost factors.</li>
            <li>CSRF protection on all state-changing requests.</li>
            <li>Regular security audits and dependency updates.</li>
            <li>Data encrypted at rest in our databases.</li>
          </ul>

          <h2>11. Children</h2>
          <p>
            PagePulser is not intended for use by anyone under the age of 16. We do not knowingly collect
            personal data from children. If you believe a child under 16 has provided us with personal data,
            please <Link to="/contact">contact us</Link> and we will delete it promptly.
          </p>

          <h2>12. Policy Changes</h2>
          <p>
            We may update this Privacy Policy from time to time. All versions are dated. Material changes
            will be communicated via email or in-app notification at least 14 days before they take effect.
            Continued use of the Service after changes take effect constitutes acceptance.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your data protection rights,
            please <Link to="/contact">contact us</Link>.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
