"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---------------------------------------------------------------------------
// Mock the pool before importing the service
// ---------------------------------------------------------------------------
const mockQuery = vitest_1.vi.fn();
vitest_1.vi.mock('../db/index.js', () => ({
    pool: { query: (...args) => mockQuery(...args) },
}));
// The organization service uses a setPool pattern — we mock it at module level
let orgService;
(0, vitest_1.beforeEach)(async () => {
    vitest_1.vi.clearAllMocks();
    // Re-import to get fresh module state
    orgService = await import('../services/organization.service.js');
    orgService.setPool({ query: mockQuery });
});
(0, vitest_1.describe)('Organization Service', () => {
    (0, vitest_1.describe)('createOrganization', () => {
        (0, vitest_1.it)('creates an organization and returns it', async () => {
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
            (0, vitest_1.expect)(result.name).toBe('Test Org');
            (0, vitest_1.expect)(result.slug).toBe('test-org');
            (0, vitest_1.expect)(result.owner_id).toBe('user-1');
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('throws if slug already exists', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'existing-org' }] });
            await (0, vitest_1.expect)(orgService.createOrganization('user-1', { name: 'Test Org', slug: 'taken-slug' })).rejects.toThrow('Organization slug already exists');
        });
    });
    (0, vitest_1.describe)('getOrganizationById', () => {
        (0, vitest_1.it)('returns the organization if found', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
            });
            const org = await orgService.getOrganizationById('org-1');
            (0, vitest_1.expect)(org).not.toBeNull();
            (0, vitest_1.expect)(org?.name).toBe('My Org');
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SELECT * FROM organizations'), ['org-1']);
        });
        (0, vitest_1.it)('returns null if not found', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const org = await orgService.getOrganizationById('nonexistent');
            (0, vitest_1.expect)(org).toBeNull();
        });
    });
    (0, vitest_1.describe)('getOrganizationBySlug', () => {
        (0, vitest_1.it)('returns the organization for a valid slug', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
            });
            const org = await orgService.getOrganizationBySlug('my-org');
            (0, vitest_1.expect)(org).not.toBeNull();
            (0, vitest_1.expect)(org?.slug).toBe('my-org');
        });
        (0, vitest_1.it)('returns null for unknown slug', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const org = await orgService.getOrganizationBySlug('nope');
            (0, vitest_1.expect)(org).toBeNull();
        });
    });
    (0, vitest_1.describe)('updateOrganization', () => {
        (0, vitest_1.it)('updates name and returns updated org', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ id: 'org-1', name: 'Updated Org', slug: 'my-org', owner_id: 'user-1' }],
            });
            const org = await orgService.updateOrganization('org-1', { name: 'Updated Org' });
            (0, vitest_1.expect)(org.name).toBe('Updated Org');
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE organizations'), vitest_1.expect.arrayContaining(['Updated Org']));
        });
        (0, vitest_1.it)('throws when updating to a taken slug', async () => {
            // Slug uniqueness check
            mockQuery.mockResolvedValueOnce({ rows: [{ id: 'other-org' }] });
            await (0, vitest_1.expect)(orgService.updateOrganization('org-1', { slug: 'taken-slug' })).rejects.toThrow('Organization slug already exists');
        });
        (0, vitest_1.it)('returns existing org when no updates provided', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{ id: 'org-1', name: 'My Org', slug: 'my-org', owner_id: 'user-1' }],
            });
            const org = await orgService.updateOrganization('org-1', {});
            (0, vitest_1.expect)(org.name).toBe('My Org');
        });
    });
});
//# sourceMappingURL=organization.service.test.js.map