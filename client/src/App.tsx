import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { SettingsLayout } from './components/layout/SettingsLayout';
import Home from './pages/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import RegisterSuccessPage from './pages/auth/RegisterSuccess';
import VerifyEmailPage from './pages/auth/VerifyEmail';
import DashboardPage from './pages/dashboard/Dashboard';
import AuditListPage from './pages/audits/AuditList';
import NewAuditPage from './pages/audits/NewAudit';
import AuditDetailPage from './pages/audits/AuditDetail';
import PageDetailPage from './pages/audits/PageDetail';
import ApiKeysPage from './pages/settings/ApiKeys';
import ProfilePage from './pages/settings/Profile';
import SitesSettingsPage from './pages/settings/SitesSettings';
import BrandingSettingsPage from './pages/settings/BrandingSettings';
import NotificationSettingsPage from './pages/settings/NotificationSettings';
import SiteInvitationPage from './pages/invitations/SiteInvitation';
import UnsubscribePage from './pages/email/UnsubscribePage';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsers';
import AdminOrganizationsPage from './pages/admin/AdminOrganizations';
import AdminActivityPage from './pages/admin/AdminActivity';
import AdminBugReportsPage from './pages/admin/AdminBugReports';
import AdminBugReportDetailPage from './pages/admin/AdminBugReportDetail';
import AdminFeatureRequestsPage from './pages/admin/AdminFeatureRequests';
import AdminFeatureRequestDetailPage from './pages/admin/AdminFeatureRequestDetail';
// CRM
import AdminLeadsPage from './pages/admin/crm/LeadsPage';
import AdminLeadDetailPage from './pages/admin/crm/LeadDetailPage';
import AdminTriggersPage from './pages/admin/crm/TriggersPage';
// Email
import AdminTemplatesPage from './pages/admin/email/TemplatesPage';
import AdminTemplateEditorPage from './pages/admin/email/TemplateEditorPage';
import AdminCampaignsPage from './pages/admin/email/CampaignsPage';
import AdminCampaignEditorPage from './pages/admin/email/CampaignEditorPage';
import AdminEmailAnalyticsPage from './pages/admin/email/EmailAnalyticsPage';
// CMS
import AdminPostsPage from './pages/admin/cms/PostsPage';
import AdminPostEditorPage from './pages/admin/cms/PostEditorPage';
import AdminMediaPage from './pages/admin/cms/MediaPage';
import AdminAdvicePage from './pages/admin/cms/AdvicePage';
import AdminAnnouncementsPage from './pages/admin/cms/AnnouncementsPage';
import AdminStoriesPage from './pages/admin/cms/StoriesPage';
// Marketing
import AdminMarketingContentListPage from './pages/admin/marketing/ContentListPage';
import AdminMarketingContentEditorPage from './pages/admin/marketing/ContentEditorPage';
import AdminMarketingCampaignsPage from './pages/admin/marketing/CampaignsPage';
// Cold Prospects
import ColdProspectsDashboard from './pages/admin/cold-prospects/ColdProspectsDashboard';
import ColdProspectsList from './pages/admin/cold-prospects/ColdProspectsList';
import ColdProspectDetail from './pages/admin/cold-prospects/ColdProspectDetail';
// Referrals
import ReferralDashboard from './pages/referrals/ReferralDashboard';
import AdminReferralsDashboard from './pages/admin/referrals/AdminReferralsDashboard';
// Admin Analytics
import AdminFunnelPage from './pages/admin/analytics/FunnelPage';
import AdminTrendsPage from './pages/admin/analytics/TrendsPage';
import AdminRevenuePage from './pages/admin/analytics/RevenuePage';
import SiteListPage from './pages/sites/SiteList';
import SiteDetailPage from './pages/sites/SiteDetail';
import ScheduleListPage from './pages/schedules/ScheduleListPage';
import ScheduleDetailPage from './pages/schedules/ScheduleDetailPage';
import AdminSchedulesPage from './pages/admin/AdminSchedules';
import AdminScheduleDetailPage from './pages/admin/AdminScheduleDetail';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import SiteAnalytics from './pages/analytics/SiteAnalytics';
import UrlAnalytics from './pages/analytics/UrlAnalytics';
import AuditComparison from './pages/analytics/AuditComparison';
import SiteComparison from './pages/analytics/SiteComparison';
import ComparePage from './pages/compare/ComparePage';
// Blog (public)
import BlogPostListPage from './pages/blog/PostListPage';
import BlogPostDetailPage from './pages/blog/PostDetailPage';
// Public pages
import AboutPage from './pages/public/About';
import ServicesPage from './pages/public/Services';
import PricingPage from './pages/public/Pricing';
import ContactPage from './pages/public/Contact';
import TermsPage from './pages/public/Terms';
import PrivacyPage from './pages/public/Privacy';
import ServiceDetailPage from './pages/public/services/ServiceDetailPage';
// API Docs (public)
import DocsOverviewPage from './pages/docs/DocsOverviewPage';
import DocsAuthPage from './pages/docs/DocsAuthPage';
import DocsRateLimitsPage from './pages/docs/DocsRateLimitsPage';
import DocsErrorsPage from './pages/docs/DocsErrorsPage';
import DocsEndpointsPage from './pages/docs/DocsEndpointsPage';
import DocsObjectsPage from './pages/docs/DocsObjectsPage';
import NotFoundPage from './pages/errors/NotFound';
import ServerErrorPage from './pages/errors/ServerError';
import { ComingSoonGuard } from './components/ComingSoonGuard';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import EarlyAccessSuccessPage from './pages/auth/EarlyAccessSuccess';
import AdminEarlyAccessPage from './pages/admin/AdminEarlyAccess';
import SystemSettingsPage from './pages/admin/settings/SystemSettingsPage';
import ComingSoonSignupsPage from './pages/admin/settings/ComingSoonSignupsPage';
// SEO Management
import SeoManagerPage from './pages/admin/seo/SeoManagerPage';
import { SeoProvider } from './hooks/useSeoOverrides';

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
              <ComingSoonGuard>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/success" element={<RegisterSuccessPage />} />
                <Route path="/register/early-access-success" element={<EarlyAccessSuccessPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

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
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

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

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audits"
                  element={
                    <ProtectedRoute>
                      <AuditListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audits/new"
                  element={
                    <ProtectedRoute>
                      <NewAuditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audits/:id"
                  element={
                    <ProtectedRoute>
                      <AuditDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/audits/:id/pages/:pageId"
                  element={
                    <ProtectedRoute>
                      <PageDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Site routes */}
                <Route
                  path="/sites"
                  element={
                    <ProtectedRoute>
                      <SiteListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sites/:siteId"
                  element={
                    <ProtectedRoute>
                      <SiteDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sites/:siteId/urls/:urlId"
                  element={
                    <ProtectedRoute>
                      <SiteDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Schedule routes */}
                <Route
                  path="/schedules"
                  element={
                    <ProtectedRoute>
                      <ScheduleListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedules/:id"
                  element={
                    <ProtectedRoute>
                      <ScheduleDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Referrals route */}
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Analytics routes */}
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <AnalyticsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/sites/:siteId"
                  element={
                    <ProtectedRoute>
                      <SiteAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/sites/:siteId/urls/:urlId"
                  element={
                    <ProtectedRoute>
                      <UrlAnalytics />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/compare"
                  element={
                    <ProtectedRoute>
                      <AuditComparison />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics/compare-sites"
                  element={
                    <ProtectedRoute>
                      <SiteComparison />
                    </ProtectedRoute>
                  }
                />

                {/* Compare page (unified) */}
                <Route
                  path="/compare"
                  element={
                    <ProtectedRoute>
                      <ComparePage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings routes with unified layout */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/settings/profile" replace />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="sites" element={<SitesSettingsPage />} />
                  <Route path="branding" element={<BrandingSettingsPage />} />
                  <Route path="notifications" element={<NotificationSettingsPage />} />
                  <Route path="api-keys" element={<ApiKeysPage />} />
                </Route>

                {/* Legacy profile route redirect */}
                <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />

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
              </ComingSoonGuard>
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
