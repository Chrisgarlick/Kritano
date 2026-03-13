// Bug Report Types

export type BugReportSeverity = 'critical' | 'major' | 'minor' | 'trivial';
export type BugReportCategory = 'ui' | 'functionality' | 'performance' | 'data' | 'security' | 'other';
export type BugReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type BugReportPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
}

export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: BugReportSeverity;
  category: BugReportCategory;
  page_url: string | null;
  user_agent: string | null;
  screen_size: string | null;
  browser_info: BrowserInfo | null;
  screenshot_url: string | null;
  screenshot_key: string | null;
  status: BugReportStatus;
  priority: BugReportPriority | null;
  assigned_to: string | null;
  admin_notes: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  deleted_at: string | null;
  // Joined fields
  reporter_email?: string;
  reporter_first_name?: string;
  reporter_last_name?: string;
}

export interface BugReportComment {
  id: string;
  bug_report_id: string;
  user_id: string;
  is_admin_comment: boolean;
  content: string;
  created_at: string;
  // Joined fields
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface BugReportWithComments extends BugReport {
  comments: BugReportComment[];
}

export interface CreateBugReportData {
  userId: string;
  title: string;
  description: string;
  severity: BugReportSeverity;
  category: BugReportCategory;
  pageUrl?: string;
  userAgent?: string;
  screenSize?: string;
  browserInfo?: BrowserInfo;
  screenshotUrl?: string;
  screenshotKey?: string;
}

export interface UpdateBugReportData {
  status?: BugReportStatus;
  priority?: BugReportPriority | null;
  adminNotes?: string;
  resolutionNotes?: string;
  assignedTo?: string | null;
}

export interface AddCommentData {
  reportId: string;
  userId: string;
  content: string;
  isAdmin: boolean;
}

export interface ListOptions {
  page: number;
  limit: number;
  status?: string;
}

export interface AdminListOptions extends ListOptions {
  severity?: string;
  category?: string;
  search?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface BugReportStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  critical_open: number;
  last_7_days: number;
  last_24_hours: number;
}
