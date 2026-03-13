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
