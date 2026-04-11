import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { SettingsLayout } from './components/layout/SettingsLayout';
import { SiteModeProvider } from './contexts/SiteModeContext';
import { SiteModeGuard } from './components/SiteModeGuard';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { SeoProvider } from './hooks/useSeoOverrides';

// Eagerly loaded (critical path)
import Home from './pages/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import NotFoundPage from './pages/errors/NotFound';

// Lazy-loaded: Auth pages
const RegisterSuccessPage = lazy(() => import('./pages/auth/RegisterSuccess'));
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmail'));
const OAuthCallbackPage = lazy(() => import('./pages/auth/OAuthCallback'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const EarlyAccessSuccessPage = lazy(() => import('./pages/auth/EarlyAccessSuccess'));

// Lazy-loaded: Dashboard / App pages
const DashboardPage = lazy(() => import('./pages/dashboard/Dashboard'));
const AuditListPage = lazy(() => import('./pages/audits/AuditList'));
const NewAuditPage = lazy(() => import('./pages/audits/NewAudit'));
const AuditDetailPage = lazy(() => import('./pages/audits/AuditDetail'));
const PageDetailPage = lazy(() => import('./pages/audits/PageDetail'));
const AccessibilityStatementPage = lazy(() => import('./pages/audits/AccessibilityStatement'));
const ComplianceReportPage = lazy(() => import('./pages/audits/ComplianceReport'));
const SiteListPage = lazy(() => import('./pages/sites/SiteList'));
const SiteDetailPage = lazy(() => import('./pages/sites/SiteDetail'));
const ScheduleListPage = lazy(() => import('./pages/schedules/ScheduleListPage'));
const ScheduleDetailPage = lazy(() => import('./pages/schedules/ScheduleDetailPage'));
const ReferralDashboard = lazy(() => import('./pages/referrals/ReferralDashboard'));
const ComparePage = lazy(() => import('./pages/compare/ComparePage'));
const SearchConsolePage = lazy(() => import('./pages/keywords/SearchConsolePage'));
const GscCallbackPage = lazy(() => import('./pages/auth/GscCallback'));
const SiteInvitationPage = lazy(() => import('./pages/invitations/SiteInvitation'));
const UnsubscribePage = lazy(() => import('./pages/email/UnsubscribePage'));

// Lazy-loaded: Settings
const ProfilePage = lazy(() => import('./pages/settings/Profile'));
const ApiKeysPage = lazy(() => import('./pages/settings/ApiKeys'));
const SitesSettingsPage = lazy(() => import('./pages/settings/SitesSettings'));
const BrandingSettingsPage = lazy(() => import('./pages/settings/BrandingSettings'));
const NotificationSettingsPage = lazy(() => import('./pages/settings/NotificationSettings'));

// Lazy-loaded: Analytics
const AnalyticsDashboard = lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const SiteAnalytics = lazy(() => import('./pages/analytics/SiteAnalytics'));
const UrlAnalytics = lazy(() => import('./pages/analytics/UrlAnalytics'));
const AuditComparison = lazy(() => import('./pages/analytics/AuditComparison'));
const SiteComparison = lazy(() => import('./pages/analytics/SiteComparison'));

// Lazy-loaded: Public pages
const AboutPage = lazy(() => import('./pages/public/About'));
const ServicesPage = lazy(() => import('./pages/public/Services'));
const PricingPage = lazy(() => import('./pages/public/Pricing'));
const ContactPage = lazy(() => import('./pages/public/Contact'));
const WaitlistPage = lazy(() => import('./pages/public/Waitlist'));
const FaqPage = lazy(() => import('./pages/public/Faq'));
const TermsPage = lazy(() => import('./pages/public/Terms'));
const PrivacyPage = lazy(() => import('./pages/public/Privacy'));
const ServiceDetailPage = lazy(() => import('./pages/public/services/ServiceDetailPage'));
const ServerErrorPage = lazy(() => import('./pages/errors/ServerError'));
const SharedReportPage = lazy(() => import('./pages/public/SharedReport'));
const AuthorPage = lazy(() => import('./pages/public/AuthorPage'));

// Lazy-loaded: Blog
const BlogPostListPage = lazy(() => import('./pages/blog/PostListPage'));
const BlogPostDetailPage = lazy(() => import('./pages/blog/PostDetailPage'));

// Lazy-loaded: Docs
const DocsOverviewPage = lazy(() => import('./pages/docs/DocsOverviewPage'));
const DocsAuthPage = lazy(() => import('./pages/docs/DocsAuthPage'));
const DocsRateLimitsPage = lazy(() => import('./pages/docs/DocsRateLimitsPage'));
const DocsErrorsPage = lazy(() => import('./pages/docs/DocsErrorsPage'));
const DocsEndpointsPage = lazy(() => import('./pages/docs/DocsEndpointsPage'));
const DocsObjectsPage = lazy(() => import('./pages/docs/DocsObjectsPage'));

// Lazy-loaded: Admin pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrganizationsPage = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminActivityPage = lazy(() => import('./pages/admin/AdminActivity'));
const AdminBugReportsPage = lazy(() => import('./pages/admin/AdminBugReports'));
const AdminBugReportDetailPage = lazy(() => import('./pages/admin/AdminBugReportDetail'));
const AdminFeatureRequestsPage = lazy(() => import('./pages/admin/AdminFeatureRequests'));
const AdminFeatureRequestDetailPage = lazy(() => import('./pages/admin/AdminFeatureRequestDetail'));
const AdminSchedulesPage = lazy(() => import('./pages/admin/AdminSchedules'));
const AdminScheduleDetailPage = lazy(() => import('./pages/admin/AdminScheduleDetail'));
const AdminEarlyAccessPage = lazy(() => import('./pages/admin/AdminEarlyAccess'));
const AdminLeadsPage = lazy(() => import('./pages/admin/crm/LeadsPage'));
const AdminLeadDetailPage = lazy(() => import('./pages/admin/crm/LeadDetailPage'));
const AdminTriggersPage = lazy(() => import('./pages/admin/crm/TriggersPage'));
const AdminTemplatesPage = lazy(() => import('./pages/admin/email/TemplatesPage'));
const AdminTemplateEditorPage = lazy(() => import('./pages/admin/email/TemplateEditorPage'));
const AdminCampaignsPage = lazy(() => import('./pages/admin/email/CampaignsPage'));
const AdminCampaignEditorPage = lazy(() => import('./pages/admin/email/CampaignEditorPage'));
const AdminEmailAnalyticsPage = lazy(() => import('./pages/admin/email/EmailAnalyticsPage'));
const AdminPostsPage = lazy(() => import('./pages/admin/cms/PostsPage'));
const AdminPostEditorPage = lazy(() => import('./pages/admin/cms/PostEditorPage'));
const AdminMediaPage = lazy(() => import('./pages/admin/cms/MediaPage'));
const AdminAdvicePage = lazy(() => import('./pages/admin/cms/AdvicePage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/cms/AnnouncementsPage'));
const AdminStoriesPage = lazy(() => import('./pages/admin/cms/StoriesPage'));
const AdminMarketingContentListPage = lazy(() => import('./pages/admin/marketing/ContentListPage'));
const AdminMarketingContentEditorPage = lazy(() => import('./pages/admin/marketing/ContentEditorPage'));
const AdminMarketingCampaignsPage = lazy(() => import('./pages/admin/marketing/CampaignsPage'));
const ColdProspectsDashboard = lazy(() => import('./pages/admin/cold-prospects/ColdProspectsDashboard'));
const ColdProspectsList = lazy(() => import('./pages/admin/cold-prospects/ColdProspectsList'));
const ColdProspectDetail = lazy(() => import('./pages/admin/cold-prospects/ColdProspectDetail'));
const OutreachLogPage = lazy(() => import('./pages/admin/outreach-log/OutreachLogPage'));
const AdminReferralsDashboard = lazy(() => import('./pages/admin/referrals/AdminReferralsDashboard'));
const AdminFunnelPage = lazy(() => import('./pages/admin/analytics/FunnelPage'));
const AdminTrendsPage = lazy(() => import('./pages/admin/analytics/TrendsPage'));
const AdminRevenuePage = lazy(() => import('./pages/admin/analytics/RevenuePage'));
const SystemSettingsPage = lazy(() => import('./pages/admin/settings/SystemSettingsPage'));
const ComingSoonSignupsPage = lazy(() => import('./pages/admin/settings/ComingSoonSignupsPage'));
const SeoManagerPage = lazy(() => import('./pages/admin/seo/SeoManagerPage'));

function App() {
  return (
    <HelmetProvider>
    <ThemeProvider>
      <CookieConsentProvider>
      <AuthProvider>
        <AdminProvider>
          <ToastProvider>
            <BrowserRouter>
              <SeoProvider>
              <SiteModeProvider>
              <SiteModeGuard>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/success" element={<RegisterSuccessPage />} />
                <Route path="/register/early-access-success" element={<EarlyAccessSuccessPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/auth/callback/:provider" element={<OAuthCallbackPage />} />
                <Route path="/auth/callback/gsc" element={<ProtectedRoute><GscCallbackPage /></ProtectedRoute>} />

                {/* Site invitation routes (public with token) */}
                <Route path="/site-invitations/:token" element={<SiteInvitationPage />} />

                {/* Email unsubscribe (public with token) */}
                <Route path="/email/unsubscribe" element={<UnsubscribePage />} />

                {/* Public pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:serviceSlug" element={<ServiceDetailPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/waitlist" element={<WaitlistPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/author/chris-garlick" element={<AuthorPage />} />

                {/* API Docs (public) */}
                <Route path="/docs" element={<DocsOverviewPage />} />
                <Route path="/docs/authentication" element={<DocsAuthPage />} />
                <Route path="/docs/rate-limits" element={<DocsRateLimitsPage />} />
                <Route path="/docs/errors" element={<DocsErrorsPage />} />
                <Route path="/docs/endpoints" element={<DocsEndpointsPage />} />
                <Route path="/docs/objects" element={<DocsObjectsPage />} />

                {/* Public blog routes */}
                <Route path="/blog" element={<BlogPostListPage />} />
                <Route path="/blog/:slug" element={<BlogPostDetailPage />} />

                {/* Public shared audit report */}
                <Route path="/public/reports/:token" element={<SharedReportPage />} />

                {/* Protected routes */}
                <Route
                  path="/app/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits"
                  element={
                    <ProtectedRoute>
                      <AuditListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits/new"
                  element={
                    <ProtectedRoute>
                      <NewAuditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits/:id"
                  element={
                    <ProtectedRoute>
                      <AuditDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits/:id/pages/:pageId"
                  element={
                    <ProtectedRoute>
                      <PageDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits/:id/statement"
                  element={
                    <ProtectedRoute>
                      <AccessibilityStatementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/audits/:id/compliance"
                  element={
                    <ProtectedRoute>
                      <ComplianceReportPage />
                    </ProtectedRoute>
                  }
                />

                {/* Site routes */}
                <Route
                  path="/app/sites"
                  element={
                    <ProtectedRoute>
                      <SiteListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/sites/:siteId"
                  element={
                    <ProtectedRoute>
                      <SiteDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/sites/:siteId/urls/:urlId"
                  element={
                    <ProtectedRoute>
                      <SiteDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Schedule routes */}
                <Route
                  path="/app/schedules"
                  element={
                    <ProtectedRoute>
                      <ScheduleListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/schedules/:id"
                  element={
                    <ProtectedRoute>
                      <ScheduleDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Referrals route */}
                <Route
                  path="/app/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Analytics routes */}
                <Route
                  path="/app/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/analytics/sites/:siteId"
                  element={
                    <ProtectedRoute>
                      <SiteAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/analytics/sites/:siteId/urls/:urlId"
                  element={
                    <ProtectedRoute>
                      <UrlAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/analytics/compare"
                  element={
                    <ProtectedRoute>
                      <AuditComparison />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/app/analytics/compare-sites"
                  element={
                    <ProtectedRoute>
                      <SiteComparison />
                    </ProtectedRoute>
                  }
                />

                {/* Compare page (unified) */}
                <Route
                  path="/app/compare"
                  element={
                    <ProtectedRoute>
                      <ComparePage />
                    </ProtectedRoute>
                  }
                />

                {/* Search Console */}
                <Route
                  path="/app/search-console"
                  element={
                    <ProtectedRoute>
                      <SearchConsolePage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings routes with unified layout */}
                <Route
                  path="/app/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/app/settings/profile" replace />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="sites" element={<SitesSettingsPage />} />
                  <Route path="branding" element={<BrandingSettingsPage />} />
                  <Route path="notifications" element={<NotificationSettingsPage />} />
                  <Route path="api-keys" element={<ApiKeysPage />} />
                </Route>

                {/* Legacy profile route redirect */}
                <Route path="/app/profile" element={<Navigate to="/app/settings/profile" replace />} />

                {/* Admin routes (super admin only) */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/organizations"
                  element={
                    <AdminRoute>
                      <AdminOrganizationsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/activity"
                  element={
                    <AdminRoute>
                      <AdminActivityPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/bug-reports"
                  element={
                    <AdminRoute>
                      <AdminBugReportsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/bug-reports/:id"
                  element={
                    <AdminRoute>
                      <AdminBugReportDetailPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/feature-requests"
                  element={
                    <AdminRoute>
                      <AdminFeatureRequestsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/feature-requests/:id"
                  element={
                    <AdminRoute>
                      <AdminFeatureRequestDetailPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Schedule routes */}
                <Route
                  path="/admin/schedules"
                  element={
                    <AdminRoute>
                      <AdminSchedulesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/schedules/:id"
                  element={
                    <AdminRoute>
                      <AdminScheduleDetailPage />
                    </AdminRoute>
                  }
                />

                {/* Admin CRM routes */}
                <Route
                  path="/admin/crm/leads"
                  element={
                    <AdminRoute>
                      <AdminLeadsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/crm/leads/:leadId"
                  element={
                    <AdminRoute>
                      <AdminLeadDetailPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/crm/triggers"
                  element={
                    <AdminRoute>
                      <AdminTriggersPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Email routes */}
                <Route
                  path="/admin/email/templates"
                  element={
                    <AdminRoute>
                      <AdminTemplatesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/templates/new"
                  element={
                    <AdminRoute>
                      <AdminTemplateEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/templates/:id"
                  element={
                    <AdminRoute>
                      <AdminTemplateEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/campaigns"
                  element={
                    <AdminRoute>
                      <AdminCampaignsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/campaigns/new"
                  element={
                    <AdminRoute>
                      <AdminCampaignEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/campaigns/:id"
                  element={
                    <AdminRoute>
                      <AdminCampaignEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/email/analytics"
                  element={
                    <AdminRoute>
                      <AdminEmailAnalyticsPage />
                    </AdminRoute>
                  }
                />

                {/* Admin CMS routes */}
                <Route
                  path="/admin/cms/posts"
                  element={
                    <AdminRoute>
                      <AdminPostsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/posts/new"
                  element={
                    <AdminRoute>
                      <AdminPostEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/posts/:id/edit"
                  element={
                    <AdminRoute>
                      <AdminPostEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/media"
                  element={
                    <AdminRoute>
                      <AdminMediaPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/advice"
                  element={
                    <AdminRoute>
                      <AdminAdvicePage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/announcements"
                  element={
                    <AdminRoute>
                      <AdminAnnouncementsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cms/stories"
                  element={
                    <AdminRoute>
                      <AdminStoriesPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Marketing routes */}
                <Route
                  path="/admin/marketing/content"
                  element={
                    <AdminRoute>
                      <AdminMarketingContentListPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/marketing/content/new"
                  element={
                    <AdminRoute>
                      <AdminMarketingContentEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/marketing/content/:id/edit"
                  element={
                    <AdminRoute>
                      <AdminMarketingContentEditorPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/marketing/campaigns"
                  element={
                    <AdminRoute>
                      <AdminMarketingCampaignsPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Cold Prospects routes */}
                <Route
                  path="/admin/cold-prospects"
                  element={
                    <AdminRoute>
                      <ColdProspectsDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cold-prospects/list"
                  element={
                    <AdminRoute>
                      <ColdProspectsList />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/cold-prospects/:id"
                  element={
                    <AdminRoute>
                      <ColdProspectDetail />
                    </AdminRoute>
                  }
                />

                {/* Admin Outreach Log route */}
                <Route
                  path="/admin/outreach-log"
                  element={
                    <AdminRoute>
                      <OutreachLogPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Referrals route */}
                <Route
                  path="/admin/referrals"
                  element={
                    <AdminRoute>
                      <AdminReferralsDashboard />
                    </AdminRoute>
                  }
                />

                {/* Admin Early Access route */}
                <Route
                  path="/admin/early-access"
                  element={
                    <AdminRoute>
                      <AdminEarlyAccessPage />
                    </AdminRoute>
                  }
                />

                {/* Admin System Settings routes */}
                <Route
                  path="/admin/settings"
                  element={
                    <AdminRoute>
                      <SystemSettingsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/coming-soon"
                  element={
                    <AdminRoute>
                      <ComingSoonSignupsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/seo"
                  element={
                    <AdminRoute>
                      <SeoManagerPage />
                    </AdminRoute>
                  }
                />

                {/* Admin Analytics routes */}
                <Route
                  path="/admin/analytics/funnel"
                  element={
                    <AdminRoute>
                      <AdminFunnelPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics/trends"
                  element={
                    <AdminRoute>
                      <AdminTrendsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/analytics/revenue"
                  element={
                    <AdminRoute>
                      <AdminRevenuePage />
                    </AdminRoute>
                  }
                />

                {/* Error routes */}
                <Route path="/error" element={<ServerErrorPage />} />

                {/* Catch all - 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </Suspense>
              </SiteModeGuard>
              </SiteModeProvider>
              </SeoProvider>
            </BrowserRouter>
          </ToastProvider>
        </AdminProvider>
      </AuthProvider>
      </CookieConsentProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
