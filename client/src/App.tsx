import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { ToastProvider } from './components/ui/Toast';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { CookieConsentProvider } from './contexts/CookieConsentContext';
import { SettingsLayout } from './components/layout/SettingsLayout';
import HomePage from './pages/Home';
import SiteListPage from './pages/sites/SiteList';
import SiteDetailPage from './pages/sites/SiteDetail';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import RegisterSuccessPage from './pages/auth/RegisterSuccess';
import VerifyEmailPage from './pages/auth/VerifyEmail';
import DashboardPage from './pages/dashboard/Dashboard';
import ProfilePage from './pages/settings/Profile';
import AuditListPage from './pages/audits/AuditList';
import AuditDetailPage from './pages/audits/AuditDetail';
import NewAuditPage from './pages/audits/NewAudit';
import PageDetailPage from './pages/audits/PageDetail';
import NotFoundPage from './pages/errors/NotFound';
import PricingPage from './pages/public/Pricing';
import EarlyAccessSuccessPage from './pages/auth/EarlyAccessSuccess';
import { ComingSoonGuard } from './components/ComingSoonGuard';
import ScheduleListPage from './pages/schedules/ScheduleListPage';
import ScheduleDetailPage from './pages/schedules/ScheduleDetailPage';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import SiteAnalytics from './pages/analytics/SiteAnalytics';
import UrlAnalytics from './pages/analytics/UrlAnalytics';
import AuditComparison from './pages/analytics/AuditComparison';
import SiteComparison from './pages/analytics/SiteComparison';
import SiteInvitationPage from './pages/invitations/SiteInvitation';
import { AdminRoute } from './routes/AdminRoute';
import AdminDashboardPage from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsers';
import AdminOrganizationsPage from './pages/admin/AdminOrganizations';
import AdminActivityPage from './pages/admin/AdminActivity';
import AdminBugReportsPage from './pages/admin/AdminBugReports';
import AdminBugReportDetailPage from './pages/admin/AdminBugReportDetail';
import AdminFeatureRequestsPage from './pages/admin/AdminFeatureRequests';
import AdminFeatureRequestDetailPage from './pages/admin/AdminFeatureRequestDetail';
import AdminSchedulesPage from './pages/admin/AdminSchedules';
import AdminScheduleDetailPage from './pages/admin/AdminScheduleDetail';
import AdminEarlyAccessPage from './pages/admin/AdminEarlyAccess';
import AdminFunnelPage from './pages/admin/analytics/FunnelPage';
import AdminTrendsPage from './pages/admin/analytics/TrendsPage';
import AdminRevenuePage from './pages/admin/analytics/RevenuePage';
import AdminSeoManagerPage from './pages/admin/seo/SeoManagerPage';
import AdminSystemSettingsPage from './pages/admin/settings/SystemSettingsPage';
import AdminComingSoonSignupsPage from './pages/admin/settings/ComingSoonSignupsPage';
import AdminLeadsPage from './pages/admin/crm/LeadsPage';
import AdminLeadDetailPage from './pages/admin/crm/LeadDetailPage';
import AdminTriggersPage from './pages/admin/crm/TriggersPage';
import AdminTemplatesPage from './pages/admin/email/TemplatesPage';
import AdminTemplateEditorPage from './pages/admin/email/TemplateEditorPage';
import AdminCampaignsPage from './pages/admin/email/CampaignsPage';
import AdminCampaignEditorPage from './pages/admin/email/CampaignEditorPage';
import AdminEmailAnalyticsPage from './pages/admin/email/EmailAnalyticsPage';
import UnsubscribePage from './pages/email/UnsubscribePage';
import AdminPostsPage from './pages/admin/cms/PostsPage';
import AdminPostEditorPage from './pages/admin/cms/PostEditorPage';
import AdminMediaPage from './pages/admin/cms/MediaPage';
import AdminStoriesPage from './pages/admin/cms/StoriesPage';
import AdminAdvicePage from './pages/admin/cms/AdvicePage';
import AdminAnnouncementsPage from './pages/admin/cms/AnnouncementsPage';
import AdminColdProspectsDashboard from './pages/admin/cold-prospects/ColdProspectsDashboard';
import AdminColdProspectsList from './pages/admin/cold-prospects/ColdProspectsList';
import AdminColdProspectDetail from './pages/admin/cold-prospects/ColdProspectDetail';
import AdminMarketingContentList from './pages/admin/marketing/ContentListPage';
import AdminMarketingContentEditor from './pages/admin/marketing/ContentEditorPage';
import AdminMarketingCampaigns from './pages/admin/marketing/CampaignsPage';
import BlogPostList from './pages/blog/PostListPage';
import BlogPostDetail from './pages/blog/PostDetailPage';
import ApiKeysPage from './pages/settings/ApiKeys';
import ReferralDashboard from './pages/referrals/ReferralDashboard';
import AdminReferralsDashboard from './pages/admin/referrals/AdminReferralsDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <ToastProvider>
            <CookieConsentProvider>
            <BrowserRouter>
              <ComingSoonGuard>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/success" element={<RegisterSuccessPage />} />
                <Route path="/register/early-access-success" element={<EarlyAccessSuccessPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/invitations/:token" element={<SiteInvitationPage />} />
                <Route path="/email/unsubscribe" element={<UnsubscribePage />} />
                <Route path="/blog" element={<BlogPostList />} />
                <Route path="/blog/:slug" element={<BlogPostDetail />} />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings routes */}
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
                  <Route path="api-keys" element={<ApiKeysPage />} />
                </Route>

                {/* Legacy profile route redirect */}
                <Route path="/profile" element={<Navigate to="/settings/profile" replace />} />

                {/* Audit routes */}
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
                {/* Referrals */}
                <Route
                  path="/referrals"
                  element={
                    <ProtectedRoute>
                      <ReferralDashboard />
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

                {/* Admin routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                <Route path="/admin/organizations" element={<AdminRoute><AdminOrganizationsPage /></AdminRoute>} />
                <Route path="/admin/activity" element={<AdminRoute><AdminActivityPage /></AdminRoute>} />
                <Route path="/admin/bug-reports" element={<AdminRoute><AdminBugReportsPage /></AdminRoute>} />
                <Route path="/admin/bug-reports/:id" element={<AdminRoute><AdminBugReportDetailPage /></AdminRoute>} />
                <Route path="/admin/feature-requests" element={<AdminRoute><AdminFeatureRequestsPage /></AdminRoute>} />
                <Route path="/admin/feature-requests/:id" element={<AdminRoute><AdminFeatureRequestDetailPage /></AdminRoute>} />
                <Route path="/admin/schedules" element={<AdminRoute><AdminSchedulesPage /></AdminRoute>} />
                <Route path="/admin/schedules/:id" element={<AdminRoute><AdminScheduleDetailPage /></AdminRoute>} />
                <Route path="/admin/early-access" element={<AdminRoute><AdminEarlyAccessPage /></AdminRoute>} />
                <Route path="/admin/analytics/funnel" element={<AdminRoute><AdminFunnelPage /></AdminRoute>} />
                <Route path="/admin/analytics/trends" element={<AdminRoute><AdminTrendsPage /></AdminRoute>} />
                <Route path="/admin/analytics/revenue" element={<AdminRoute><AdminRevenuePage /></AdminRoute>} />
                <Route path="/admin/seo" element={<AdminRoute><AdminSeoManagerPage /></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><AdminSystemSettingsPage /></AdminRoute>} />
                <Route path="/admin/coming-soon" element={<AdminRoute><AdminComingSoonSignupsPage /></AdminRoute>} />
                <Route path="/admin/crm/leads" element={<AdminRoute><AdminLeadsPage /></AdminRoute>} />
                <Route path="/admin/crm/leads/:userId" element={<AdminRoute><AdminLeadDetailPage /></AdminRoute>} />
                <Route path="/admin/crm/triggers" element={<AdminRoute><AdminTriggersPage /></AdminRoute>} />
                <Route path="/admin/email/templates" element={<AdminRoute><AdminTemplatesPage /></AdminRoute>} />
                <Route path="/admin/email/templates/:id" element={<AdminRoute><AdminTemplateEditorPage /></AdminRoute>} />
                <Route path="/admin/email/templates/new" element={<AdminRoute><AdminTemplateEditorPage /></AdminRoute>} />
                <Route path="/admin/email/campaigns" element={<AdminRoute><AdminCampaignsPage /></AdminRoute>} />
                <Route path="/admin/email/campaigns/:id" element={<AdminRoute><AdminCampaignEditorPage /></AdminRoute>} />
                <Route path="/admin/email/campaigns/new" element={<AdminRoute><AdminCampaignEditorPage /></AdminRoute>} />
                <Route path="/admin/email/analytics" element={<AdminRoute><AdminEmailAnalyticsPage /></AdminRoute>} />
                <Route path="/admin/cms/posts" element={<AdminRoute><AdminPostsPage /></AdminRoute>} />
                <Route path="/admin/cms/posts/new" element={<AdminRoute><AdminPostEditorPage /></AdminRoute>} />
                <Route path="/admin/cms/posts/:id" element={<AdminRoute><AdminPostEditorPage /></AdminRoute>} />
                <Route path="/admin/cms/media" element={<AdminRoute><AdminMediaPage /></AdminRoute>} />
                <Route path="/admin/cms/stories" element={<AdminRoute><AdminStoriesPage /></AdminRoute>} />
                <Route path="/admin/cms/advice" element={<AdminRoute><AdminAdvicePage /></AdminRoute>} />
                <Route path="/admin/cms/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
                <Route path="/admin/cold-prospects" element={<AdminRoute><AdminColdProspectsDashboard /></AdminRoute>} />
                <Route path="/admin/cold-prospects/list" element={<AdminRoute><AdminColdProspectsList /></AdminRoute>} />
                <Route path="/admin/cold-prospects/:id" element={<AdminRoute><AdminColdProspectDetail /></AdminRoute>} />
                <Route path="/admin/marketing/content" element={<AdminRoute><AdminMarketingContentList /></AdminRoute>} />
                <Route path="/admin/marketing/content/new" element={<AdminRoute><AdminMarketingContentEditor /></AdminRoute>} />
                <Route path="/admin/marketing/content/:id" element={<AdminRoute><AdminMarketingContentEditor /></AdminRoute>} />
                <Route path="/admin/marketing/campaigns" element={<AdminRoute><AdminMarketingCampaigns /></AdminRoute>} />

                <Route path="/admin/referrals" element={<AdminRoute><AdminReferralsDashboard /></AdminRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              </ComingSoonGuard>
            </BrowserRouter>
            </CookieConsentProvider>
          </ToastProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
