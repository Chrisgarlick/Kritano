import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the pool before importing the service
// ---------------------------------------------------------------------------

const mockQuery = vi.fn();

vi.mock('../db/index.js', () => ({
  pool: { query: (...args: unknown[]) => mockQuery(...args) },
}));

// The organization service uses a setPool pattern — we mock it at module level
let orgService: typeof import('../services/organization.service.js');

beforeEach(async () => {
  vi.clearAllMocks();
  // Re-import to get fresh module state
  orgService = await import('../services/organization.service.js');
  orgService.setPool({ query: mockQuery } as never);
});

describe('Organization Service', () => {
  describe('createOrganization', () => {
    it('creates an organization and returns it', async () => {
      // Slug uniqueness check
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // INSERT
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'org-1',
          name: 'Test Org',
          slug: 'test-org',
          owner_id: 'user-1',
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const result = await orgService.createOrganization('user-1', {
        name: 'Test Org',
      });

      expect(result.name).toBe('Test Org');
      expect(result.slug).toBe('test-org');
      expect(result.owner_id).toBe('user-1');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('throws if slug already exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-org' }] });

      await expect(
        orgService.createOrganization('user-1', { name: 'Test Org', slug: 'taken-slug' })
      ).rejects.toThrow('Organization slug already exists');
    });
  });

  describe('getOrganizationById', () => {
    it('returns the organization if found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
      });

      const org = await orgService.getOrganizationById('org-1');
      expect(org).not.toBeNull();
      expect(org?.name).toBe('My Org');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM organizations'),
        ['org-1']
      );
    });

    it('returns null if not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const org = await orgService.getOrganizationById('nonexistent');
      expect(org).toBeNull();
    });
  });

  describe('getOrganizationBySlug', () => {
    it('returns the organization for a valid slug', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
      });

      const org = await orgService.getOrganizationBySlug('my-org');
      expect(org).not.toBeNull();
      expect(org?.slug).toBe('my-org');
    });

    it('returns null for unknown slug', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const org = await orgService.getOrganizationBySlug('nope');
      expect(org).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('updates name and returns updated org', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'org-1', name: 'Updated Org', slug: 'my-org', owner_id: 'user-1' }],
      });

      const org = await orgService.updateOrganization('org-1', { name: 'Updated Org' });
      expect(org.name).toBe('Updated Org');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE organizations'),
        expect.arrayContaining(['Updated Org'])
      );
    });

    it('throws when updating to a taken slug', async () => {
      // Slug uniqueness check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'other-org' }] });

      await expect(
        orgService.updateOrganization('org-1', { slug: 'taken-slug' })
      ).rejects.toThrow('Organization slug already exists');
    });

    it('returns existing org when no updates provided', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
      });

      const org = await orgService.updateOrganization('org-1', {});
      expect(org.name).toBe('My Org');
    });
  });
});
