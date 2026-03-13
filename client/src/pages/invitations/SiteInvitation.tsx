import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { siteInvitationsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import type { SitePermission } from '../../types/site.types';
import { PERMISSION_INFO } from '../../types/site.types';

interface SiteInvitationInfo {
  id: string;
  email: string;
  permission: SitePermission;
  siteName: string;
  siteDomain: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export default function SiteInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<SiteInvitationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await siteInvitationsApi.get(token!);
      setInvitation(response.data.invitation);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to load invitation';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation || !token) return;

    // If not authenticated, redirect to login with return URL
    if (!isAuthenticated) {
      navigate(`/login?redirect=/site-invitations/${token}`);
      return;
    }

    try {
      setIsAccepting(true);
      const response = await siteInvitationsApi.accept(token);
      toast('Invitation accepted! You now have access to this site.', 'success');
      // Navigate to the site
      navigate(`/sites/${response.data.share.siteId}`);
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to accept invitation', 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    try {
      setIsDeclining(true);
      await siteInvitationsApi.decline(token);
      toast('Invitation declined', 'success');
      navigate('/');
    } catch (error: any) {
      toast(error.response?.data?.error || 'Failed to decline invitation', 'error');
    } finally {
      setIsDeclining(false);
    }
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invalid Invitation</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  // No invitation found
  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const permissionInfo = PERMISSION_INFO[invitation.permission];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">PagePulser</h2>
        </div>

        {isExpired ? (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invitation Expired</h1>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                This invitation has expired. Please contact the site owner for a new invitation.
              </p>
              <Link to="/" className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                Go to homepage
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Invitation Icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Site Access Invitation</h1>
            </div>

            {/* Invitation Details */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
              <p className="text-slate-600 dark:text-slate-400 text-center">
                {invitation.invitedBy} has invited you to access
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white text-center mt-1">
                {invitation.siteName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {invitation.siteDomain}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Permission Level:</span>
                  <span className="font-medium text-slate-900 dark:text-white capitalize">
                    {permissionInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {permissionInfo.description}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Invited as:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{invitation.email}</span>
                </div>
              </div>
            </div>

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-800 dark:text-indigo-300">
                  You'll need to log in or create an account to accept this invitation.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                isLoading={isAccepting}
                className="w-full"
              >
                {isAuthenticated ? 'Accept Invitation' : 'Log in to Accept'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDecline}
                isLoading={isDeclining}
                className="w-full"
              >
                Decline
              </Button>
            </div>

            {/* Expiry Notice */}
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
              This invitation expires on {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
