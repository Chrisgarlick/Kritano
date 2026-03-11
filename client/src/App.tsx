import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/ui/Toast';
import HomePage from './pages/Home';
import NotFoundPage from './pages/errors/NotFound';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />

            {/* Placeholder routes for future phases */}
            <Route path="/login" element={<PlaceholderPage title="Login" phase={2} />} />
            <Route path="/register" element={<PlaceholderPage title="Register" phase={2} />} />
            <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" phase={2} />} />
            <Route path="/audits" element={<PlaceholderPage title="Audits" phase={3} />} />
            <Route path="/sites" element={<PlaceholderPage title="Sites" phase={4} />} />
            <Route path="/settings/*" element={<PlaceholderPage title="Settings" phase={2} />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
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
