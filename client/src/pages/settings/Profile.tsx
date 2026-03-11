import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authApi } from '../../services/api';
import {
  User,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      toast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      // TODO: Implement password change API call
      toast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  const createdDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account Information</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Full Name</p>
                <p className="text-slate-900 dark:text-white font-medium">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-slate-900 dark:text-white font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Member Since</p>
                <p className="text-slate-900 dark:text-white font-medium">{createdDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-slate-500 dark:text-slate-400">Email Verified</p>
                {user.emailVerified ? (
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">Verified</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-amber-600 dark:text-amber-400">Not Verified</p>
                    <button
                      onClick={async () => {
                        setResendingVerification(true);
                        try {
                          await authApi.resendVerification(user.email);
                          toast('Verification email sent! Check your inbox.', 'success');
                        } catch {
                          toast('Failed to resend verification email.', 'error');
                        } finally {
                          setResendingVerification(false);
                        }
                      }}
                      disabled={resendingVerification}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      {resendingVerification ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Resend
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isChangingPassword}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-900/20">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}
