import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/api';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { AdminActivity, Pagination } from '../../types/admin.types';

export default function AdminActivityPage() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [pagination.page]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.getActivityLog({
        page: pagination.page,
        limit: pagination.limit,
      });
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
    } catch (error) {
      toast('Failed to load activity log', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('grant') || action.includes('create')) return 'text-emerald-400';
    if (action.includes('revoke') || action.includes('remove')) return 'text-amber-400';
    return 'text-indigo-400';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <AdminLayout>
      <Helmet><title>Admin: Activity | Kritano</title></Helmet>
      {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight font-display">
            Admin Activity Log
          </h1>
          <Button size="sm" variant="outline" onClick={loadActivities}>
            Refresh
          </Button>
        </div>

        {/* Activity Log */}
        <div className="bg-white/[0.02] rounded-lg border border-white/[0.06] overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No activity recorded yet</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {activities.map(activity => (
                <div key={activity.id} className="px-6 py-4 hover:bg-white/[0.04]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${getActionColor(activity.action)}`}>
                          {formatAction(activity.action)}
                        </span>
                        <span className="text-slate-500">by</span>
                        <span className="text-white">{activity.admin_email}</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        <span className="capitalize">{activity.target_type}</span>
                        {activity.target_id && (
                          <span className="ml-1 font-mono text-xs text-slate-500">
                            ({activity.target_id.slice(0, 8)}...)
                          </span>
                        )}
                      </div>
                      {Object.keys(activity.details).length > 0 && (
                        <div className="mt-2 text-xs font-mono bg-white/[0.03] rounded p-2 text-slate-500">
                          {JSON.stringify(activity.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-500">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-slate-500">
                        {new Date(activity.created_at).toLocaleTimeString()}
                      </div>
                      {activity.ip_address && (
                        <div className="text-xs text-slate-600 mt-1 font-mono">
                          {activity.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-slate-500">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
    </AdminLayout>
  );
}
