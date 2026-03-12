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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <ToastProvider>
            <CookieConsentProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/register/success" element={<RegisterSuccessPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

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
                <Route path="/analytics" element={<PlaceholderPage title="Analytics" phase={7} />} />
                <Route path="/schedules" element={<PlaceholderPage title="Schedules" phase={7} />} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            </CookieConsentProvider>
          </ToastProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Coming in Phase {phase}
        </p>
      </div>
    </div>
  );
}

export default App;
