# Bug Reporting Feature - Implementation Plan

## Overview

This feature allows authenticated users to report bugs directly from the PagePulser application. Reports are stored in the database and displayed in a dedicated admin panel section for review, status tracking, and resolution.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Report trigger** | Floating button + modal | Non-intrusive, always accessible |
| **Authentication** | Required | Prevents spam, enables follow-up |
| **File attachments** | Screenshots only (v1) | Most valuable for bug reports |
| **Status workflow** | 4 states | Simple but sufficient |
| **Notifications** | Email on status change | Keeps users informed |
| **Priority system** | Auto + manual | User severity + admin priority |

---

## Database Changes

### New Table: `bug_reports`

```sql
CREATE TABLE bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reporter info
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

    -- Report content
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'major', 'minor', 'trivial')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('ui', 'functionality', 'performance', 'data', 'security', 'other')),

    -- Context (auto-captured)
    page_url TEXT,
    user_agent TEXT,
    screen_size VARCHAR(20),
    browser_info JSONB,  -- { name, version, os }

    -- Screenshot (optional)
    screenshot_url TEXT,  -- S3/storage URL
    screenshot_key TEXT,  -- Storage key for deletion

    -- Admin management
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity) WHERE deleted_at IS NULL;
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX idx_bug_reports_organization ON bug_reports(organization_id) WHERE organization_id IS NOT NULL;

-- Updated timestamp trigger
CREATE TRIGGER update_bug_reports_updated_at
    BEFORE UPDATE ON bug_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### New Table: `bug_report_comments`

For admin-user communication on reports:

```sql
CREATE TABLE bug_report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin_comment BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bug_report_comments_report ON bug_report_comments(bug_report_id, created_at);
```

---

## Backend Changes

### New Files

```
server/src/
├── routes/
│   └── bug-reports/
│       └── index.ts          # User-facing bug report routes
├── services/
│   └── bug-report.service.ts # Business logic
└── types/
    └── bug-report.types.ts   # TypeScript interfaces
```

### API Endpoints

#### User Endpoints (Protected by `authenticate`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bug-reports` | Create new bug report |
| `GET` | `/api/bug-reports/mine` | List user's own reports |
| `GET` | `/api/bug-reports/:id` | Get report details (own only) |
| `POST` | `/api/bug-reports/:id/comments` | Add comment to own report |
| `POST` | `/api/bug-reports/upload-screenshot` | Upload screenshot (presigned URL) |

#### Admin Endpoints (Protected by `requireSuperAdmin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/bug-reports` | List all reports (paginated, filterable) |
| `GET` | `/api/admin/bug-reports/stats` | Dashboard statistics |
| `GET` | `/api/admin/bug-reports/:id` | Get full report with comments |
| `PATCH` | `/api/admin/bug-reports/:id` | Update status, priority, notes |
| `POST` | `/api/admin/bug-reports/:id/comments` | Add admin comment |
| `DELETE` | `/api/admin/bug-reports/:id` | Soft delete report |

### Route Implementation

#### `server/src/routes/bug-reports/index.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware';
import { bugReportService } from '../../services/bug-report.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createReportSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']),
  category: z.enum(['ui', 'functionality', 'performance', 'data', 'security', 'other']),
  pageUrl: z.string().url().optional(),
  screenshotUrl: z.string().url().optional(),
  screenshotKey: z.string().optional(),
  browserInfo: z.object({
    name: z.string(),
    version: z.string(),
    os: z.string(),
  }).optional(),
  screenSize: z.string().optional(),
});

// Create bug report
router.post('/', async (req, res) => {
  const data = createReportSchema.parse(req.body);
  const report = await bugReportService.create({
    ...data,
    userId: req.user!.id,
    organizationId: req.user!.currentOrganizationId,
    userAgent: req.headers['user-agent'],
  });
  res.status(201).json({ report });
});

// List my reports
router.get('/mine', async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const reports = await bugReportService.listByUser(req.user!.id, {
    page: Number(page),
    limit: Number(limit),
    status: status as string,
  });
  res.json(reports);
});

// Get single report (own only)
router.get('/:id', async (req, res) => {
  const report = await bugReportService.getById(req.params.id, req.user!.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ report });
});

// Add comment
router.post('/:id/comments', async (req, res) => {
  const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
  const comment = await bugReportService.addComment({
    reportId: req.params.id,
    userId: req.user!.id,
    content,
    isAdmin: false,
  });
  res.status(201).json({ comment });
});

export default router;
```

### Service Implementation

#### `server/src/services/bug-report.service.ts`

```typescript
import { Pool } from 'pg';

let pool: Pool;

export function initializeBugReportService(dbPool: Pool) {
  pool = dbPool;
}

export const bugReportService = {
  async create(data: CreateBugReportData): Promise<BugReport> {
    const result = await pool.query(
      `INSERT INTO bug_reports (
        user_id, organization_id, title, description, severity, category,
        page_url, user_agent, screen_size, browser_info,
        screenshot_url, screenshot_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        data.userId, data.organizationId, data.title, data.description,
        data.severity, data.category, data.pageUrl, data.userAgent,
        data.screenSize, data.browserInfo, data.screenshotUrl, data.screenshotKey
      ]
    );
    return result.rows[0];
  },

  async listByUser(userId: string, options: ListOptions): Promise<PaginatedResult<BugReport>> {
    const { page, limit, status } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM bug_reports
      WHERE user_id = $1 AND deleted_at IS NULL
    `;
    const params: any[] = [userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [reports, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM bug_reports WHERE user_id = $1 AND deleted_at IS NULL`,
        [userId]
      ),
    ]);

    return {
      items: reports.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  async getById(id: string, userId?: string): Promise<BugReport | null> {
    let query = `
      SELECT br.*,
        u.email as reporter_email,
        u.first_name as reporter_first_name,
        u.last_name as reporter_last_name,
        o.name as organization_name
      FROM bug_reports br
      JOIN users u ON br.user_id = u.id
      LEFT JOIN organizations o ON br.organization_id = o.id
      WHERE br.id = $1 AND br.deleted_at IS NULL
    `;
    const params: any[] = [id];

    if (userId) {
      params.push(userId);
      query += ` AND br.user_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    return result.rows[0] || null;
  },

  async getWithComments(id: string): Promise<BugReportWithComments | null> {
    const report = await this.getById(id);
    if (!report) return null;

    const comments = await pool.query(
      `SELECT c.*, u.email, u.first_name, u.last_name
       FROM bug_report_comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.bug_report_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );

    return { ...report, comments: comments.rows };
  },

  async addComment(data: AddCommentData): Promise<Comment> {
    // Verify report exists and user has access
    const report = data.isAdmin
      ? await this.getById(data.reportId)
      : await this.getById(data.reportId, data.userId);

    if (!report) {
      throw new Error('Report not found');
    }

    const result = await pool.query(
      `INSERT INTO bug_report_comments (bug_report_id, user_id, is_admin_comment, content)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.reportId, data.userId, data.isAdmin, data.content]
    );

    return result.rows[0];
  },

  // Admin methods
  async listAll(options: AdminListOptions): Promise<PaginatedResult<BugReport>> {
    const { page, limit, status, severity, category, search } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT br.*,
        u.email as reporter_email,
        o.name as organization_name
      FROM bug_reports br
      JOIN users u ON br.user_id = u.id
      LEFT JOIN organizations o ON br.organization_id = o.id
      WHERE br.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` AND br.status = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      query += ` AND br.severity = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND br.category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (br.title ILIKE $${params.length} OR br.description ILIKE $${params.length})`;
    }

    const countQuery = query.replace('SELECT br.*, u.email as reporter_email, o.name as organization_name', 'SELECT COUNT(*)');

    query += ` ORDER BY
      CASE br.severity
        WHEN 'critical' THEN 1
        WHEN 'major' THEN 2
        WHEN 'minor' THEN 3
        ELSE 4
      END,
      br.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [reports, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    return {
      items: reports.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  },

  async update(id: string, data: UpdateBugReportData): Promise<BugReport> {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (data.status !== undefined) {
      params.push(data.status);
      setClauses.push(`status = $${params.length}`);

      if (data.status === 'resolved') {
        setClauses.push(`resolved_at = NOW()`);
      }
    }
    if (data.priority !== undefined) {
      params.push(data.priority);
      setClauses.push(`priority = $${params.length}`);
    }
    if (data.adminNotes !== undefined) {
      params.push(data.adminNotes);
      setClauses.push(`admin_notes = $${params.length}`);
    }
    if (data.resolutionNotes !== undefined) {
      params.push(data.resolutionNotes);
      setClauses.push(`resolution_notes = $${params.length}`);
    }
    if (data.assignedTo !== undefined) {
      params.push(data.assignedTo);
      setClauses.push(`assigned_to = $${params.length}`);
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE bug_reports SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} AND deleted_at IS NULL
       RETURNING *`,
      params
    );

    return result.rows[0];
  },

  async getStats(): Promise<BugReportStats> {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
        COUNT(*) FILTER (WHERE status = 'open' AND deleted_at IS NULL) as open,
        COUNT(*) FILTER (WHERE status = 'in_progress' AND deleted_at IS NULL) as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved' AND deleted_at IS NULL) as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status IN ('open', 'in_progress') AND deleted_at IS NULL) as critical_open,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL) as last_7_days,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours' AND deleted_at IS NULL) as last_24_hours
      FROM bug_reports
    `);

    return result.rows[0];
  },

  async softDelete(id: string): Promise<void> {
    await pool.query(
      `UPDATE bug_reports SET deleted_at = NOW() WHERE id = $1`,
      [id]
    );
  },
};
```

### Admin Routes Addition

Add to `server/src/routes/admin/index.ts`:

```typescript
// Bug Reports Management
router.get('/bug-reports', async (req, res) => {
  const { page = 1, limit = 25, status, severity, category, search } = req.query;
  const reports = await bugReportService.listAll({
    page: Number(page),
    limit: Math.min(Number(limit), 100),
    status: status as string,
    severity: severity as string,
    category: category as string,
    search: search as string,
  });
  res.json(reports);
});

router.get('/bug-reports/stats', async (req, res) => {
  const stats = await bugReportService.getStats();
  res.json(stats);
});

router.get('/bug-reports/:id', async (req, res) => {
  const report = await bugReportService.getWithComments(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ report });
});

router.patch('/bug-reports/:id', async (req, res) => {
  const schema = z.object({
    status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
    adminNotes: z.string().max(5000).optional(),
    resolutionNotes: z.string().max(5000).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
  });

  const data = schema.parse(req.body);
  const report = await bugReportService.update(req.params.id, data);

  await logAdminActivity(req, 'update_bug_report', 'bug_report', req.params.id, data);

  res.json({ report });
});

router.post('/bug-reports/:id/comments', async (req, res) => {
  const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
  const comment = await bugReportService.addComment({
    reportId: req.params.id,
    userId: req.admin!.id,
    content,
    isAdmin: true,
  });

  // TODO: Send email notification to user

  res.status(201).json({ comment });
});

router.delete('/bug-reports/:id', async (req, res) => {
  await bugReportService.softDelete(req.params.id);
  await logAdminActivity(req, 'delete_bug_report', 'bug_report', req.params.id, {});
  res.json({ success: true });
});
```

---

## Frontend Changes

### New Files

```
client/src/
├── components/
│   └── bug-report/
│       ├── BugReportButton.tsx      # Floating trigger button
│       ├── BugReportModal.tsx       # Report form modal
│       └── ScreenshotCapture.tsx    # Screenshot functionality
├── pages/
│   ├── bug-reports/
│   │   └── MyBugReports.tsx         # User's own reports list
│   └── admin/
│       ├── AdminBugReports.tsx      # Admin list view
│       └── AdminBugReportDetail.tsx # Admin detail view
└── services/
    └── api.ts                       # Add bug report API methods
```

### Bug Report Button Component

#### `client/src/components/bug-report/BugReportButton.tsx`

```tsx
import { useState } from 'react';
import { Bug } from 'lucide-react';
import { BugReportModal } from './BugReportModal';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button - bottom right, above any chat widgets */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-slate-800 dark:bg-slate-700
                   text-white rounded-full shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600
                   transition-all hover:scale-105 group"
        title="Report a bug"
        aria-label="Report a bug"
      >
        <Bug className="w-5 h-5" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2
                         bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg
                         opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Report a bug
        </span>
      </button>

      <BugReportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
```

### Bug Report Modal Component

#### `client/src/components/bug-report/BugReportModal.tsx`

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Camera, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { bugReportsApi } from '../../services/api';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Please provide more detail (20+ characters)').max(5000),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']),
  category: z.enum(['ui', 'functionality', 'performance', 'data', 'security', 'other']),
});

type FormData = z.infer<typeof schema>;

const severityOptions = [
  { value: 'critical', label: 'Critical', description: 'App is broken, data loss' },
  { value: 'major', label: 'Major', description: 'Feature not working' },
  { value: 'minor', label: 'Minor', description: 'Something is off' },
  { value: 'trivial', label: 'Trivial', description: 'Small cosmetic issue' },
];

const categoryOptions = [
  { value: 'ui', label: 'UI/Visual' },
  { value: 'functionality', label: 'Functionality' },
  { value: 'performance', label: 'Performance' },
  { value: 'data', label: 'Data/Reports' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: Props) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      severity: 'minor',
      category: 'functionality',
    },
  });

  const captureScreenshot = async () => {
    try {
      // Use html2canvas or similar
      // For now, placeholder
      toast('Screenshot capture coming soon', 'info');
    } catch (err) {
      toast('Failed to capture screenshot', 'error');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const browserInfo = {
        name: navigator.userAgent.includes('Chrome') ? 'Chrome' :
              navigator.userAgent.includes('Firefox') ? 'Firefox' :
              navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
        version: navigator.userAgent.match(/(?:Chrome|Firefox|Safari)\/(\d+)/)?.[1] || 'Unknown',
        os: navigator.platform,
      };

      await bugReportsApi.create({
        ...data,
        pageUrl: window.location.href,
        browserInfo,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        screenshotUrl: screenshot || undefined,
      });

      setSubmitted(true);
      setTimeout(() => {
        reset();
        setScreenshot(null);
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      toast('Failed to submit bug report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl
                      w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Report a Bug
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Thanks for reporting!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              We'll look into this and keep you updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-4 space-y-4">
              {/* Title */}
              <Input
                label="What's the issue?"
                placeholder="Brief description of the problem"
                error={errors.title?.message}
                {...register('title')}
              />

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Severity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {severityOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start p-3 border rounded-lg cursor-pointer
                               hover:bg-slate-50 dark:hover:bg-slate-700
                               has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50
                               dark:has-[:checked]:bg-indigo-900/30"
                    >
                      <input
                        type="radio"
                        value={option.value}
                        className="mt-0.5 text-indigo-600"
                        {...register('severity')}
                      />
                      <div className="ml-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {option.label}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600
                           rounded-lg bg-white dark:bg-slate-800
                           text-slate-900 dark:text-white"
                  {...register('category')}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Describe the issue
                </label>
                <textarea
                  rows={4}
                  placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600
                           rounded-lg bg-white dark:bg-slate-800
                           text-slate-900 dark:text-white resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Screenshot */}
              <div>
                <button
                  type="button"
                  onClick={captureScreenshot}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600
                           dark:text-slate-400 border border-dashed border-slate-300
                           dark:border-slate-600 rounded-lg hover:bg-slate-50
                           dark:hover:bg-slate-700 w-full justify-center"
                >
                  <Camera className="w-4 h-4" />
                  {screenshot ? 'Screenshot attached' : 'Capture screenshot (optional)'}
                </button>
              </div>

              {/* Context info */}
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50
                            dark:bg-slate-900 p-3 rounded-lg">
                <p className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  We'll automatically include your current page URL and browser info.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

### Admin Bug Reports Page

#### `client/src/pages/admin/AdminBugReports.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bug, AlertTriangle, Clock, CheckCircle, Filter, Search } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../services/api';

const statusColors = {
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  closed: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

const severityColors = {
  critical: 'text-red-600 dark:text-red-400',
  major: 'text-orange-600 dark:text-orange-400',
  minor: 'text-amber-600 dark:text-amber-400',
  trivial: 'text-slate-600 dark:text-slate-400',
};

export default function AdminBugReports() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    search: '',
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, statsRes] = await Promise.all([
        adminApi.getBugReports({ page, ...filters }),
        adminApi.getBugReportStats(),
      ]);
      setReports(reportsRes.data.items);
      setStats(statsRes.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Bug Reports</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Manage user-submitted bug reports
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Open</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.open}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Bug className="w-5 h-5" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.in_progress}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">Critical Open</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.critical_open}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.resolved}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600
                       rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600
                     rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600
                     rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="trivial">Trivial</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Report</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reporter</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {reports.map((report: any) => (
              <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{report.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{report.category}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`font-medium ${severityColors[report.severity]}`}>
                    {report.severity}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[report.status]}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {report.reporter_email}
                </td>
                <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                  {new Date(report.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <Link to={`/admin/bug-reports/${report.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
```

### API Client Updates

Add to `client/src/services/api.ts`:

```typescript
export const bugReportsApi = {
  create: (data: CreateBugReportData) =>
    api.post('/bug-reports', data),

  listMine: (params?: { page?: number; status?: string }) =>
    api.get('/bug-reports/mine', { params }),

  getById: (id: string) =>
    api.get(`/bug-reports/${id}`),

  addComment: (id: string, content: string) =>
    api.post(`/bug-reports/${id}/comments`, { content }),
};

// Add to adminApi
export const adminApi = {
  // ... existing methods ...

  getBugReports: (params: BugReportListParams) =>
    api.get('/admin/bug-reports', { params }),

  getBugReportStats: () =>
    api.get('/admin/bug-reports/stats'),

  getBugReport: (id: string) =>
    api.get(`/admin/bug-reports/${id}`),

  updateBugReport: (id: string, data: UpdateBugReportData) =>
    api.patch(`/admin/bug-reports/${id}`, data),

  addBugReportComment: (id: string, content: string) =>
    api.post(`/admin/bug-reports/${id}/comments`, { content }),

  deleteBugReport: (id: string) =>
    api.delete(`/admin/bug-reports/${id}`),
};
```

---

## Route Updates

### Frontend Routes

Add to `client/src/App.tsx`:

```tsx
import AdminBugReportsPage from './pages/admin/AdminBugReports';
import AdminBugReportDetailPage from './pages/admin/AdminBugReportDetail';
import MyBugReportsPage from './pages/bug-reports/MyBugReports';

// In Routes:
// User bug reports
<Route
  path="/bug-reports"
  element={
    <ProtectedRoute>
      <MyBugReportsPage />
    </ProtectedRoute>
  }
/>

// Admin bug reports
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
```

### Backend Routes

Add to `server/src/routes/index.ts`:

```typescript
import bugReportsRouter from './bug-reports';

// In configureRoutes:
app.use('/api/bug-reports', bugReportsRouter);
```

---

## Sidebar Navigation Update

Add "Bug Reports" to admin section in `Sidebar.tsx`:

```tsx
const mainNavItems: NavItem[] = [
  // ... existing items ...
  { href: '/admin', label: 'Admin', icon: Shield, adminOnly: true },
  { href: '/admin/bug-reports', label: 'Bug Reports', icon: Bug, adminOnly: true },
];
```

---

## Email Notifications (Optional Enhancement)

### Status Change Email

When admin updates status, send email to reporter:

```typescript
// In bug-report.service.ts update method
if (data.status && data.status !== existingReport.status) {
  await emailService.sendBugReportStatusUpdate({
    to: report.reporter_email,
    reportTitle: report.title,
    newStatus: data.status,
    resolutionNotes: data.resolutionNotes,
  });
}
```

### Email Template

```html
Subject: Update on your bug report: {{title}}

Hi {{firstName}},

Your bug report "{{title}}" has been updated.

New Status: {{status}}

{{#if resolutionNotes}}
Resolution Notes:
{{resolutionNotes}}
{{/if}}

You can view the full details at: {{reportUrl}}

Thanks for helping us improve PagePulser!

The PagePulser Team
```

---

## Testing Plan

### Unit Tests

1. **Service tests**
   - Create bug report with valid data
   - Create bug report with invalid data (validation)
   - List user's own reports
   - Prevent access to other users' reports
   - Admin can list all reports
   - Admin can update status/priority
   - Comment creation and retrieval

2. **API tests**
   - Authentication required for all endpoints
   - Admin endpoints require super admin
   - Pagination works correctly
   - Filters apply correctly

### Integration Tests

1. **User flow**
   - Open bug report modal
   - Fill form and submit
   - View submitted report in "My Reports"
   - Add comment to own report

2. **Admin flow**
   - View bug reports list
   - Filter by status/severity
   - View report detail
   - Update status
   - Add admin comment
   - Delete report

### E2E Tests

1. Complete user submission flow
2. Complete admin management flow
3. Email notification delivery (if implemented)

---

## Implementation Order

### Phase 1: Database & Backend (Day 1-2)
1. [ ] Create migration for `bug_reports` table
2. [ ] Create migration for `bug_report_comments` table
3. [ ] Create `bug-report.service.ts`
4. [ ] Create user-facing routes (`/api/bug-reports`)
5. [ ] Add admin routes to existing admin router
6. [ ] Add TypeScript types

### Phase 2: User-Facing Frontend (Day 3-4)
1. [ ] Create `BugReportButton` component
2. [ ] Create `BugReportModal` component
3. [ ] Add bug report button to DashboardLayout
4. [ ] Add API client methods
5. [ ] Create "My Bug Reports" page (optional)

### Phase 3: Admin Frontend (Day 5-6)
1. [ ] Create `AdminBugReports` list page
2. [ ] Create `AdminBugReportDetail` page
3. [ ] Add routes to App.tsx
4. [ ] Add sidebar navigation item
5. [ ] Update admin dashboard to show bug report stats

### Phase 4: Polish (Day 7)
1. [ ] Screenshot capture functionality
2. [ ] Email notifications
3. [ ] Testing
4. [ ] Documentation

---

## Critical Files Summary

### New Files
| File | Purpose |
|------|---------|
| `server/src/services/bug-report.service.ts` | Business logic |
| `server/src/routes/bug-reports/index.ts` | User API routes |
| `server/src/types/bug-report.types.ts` | TypeScript types |
| `client/src/components/bug-report/BugReportButton.tsx` | Floating trigger |
| `client/src/components/bug-report/BugReportModal.tsx` | Report form |
| `client/src/pages/admin/AdminBugReports.tsx` | Admin list |
| `client/src/pages/admin/AdminBugReportDetail.tsx` | Admin detail |
| `client/src/pages/bug-reports/MyBugReports.tsx` | User's reports |

### Modified Files
| File | Changes |
|------|---------|
| `server/src/routes/admin/index.ts` | Add bug report admin routes |
| `server/src/routes/index.ts` | Register bug-reports router |
| `client/src/App.tsx` | Add routes |
| `client/src/services/api.ts` | Add API methods |
| `client/src/components/layout/Sidebar.tsx` | Add nav item |
| `client/src/components/layout/DashboardLayout.tsx` | Add BugReportButton |

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Users can only view/comment on own reports; admins can view all
3. **Input validation**: Zod schemas on all inputs
4. **XSS prevention**: Sanitize user input in descriptions
5. **Rate limiting**: Consider limiting report creation (e.g., 10/hour)
6. **File uploads**: If screenshots implemented, validate file type and size
7. **Activity logging**: All admin actions logged for audit trail
