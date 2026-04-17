import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { apiKeysApi, type ApiKey } from '../../services/api';
import { Info, Key, Copy, Check, Trash2, Ban, Plus } from 'lucide-react';

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([
    'audits:read',
    'audits:write',
    'findings:read',
    'findings:write',
    'exports:read',
  ]);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await apiKeysApi.list();
      setKeys(response.data.keys);
    } catch (err) {
      toast('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast('Please enter a name for the API key', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await apiKeysApi.create({ name: newKeyName.trim(), scopes: newKeyScopes });
      setNewKeySecret(response.data.secretKey);
      setKeys((prev) => [response.data.key, ...prev]);
      toast('API key created successfully', 'success');
    } catch (err) {
      toast('Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to revoke "${keyName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await apiKeysApi.revoke(keyId);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, isActive: false, revokedAt: new Date().toISOString() } : k
        )
      );
      toast('API key revoked', 'success');
    } catch (err) {
      toast('Failed to revoke API key', 'error');
    }
  };

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${keyName}"?`)) {
      return;
    }

    try {
      await apiKeysApi.delete(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      toast('API key deleted', 'success');
    } catch (err) {
      toast('Failed to delete API key', 'error');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast('Copied to clipboard', 'success');
    } catch {
      toast('Failed to copy', 'error');
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewKeyName('');
    setNewKeySecret(null);
    setNewKeyScopes(['audits:read', 'audits:write', 'findings:read', 'findings:write', 'exports:read']);
    setCopiedKey(false);
  };

  const toggleScope = (scope: string) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const activeKeys = keys.filter((k) => k.isActive && !k.revokedAt);
  const revokedKeys = keys.filter((k) => !k.isActive || k.revokedAt);

  return (
    <>
      <Helmet>
        <title>API Keys | Kritano</title>
        <meta name="description" content="Manage your Kritano API keys for programmatic access to website auditing." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div className="flex">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-300">API Access</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
              Use API keys to integrate Kritano with your CI/CD pipeline, custom scripts, or other tools.
              Keys have access to create audits, view results, and export data.
            </p>
          </div>
        </div>
      </div>

      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your API Keys</h3>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            {activeKeys.length} active key{activeKeys.length !== 1 ? 's' : ''} (max 10)
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={activeKeys.length >= 10}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {activeKeys.length >= 10 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          Maximum of 10 active API keys reached. Revoke an existing key to create a new one.
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-500 mt-4">Loading API keys...</p>
        </div>
      )}

      {/* Active keys */}
      {!loading && activeKeys.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-base font-medium text-slate-900 dark:text-white">Active Keys</h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {activeKeys.map((key) => (
              <li key={key.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white">{key.name}</h4>
                        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-500">
                          {key.keyPrefix}...
                        </code>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 ml-11">
                      <span>Created {formatRelativeTime(key.createdAt)}</span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>Last used {formatRelativeTime(key.lastUsedAt)}</span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>{key.requestCount.toLocaleString()} requests</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeKey(key.id, key.name)}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    <Ban className="w-4 h-4 mr-1.5" />
                    Revoke
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {!loading && activeKeys.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No API keys yet</h3>
          <p className="text-slate-500 dark:text-slate-500 mb-6 max-w-sm mx-auto">
            Create your first API key to start integrating Kritano with your applications.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </div>
      )}

      {/* Revoked keys */}
      {!loading && revokedKeys.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="text-base font-medium text-slate-500 dark:text-slate-500">
              Revoked Keys ({revokedKeys.length})
            </h3>
          </div>
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {revokedKeys.map((key) => (
              <li key={key.id} className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <Key className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-500 line-through">
                          {key.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">
                            {key.keyPrefix}...
                          </code>
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                            Revoked
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 ml-11">
                      Revoked {formatRelativeTime(key.revokedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id, key.name)}
                    className="text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={closeCreateModal} aria-hidden="true"></div>
            <div role="dialog" aria-modal="true" aria-labelledby="create-api-key-title" className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
              {!newKeySecret ? (
                <>
                  <h3 id="create-api-key-title" className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create API Key</h3>
                  <div className="mb-4">
                    <label htmlFor="keyName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., CI Pipeline, Development"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      autoFocus
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      Give your key a descriptive name to remember what it's used for.
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      {[
                        { scope: 'audits:read', label: 'Read Audits', desc: 'View and list audits' },
                        { scope: 'audits:write', label: 'Write Audits', desc: 'Create, cancel, and delete audits' },
                        { scope: 'findings:read', label: 'Read Findings', desc: 'View audit findings and details' },
                        { scope: 'findings:write', label: 'Write Findings', desc: 'Dismiss and manage findings' },
                        { scope: 'exports:read', label: 'Export Data', desc: 'Export audit data (CSV, JSON, PDF)' },
                      ].map(({ scope, label, desc }) => (
                        <label
                          key={scope}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newKeyScopes.includes(scope)}
                            onChange={() => toggleScope(scope)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>
                            <p className="text-xs text-slate-500 dark:text-slate-500">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {newKeyScopes.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Select at least one permission.</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={closeCreateModal}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey} isLoading={creating} disabled={newKeyScopes.length === 0}>
                      Create Key
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Key Created</h3>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <div className="flex">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Save this key now!</strong> It won't be shown again.
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your API Key</label>
                    <div className="flex">
                      <code className="flex-1 bg-slate-900 text-emerald-400 px-3 py-2 rounded-l-lg text-sm font-mono overflow-x-auto">
                        {newKeySecret}
                      </code>
                      <button
                        onClick={() => copyToClipboard(newKeySecret)}
                        className="px-3 py-2 bg-slate-800 text-white rounded-r-lg hover:bg-slate-700 transition-colors"
                      >
                        {copiedKey ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Quick Start</h4>
                    <code className="block text-xs bg-slate-900 text-slate-100 p-2 rounded overflow-x-auto">
                      curl -H "Authorization: Bearer {newKeySecret.slice(0, 20)}..." \<br />
                      &nbsp;&nbsp;https://app.kritano.io/api/v1/audits
                    </code>
                  </div>

                  <Button className="w-full" onClick={closeCreateModal}>
                    Done
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
