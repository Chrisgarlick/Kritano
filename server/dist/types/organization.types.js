"use strict";
// Organization Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.ROLE_PERMISSIONS = {
    owner: [
        'org:read', 'org:write', 'org:delete',
        'billing:read', 'billing:write',
        'team:read', 'team:invite', 'team:remove', 'team:role',
        'domain:read', 'domain:write',
        'audit:read', 'audit:create', 'audit:edit', 'audit:delete',
        'apikey:read', 'apikey:write',
        'schedule:read', 'schedule:write', 'schedule:delete',
        'export:create'
    ],
    admin: [
        'org:read', 'org:write',
        'billing:read', 'billing:write',
        'team:read', 'team:invite', 'team:remove', 'team:role',
        'domain:read', 'domain:write',
        'audit:read', 'audit:create', 'audit:edit', 'audit:delete',
        'apikey:read', 'apikey:write',
        'schedule:read', 'schedule:write', 'schedule:delete',
        'export:create'
    ],
    member: [
        'org:read',
        'team:read',
        'domain:read',
        'audit:read', 'audit:create', 'audit:edit',
        'apikey:read',
        'schedule:read', 'schedule:write',
        'export:create'
    ],
    viewer: [
        'org:read',
        'team:read',
        'domain:read',
        'audit:read',
        'schedule:read'
    ]
};
//# sourceMappingURL=organization.types.js.map