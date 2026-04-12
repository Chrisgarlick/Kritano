/**
 * System Settings Service — Generic key-value settings store
 */
import { Pool } from 'pg';
export declare function setPool(dbPool: Pool): void;
export declare function getSetting(key: string): Promise<unknown>;
export declare function setSetting(key: string, value: unknown, updatedBy?: string): Promise<void>;
export declare function getAllSettings(): Promise<Record<string, unknown>>;
export declare function isComingSoonEnabled(): Promise<boolean>;
export declare function getSiteMode(): Promise<'waitlist' | 'early_access' | 'live'>;
//# sourceMappingURL=system-settings.service.d.ts.map